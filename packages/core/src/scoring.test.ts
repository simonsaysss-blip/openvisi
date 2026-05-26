import { describe, expect, it } from "vitest";
import { createAudit } from "./scoring.js";
import type { CrawlResult } from "./types.js";

describe("createAudit", () => {
  it("creates explainable scores and issues", () => {
    const crawl: CrawlResult = {
      inputUrl: "https://example.com",
      normalizedUrl: "https://example.com/",
      origin: "https://example.com",
      domain: "example.com",
      crawledAt: new Date("2026-05-24T00:00:00Z").toISOString(),
      maxPages: 30,
      respectRobots: true,
      assets: {
        robotsTxt: asset("https://example.com/robots.txt", true),
        sitemapXml: asset("https://example.com/sitemap.xml", false),
        llmsTxt: asset("https://example.com/llms.txt", false)
      },
      pages: [
        {
          url: "https://example.com/",
          statusCode: 200,
          title: "Example Company",
          metaDescription: "Example Company helps teams understand AI visibility analytics.",
          h1: ["Example Company"],
          h2: ["Services", "FAQ"],
          h3: [],
          canonical: "https://example.com/",
          openGraph: {},
          schemaJsonLd: [],
          visibleText: "Example Company services customers with AI visibility analytics. FAQ 2026.",
          imageCount: 1,
          internalLinks: [],
          externalLinks: ["https://example.org"],
          discoveredFrom: "seed",
          error: null
        }
      ],
      skippedUrls: []
    };

    const audit = createAudit(crawl);

    expect(audit.scores.aiVisibility).toBeGreaterThan(0);
    expect(audit.canonicalMetrics.metrics.aiVisibilityScore).toBe(audit.scores.aiVisibility);
    expect(audit.canonicalMetrics.metrics.entityClarity).toBeGreaterThan(0);
    expect(audit.canonicalMetrics.metrics.answerShare).toBeNull();
    expect(audit.canonicalMetrics.details.answerPresence.status).toBe("diagnostic-proxy");
    expect(audit.canonicalMetrics.details.competitorDisplacement.status).toBe("not-measured");
    expect(audit.issues.length).toBeGreaterThan(0);
    expect(audit.recommendations.length).toBeGreaterThan(0);
  });
});

function asset(url: string, found: boolean) {
  return {
    url,
    statusCode: found ? 200 : 404,
    found,
    contentType: "text/plain",
    bodyPreview: found ? "ok" : null,
    error: found ? null : "not found"
  };
}
