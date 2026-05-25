import { describe, expect, it } from "vitest";
import { isSameOrigin, normalizeDiscoveredUrl, normalizeInputUrl } from "./url.js";

describe("URL helpers", () => {
  it("normalizes bare domains", () => {
    expect(normalizeInputUrl("example.com").toString()).toBe("https://example.com/");
  });

  it("normalizes relative links and strips tracking params", () => {
    expect(normalizeDiscoveredUrl("/about?utm_source=test&a=1#team", "https://example.com")).toBe(
      "https://example.com/about?a=1"
    );
  });

  it("checks same origin", () => {
    expect(isSameOrigin("https://example.com/about", "https://example.com")).toBe(true);
    expect(isSameOrigin("https://docs.example.com/about", "https://example.com")).toBe(false);
  });
});
