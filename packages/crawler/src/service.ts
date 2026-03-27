import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

import type {
  CrawlLinkSnapshot,
  CrawlPageSnapshot,
  CrawlRequest,
  CrawlResult,
  CrawlerService,
  RobotsSnapshot,
  SitemapSnapshot
} from "./types";
import { isInternalUrl, normalizeUrl, uniqueUrls } from "./url";

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const JS_ROOT_SELECTORS = ["#__next", "#app", "#root", "[data-reactroot]"];
const runtimeImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;

type BrowserLike = {
  newPage(): Promise<{
    goto(url: string, options: { waitUntil: "networkidle"; timeout: number }): Promise<void>;
    content(): Promise<string>;
  }>;
  close(): Promise<void>;
};

type RobotsRules = {
  parser: ReturnType<typeof robotsParser> | null;
  snapshot: RobotsSnapshot | null;
};

export class HttpCrawlerService implements CrawlerService {
  async crawl(request: CrawlRequest): Promise<CrawlResult> {
    const startUrl = normalizeUrl(request.startUrl);

    if (!startUrl) {
      throw new Error(`Invalid crawl start URL: ${request.startUrl}`);
    }

    const maxPages = request.maxPages ?? 50;
    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number; discoveredFrom: string | null }> = [{ url: startUrl, depth: 0, discoveredFrom: null }];
    const pages = new Map<string, CrawlPageSnapshot>();
    const links: CrawlLinkSnapshot[] = [];
    const discoveredUrls = new Set<string>([startUrl]);
    const robots = await this.fetchRobots(startUrl, request.userAgent);
    const sitemaps = await this.discoverSitemaps(startUrl, robots.snapshot, request.userAgent);

    while (queue.length > 0 && pages.size < maxPages) {
      const current = queue.shift();

      if (!current || visited.has(current.url)) {
        continue;
      }

      visited.add(current.url);

      if (robots.parser && !robots.parser.isAllowed(current.url, request.userAgent ?? "*")) {
        pages.set(current.url, {
          url: current.url,
          normalizedUrl: current.url,
          finalUrl: current.url,
          canonicalUrl: null,
          statusCode: 0,
          redirectChain: [],
          title: null,
          metaDescription: null,
          h1: null,
          metaRobots: "blocked-by-robots",
          xRobotsTag: null,
          contentType: null,
          wordCount: 0,
          schemaCount: 0,
          missingAltCount: 0,
          internalLinkCount: 0,
          htmlBytes: 0,
          depth: current.depth,
          isIndexableCandidate: false,
          discoveredFrom: current.discoveredFrom
        });
        continue;
      }

      const page = await this.fetchPage(current.url, current.depth, current.discoveredFrom, request);
      pages.set(page.normalizedUrl, page);

      if (page.statusCode >= 400) {
        continue;
      }

      const internalLinks = await this.extractLinks(page.finalUrl, request);

      for (const link of internalLinks) {
        links.push(link);
        discoveredUrls.add(link.normalizedToUrl);

        if (link.isInternal && !visited.has(link.normalizedToUrl) && queue.every((entry) => entry.url !== link.normalizedToUrl) && pages.size + queue.length < maxPages) {
          queue.push({
            url: link.normalizedToUrl,
            depth: current.depth + 1,
            discoveredFrom: page.normalizedUrl
          });
        }
      }
    }

    const pageUrls = new Map(Array.from(pages.values()).map((page) => [page.normalizedUrl, page]));

    for (const link of links) {
      const target = pageUrls.get(link.normalizedToUrl);

      if (target && target.statusCode >= 400) {
        link.isBroken = true;
      }
    }

    return {
      startUrl,
      pages: Array.from(pages.values()),
      links,
      robots: robots.snapshot,
      sitemaps,
      discoveredUrls: Array.from(discoveredUrls)
    };
  }

  private async fetchRobots(startUrl: string, userAgent?: string): Promise<RobotsRules> {
    const robotsUrl = new URL("/robots.txt", startUrl).toString();

    try {
      const response = await fetch(robotsUrl, {
        headers: this.getHeaders(userAgent)
      });
      const raw = response.ok ? await response.text() : null;

      if (!raw) {
        return { parser: null, snapshot: null };
      }

      const sitemapMatches = raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^sitemap:/i.test(line))
        .map((line) => line.split(":").slice(1).join(":").trim())
        .filter(Boolean);

      const blockedPaths = raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^disallow:/i.test(line))
        .map((line) => line.split(":").slice(1).join(":").trim())
        .filter(Boolean);

      return {
        parser: robotsParser(robotsUrl, raw),
        snapshot: {
          url: robotsUrl,
          raw,
          blockedPaths,
          sitemaps: sitemapMatches
        }
      };
    } catch {
      return { parser: null, snapshot: null };
    }
  }

  private async discoverSitemaps(startUrl: string, robots: RobotsSnapshot | null, userAgent?: string): Promise<SitemapSnapshot[]> {
    const defaults = robots?.sitemaps?.length ? robots.sitemaps : [new URL("/sitemap.xml", startUrl).toString()];
    const sitemaps: SitemapSnapshot[] = uniqueUrls(defaults).map((url) => ({
      url,
      source: robots?.sitemaps?.includes(url) ? "robots" : "default"
    }));

    for (const sitemap of [...sitemaps]) {
      try {
        const response = await fetch(sitemap.url, {
          headers: this.getHeaders(userAgent)
        });

        if (!response.ok) {
          continue;
        }

        const xml = await response.text();
        const nestedMatches = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g))
          .map((match) => match[1])
          .filter((match): match is string => Boolean(match));

        if (/sitemapindex/i.test(xml)) {
          for (const nested of nestedMatches) {
            if (!sitemaps.some((existing) => existing.url === nested)) {
              sitemaps.push({ url: nested, source: "sitemap-index" });
            }
          }
        }
      } catch {
        continue;
      }
    }

    return sitemaps;
  }

  private async fetchPage(url: string, depth: number, discoveredFrom: string | null, request: CrawlRequest): Promise<CrawlPageSnapshot> {
    const response = await this.fetchWithRedirects(url, request.userAgent);
    const contentType = response.response.headers.get("content-type");
    const finalUrl = normalizeUrl(response.finalUrl) ?? url;
    const html = contentType?.includes("text/html")
      ? await response.response.text()
      : "";

    const renderedHtml =
      request.playwrightFallback && this.shouldUsePlaywright(html)
        ? await this.tryRenderWithPlaywright(finalUrl)
        : null;
    const effectiveHtml = renderedHtml ?? html;
    const $ = effectiveHtml ? cheerio.load(effectiveHtml) : null;
    const bodyText = $ ? $("body").text().replace(/\s+/g, " ").trim() : "";
    const title = $ ? $("title").first().text().trim() || null : null;
    const metaDescription = $ ? $('meta[name="description"]').attr("content")?.trim() ?? null : null;
    const h1 = $ ? $("h1").first().text().replace(/\s+/g, " ").trim() || null : null;
    const metaRobots = $ ? $('meta[name="robots"]').attr("content")?.trim() ?? null : null;
    const xRobotsTag = response.response.headers.get("x-robots-tag");
    const canonicalUrl = $ ? normalizeUrl($('link[rel="canonical"]').attr("href") ?? "", finalUrl) : null;
    const schemaCount = $ ? $('script[type="application/ld+json"]').length : 0;
    const missingAltCount = $ ? $("img").toArray().filter((image) => !$(image).attr("alt")?.trim()).length : 0;
    const internalLinkCount = $ ? $("a[href]").toArray().filter((anchor) => isInternalUrl($(anchor).attr("href") ?? "", finalUrl)).length : 0;

    return {
      url,
      normalizedUrl: finalUrl,
      finalUrl,
      canonicalUrl,
      statusCode: response.response.status,
      redirectChain: response.redirectChain,
      title,
      metaDescription,
      h1,
      metaRobots,
      xRobotsTag,
      contentType,
      wordCount: bodyText ? bodyText.split(/\s+/).length : 0,
      schemaCount,
      missingAltCount,
      internalLinkCount,
      htmlBytes: effectiveHtml.length,
      depth,
      isIndexableCandidate: this.isIndexableCandidate(response.response.status, metaRobots, xRobotsTag),
      discoveredFrom
    };
  }

  private async extractLinks(url: string, request: CrawlRequest) {
    const response = await fetch(url, {
      headers: this.getHeaders(request.userAgent)
    });

    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const links: CrawlLinkSnapshot[] = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      const normalizedToUrl = normalizeUrl(href ?? "", url);

      if (!normalizedToUrl) {
        return;
      }

      links.push({
        fromUrl: url,
        toUrl: href ?? normalizedToUrl,
        normalizedToUrl,
        anchorText: $(element).text().replace(/\s+/g, " ").trim() || null,
        isInternal: isInternalUrl(normalizedToUrl, url),
        isBroken: false
      });
    });

    return links;
  }

  private async fetchWithRedirects(url: string, userAgent?: string) {
    const redirectChain: string[] = [];
    let current = url;
    let response = await fetch(current, {
      redirect: "manual",
      headers: this.getHeaders(userAgent)
    });

    while (REDIRECT_STATUS_CODES.has(response.status)) {
      const location = response.headers.get("location");

      if (!location) {
        break;
      }

      const nextUrl = normalizeUrl(location, current);

      if (!nextUrl || redirectChain.includes(nextUrl) || redirectChain.length > 8) {
        break;
      }

      redirectChain.push(nextUrl);
      current = nextUrl;
      response = await fetch(current, {
        redirect: "manual",
        headers: this.getHeaders(userAgent)
      });
    }

    if (REDIRECT_STATUS_CODES.has(response.status)) {
      response = await fetch(current, {
        redirect: "follow",
        headers: this.getHeaders(userAgent)
      });
    }

    return {
      response,
      finalUrl: response.url || current,
      redirectChain
    };
  }

  private getHeaders(userAgent?: string) {
    return {
      "user-agent": userAgent ?? "RankForgeBot/0.1 (+https://rankforge.local)"
    };
  }

  private isIndexableCandidate(statusCode: number, metaRobots: string | null, xRobotsTag: string | null) {
    if (statusCode >= 300) {
      return false;
    }

    const robotsDirectives = `${metaRobots ?? ""} ${xRobotsTag ?? ""}`.toLowerCase();

    return !robotsDirectives.includes("noindex");
  }

  private shouldUsePlaywright(html: string) {
    if (!html) {
      return false;
    }

    const scriptCount = (html.match(/<script/gi) ?? []).length;
    const bodyTextLength = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
    const hasJsRoot = JS_ROOT_SELECTORS.some((selector) => html.includes(selector.replace(/[[\]#.=]/g, "")));

    return scriptCount >= 8 && bodyTextLength < 500 && hasJsRoot;
  }

  private async tryRenderWithPlaywright(url: string) {
    let browser: BrowserLike | null = null;

    try {
      const playwright = await runtimeImport("playwright");
      const launchedBrowser = await playwright.chromium.launch({ headless: true });
      browser = launchedBrowser;
      const page = await launchedBrowser.newPage();
      await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      return await page.content();
    } catch {
      return null;
    } finally {
      await browser?.close();
    }
  }
}
