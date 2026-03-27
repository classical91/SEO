import { describe, expect, it } from "vitest";

import {
  getSearchConsoleAccessState,
  hasSearchConsoleScope,
  normalizeSearchConsolePropertyUrl,
  resolveSearchConsolePropertyInput,
  WEBMASTERS_READONLY_SCOPE
} from "@/lib/search-console";

describe("search-console helpers", () => {
  it("normalizes domain and url-prefix properties", () => {
    expect(normalizeSearchConsolePropertyUrl("sc-domain:Example.com/")).toBe("sc-domain:example.com");
    expect(normalizeSearchConsolePropertyUrl("https://example.com")).toBe("https://example.com/");
  });

  it("prefers manual property values when both inputs are provided", () => {
    expect(resolveSearchConsolePropertyInput("sc-domain:rankforge.dev", "https://rankforge.dev/")).toBe(
      "https://rankforge.dev/"
    );
  });

  it("detects the required Search Console scope", () => {
    expect(hasSearchConsoleScope(`openid email profile ${WEBMASTERS_READONLY_SCOPE}`)).toBe(true);
    expect(hasSearchConsoleScope("openid email profile")).toBe(false);
  });

  it("returns reauthorization state when the Google account cannot support background sync", () => {
    expect(
      getSearchConsoleAccessState({
        isGoogleAuthConfigured: true,
        account: {
          email: "owner@example.com",
          refreshToken: null,
          scope: "openid email profile"
        },
        properties: [],
        signInPath: "/api/auth/signin/google?callbackUrl=%2Fapp"
      }).mode
    ).toBe("needs_reauthorization");
  });
});
