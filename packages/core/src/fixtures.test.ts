import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createAudit } from "./scoring.js";
import type { CrawlResult, JsonValue, PageData, SiteAsset } from "./types.js";

describe("fixture-based analyzer directionality", () => {
  it("scores the strong entity fixture above the weak entity fixture", () => {
    const strong = createAudit(fixtureCrawl("strong-entity-site", "https://strong.example/"));
    const weak = createAudit(fixtureCrawl("weak-entity-site", "https://weak.example/"));

    expect(strong.analyzers.entity.score).toBeGreaterThan(weak.analyzers.entity.score);
    expect(strong.analyzers.entity.detectedSignals).toContain(
      "Organization or LocalBusiness schema found."
    );
    expect(weak.analyzers.entity.missingSignals).toContain(
      "Organization-level schema is missing"
    );
  });

  it("detects FAQ-oriented content structure directionally", () => {
    const faq = createAudit(fixtureCrawl("faq-heavy-site", "https://faq.example/faq"));
    const weak = createAudit(fixtureCrawl("weak-entity-site", "https://weak.example/"));

    expect(faq.analyzers.content.score).toBeGreaterThan(weak.analyzers.content.score);
    expect(faq.analyzers.content.detectedSignals).toContain("FAQ-like content discovered.");
    expect(faq.analyzers.structuredData.detectedSignals.some((signal) => signal.includes("FAQPage"))).toBe(
      true
    );
  });

  it("exposes weak machine-readable structure through missing signals", () => {
    const weak = createAudit(fixtureCrawl("weak-entity-site", "https://weak.example/"));

    expect(weak.analyzers.structuredData.missingSignals).toContain(
      "No key schema.org types were detected"
    );
    expect(weak.analyzers.technical.missingSignals).toContain("JSON-LD coverage is low");
    expect(weak.analyzers.entity.suggestedStructuralImprovements.length).toBeGreaterThan(0);
  });
});

function fixtureCrawl(fixtureName: string, url: string): CrawlResult {
  const html = readFileSync(path.resolve("fixtures", fixtureName, "index.html"), "utf8");
  const parsedUrl = new URL(url);

  return {
    inputUrl: url,
    normalizedUrl: url,
    origin: parsedUrl.origin,
    domain: parsedUrl.hostname,
    crawledAt: new Date("2026-05-26T00:00:00Z").toISOString(),
    maxPages: 1,
    respectRobots: true,
    assets: {
      robotsTxt: asset(new URL("/robots.txt", parsedUrl.origin).toString(), false),
      sitemapXml: asset(new URL("/sitemap.xml", parsedUrl.origin).toString(), false),
      llmsTxt: asset(new URL("/llms.txt", parsedUrl.origin).toString(), false)
    },
    pages: [htmlToPage(html, url)],
    skippedUrls: []
  };
}

function htmlToPage(html: string, url: string): PageData {
  const origin = new URL(url).origin;
  const links = collectAttributes(html, "a", "href")
    .map((href) => safeUrl(href, url))
    .filter((href): href is string => href !== null);

  return {
    url,
    statusCode: 200,
    title: firstTagText(html, "title"),
    metaDescription: firstAttribute(html, "meta", "content", /name=["']description["']/i),
    h1: tagTexts(html, "h1"),
    h2: tagTexts(html, "h2"),
    h3: tagTexts(html, "h3"),
    canonical: firstAttribute(html, "link", "href", /rel=["']canonical["']/i),
    openGraph: collectOpenGraph(html),
    schemaJsonLd: collectJsonLd(html),
    visibleText: stripTags(
      html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
    ),
    imageCount: collectAttributes(html, "img", "src").length,
    internalLinks: links.filter((href) => new URL(href).origin === origin),
    externalLinks: links.filter((href) => new URL(href).origin !== origin),
    discoveredFrom: "fixture",
    error: null
  };
}

function asset(url: string, found: boolean): SiteAsset {
  return {
    url,
    statusCode: found ? 200 : 404,
    found,
    contentType: "text/plain",
    bodyPreview: found ? "ok" : null,
    error: found ? null : "not found"
  };
}

function firstTagText(html: string, tag: string): string | null {
  return tagTexts(html, tag)[0] ?? null;
}

function tagTexts(html: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  return [...html.matchAll(pattern)]
    .map((match) => stripTags(match[1] ?? ""))
    .filter((value) => value.length > 0);
}

function firstAttribute(
  html: string,
  tag: string,
  attribute: string,
  tagConstraint: RegExp
): string | null {
  const pattern = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
  for (const match of html.matchAll(pattern)) {
    const attrs = match[1] ?? "";
    if (!tagConstraint.test(attrs)) continue;
    const value = attributeValue(attrs, attribute);
    if (value) return value;
  }
  return null;
}

function collectAttributes(html: string, tag: string, attribute: string): string[] {
  const pattern = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
  return [...html.matchAll(pattern)]
    .map((match) => attributeValue(match[1] ?? "", attribute))
    .filter((value): value is string => value !== null);
}

function collectOpenGraph(html: string): Record<string, string> {
  const openGraph: Record<string, string> = {};
  const pattern = /<meta\b([^>]*)>/gi;
  for (const match of html.matchAll(pattern)) {
    const attrs = match[1] ?? "";
    const property = attributeValue(attrs, "property");
    const content = attributeValue(attrs, "content");
    if (property?.startsWith("og:") && content) openGraph[property] = content;
  }
  return openGraph;
}

function collectJsonLd(html: string): JsonValue[] {
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  return [...html.matchAll(pattern)].flatMap((match) => {
    try {
      return [JSON.parse(match[1] ?? "null") as JsonValue];
    } catch {
      return [];
    }
  });
}

function attributeValue(attributes: string, attribute: string): string | null {
  const pattern = new RegExp(`${attribute}=["']([^"']+)["']`, "i");
  return attributes.match(pattern)?.[1] ?? null;
}

function safeUrl(input: string, baseUrl: string): string | null {
  try {
    return new URL(input, baseUrl).toString();
  } catch {
    return null;
  }
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
