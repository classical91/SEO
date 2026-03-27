const DEFAULT_PROTOCOL = "https:";

export function toAbsoluteUrl(input: string, base?: string) {
  try {
    return new URL(input, base);
  } catch {
    return null;
  }
}

export function normalizeUrl(input: string, base?: string) {
  const parsed = toAbsoluteUrl(input, base);

  if (!parsed) {
    return null;
  }

  const protocol = parsed.protocol || DEFAULT_PROTOCOL;
  const normalized = new URL(parsed.toString());
  normalized.protocol = protocol;
  normalized.hash = "";

  if ((normalized.protocol === "https:" && normalized.port === "443") || (normalized.protocol === "http:" && normalized.port === "80")) {
    normalized.port = "";
  }

  normalized.hostname = normalized.hostname.toLowerCase();

  if (normalized.pathname !== "/") {
    normalized.pathname = normalized.pathname.replace(/\/+$/, "") || "/";
  }

  return normalized.toString();
}

export function isInternalUrl(candidate: string, rootUrl: string) {
  const root = toAbsoluteUrl(rootUrl);
  const target = toAbsoluteUrl(candidate);

  if (!root || !target) {
    return false;
  }

  return root.hostname === target.hostname;
}

export function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls));
}
