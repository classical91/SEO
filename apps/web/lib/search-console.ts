import type { SearchConsoleProperty } from "@rankforge/integrations";

export const WEBMASTERS_READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export type GoogleAccountSnapshot = {
  email: string | null;
  refreshToken: string | null;
  scope: string | null;
};

export type SearchConsoleAccessState = {
  mode: "demo" | "needs_google_sign_in" | "needs_reauthorization" | "ready" | "error";
  message: string;
  properties: SearchConsoleProperty[];
  googleAccountEmail: string | null;
  hasRequiredScope: boolean;
  canManageConnection: boolean;
  isDemoMode: boolean;
  signInPath: string;
};

export function buildSearchConsoleSignInPath(callbackPath: string) {
  return `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export function hasSearchConsoleScope(scope: string | null | undefined) {
  return Boolean(
    scope
      ?.split(/\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .includes(WEBMASTERS_READONLY_SCOPE)
  );
}

export function normalizeSearchConsolePropertyUrl(input: string) {
  const value = input.trim();

  if (!value) {
    throw new Error("Search Console property URL is required.");
  }

  if (value.startsWith("sc-domain:")) {
    const hostname = value
      .slice("sc-domain:".length)
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase();

    if (!hostname) {
      throw new Error("Domain properties must use the format sc-domain:example.com.");
    }

    return `sc-domain:${hostname}`;
  }

  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https Search Console properties are supported.");
  }

  return url.toString();
}

export function resolveSearchConsolePropertyInput(selectedPropertyUrl: string, manualPropertyUrl: string) {
  const manualValue = manualPropertyUrl.trim();

  if (manualValue) {
    return normalizeSearchConsolePropertyUrl(manualValue);
  }

  return normalizeSearchConsolePropertyUrl(selectedPropertyUrl);
}

export function getSearchConsoleAccessState(input: {
  isGoogleAuthConfigured: boolean;
  account: GoogleAccountSnapshot | null;
  properties: SearchConsoleProperty[];
  signInPath: string;
  error?: string | null;
}): SearchConsoleAccessState {
  if (!input.isGoogleAuthConfigured) {
    return {
      mode: "demo",
      message: "Google OAuth is not configured yet, so Search Console stays in demo mode with mock properties.",
      properties: input.properties,
      googleAccountEmail: null,
      hasRequiredScope: false,
      canManageConnection: true,
      isDemoMode: true,
      signInPath: input.signInPath
    };
  }

  if (!input.account) {
    return {
      mode: "needs_google_sign_in",
      message: "Sign in with Google before connecting a Search Console property for this project.",
      properties: [],
      googleAccountEmail: null,
      hasRequiredScope: false,
      canManageConnection: false,
      isDemoMode: false,
      signInPath: input.signInPath
    };
  }

  const hasRequiredScope = input.account.scope ? hasSearchConsoleScope(input.account.scope) : true;

  if (!input.account.refreshToken || !hasRequiredScope) {
    return {
      mode: "needs_reauthorization",
      message: "Re-authorize Google access so RankForge can store an offline refresh token and read Search Console data.",
      properties: [],
      googleAccountEmail: input.account.email,
      hasRequiredScope,
      canManageConnection: false,
      isDemoMode: false,
      signInPath: input.signInPath
    };
  }

  if (input.error) {
    return {
      mode: "error",
      message: input.error,
      properties: [],
      googleAccountEmail: input.account.email,
      hasRequiredScope,
      canManageConnection: false,
      isDemoMode: false,
      signInPath: input.signInPath
    };
  }

  return {
    mode: "ready",
    message: input.properties.length
      ? "Google Search Console is ready. Pick a discovered property or paste an exact property URL."
      : "Google access is ready, but no verified Search Console properties were returned. Paste the exact property URL to continue.",
    properties: input.properties,
    googleAccountEmail: input.account.email,
    hasRequiredScope,
    canManageConnection: true,
    isDemoMode: false,
    signInPath: input.signInPath
  };
}
