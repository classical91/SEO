import { describe, expect, it } from "vitest";

import { isInternalUrl, normalizeUrl } from "./url";

describe("url helpers", () => {
  it("normalizes protocol, hostname, and trailing slash", () => {
    expect(normalizeUrl("HTTPS://Example.com/pricing/")).toBe("https://example.com/pricing");
  });

  it("detects internal urls", () => {
    expect(isInternalUrl("https://example.com/docs", "https://example.com")).toBe(true);
    expect(isInternalUrl("https://other.com/docs", "https://example.com")).toBe(false);
  });
});
