import { describe, expect, it } from "vitest";
import { crawlSite, toCrawledPageSnapshot } from "./index.js";

describe("toCrawledPageSnapshot", () => {
  it("returns a valid snapshot from minimal input", () => {
    const snapshot = toCrawledPageSnapshot(
      {
        url: "https://example.com"
      },
      {
        fetchedAt: "2026-05-26T00:00:00.000Z"
      }
    );

    expect(snapshot).toEqual({
      url: "https://example.com",
      textContent: "",
      meta: {},
      jsonLd: [],
      headings: {
        h1: [],
        h2: [],
        h3: []
      },
      links: {
        internal: [],
        external: []
      },
      fetchedAt: "2026-05-26T00:00:00.000Z",
      renderMode: "static",
      diagnostics: {
        hasJsonLd: false,
        hasOrganizationSchema: false,
        hasProductSchema: false,
        hasFAQSchema: false,
        hasAuthorMetadata: false,
        hasLastModifiedMetadata: false,
        canonicalPresent: false,
        httpsEnabled: true,
        hasClearH1: false,
        hasDocsLikeStructure: false,
        hasFAQSection: false,
        hasComparisonPageSignals: false,
        contentDepthEstimate: 0
      }
    });
  });

  it("uses an ISO timestamp by default", () => {
    const snapshot = toCrawledPageSnapshot({ url: "https://example.com" });

    expect(Number.isNaN(Date.parse(snapshot.fetchedAt))).toBe(false);
  });

  it("deduplicates headings and links without inventing content", () => {
    const snapshot = toCrawledPageSnapshot({
      url: "https://example.com",
      h1: ["Docs", "Docs", ""],
      links: {
        internal: ["https://example.com/docs", "https://example.com/docs"],
        external: ["https://external.example", "https://external.example"]
      }
    });

    expect(snapshot.textContent).toBe("");
    expect(snapshot.jsonLd).toEqual([]);
    expect(snapshot.headings.h1).toEqual(["Docs"]);
    expect(snapshot.links.internal).toEqual(["https://example.com/docs"]);
    expect(snapshot.links.external).toEqual(["https://external.example"]);
  });

  it("maps current crawler PageData shape into the canonical snapshot contract", () => {
    const snapshot = toCrawledPageSnapshot({
      url: "https://example.com/docs",
      title: "Example Docs",
      metaDescription: "Documentation for Example.",
      canonical: "https://example.com/docs",
      openGraph: {
        "og:title": "Example Docs"
      },
      schemaJsonLd: [{ "@type": "Organization" }],
      visibleText: "Developer documentation guide API reference.",
      h1: ["Example Docs"],
      h2: ["Guide"],
      h3: ["API"],
      internalLinks: ["https://example.com/docs", "https://example.com/docs"],
      externalLinks: ["https://developer.example"]
    });

    expect(snapshot.title).toBe("Example Docs");
    expect(snapshot.meta.description).toBe("Documentation for Example.");
    expect(snapshot.meta.canonical).toBe("https://example.com/docs");
    expect(snapshot.jsonLd).toEqual([{ "@type": "Organization" }]);
    expect(snapshot.textContent).toBe("Developer documentation guide API reference.");
    expect(snapshot.diagnostics?.hasOrganizationSchema).toBe(true);
    expect(snapshot.diagnostics?.hasDocsLikeStructure).toBe(true);
  });

  it("can extract available fields from HTML without headless rendering", () => {
    const snapshot = toCrawledPageSnapshot({
      url: "https://example.com/faq",
      html: `<!doctype html>
        <html>
          <head>
            <title>FAQ</title>
            <meta name="author" content="OpenVisi">
            <link rel="canonical" href="https://example.com/faq">
            <script type="application/ld+json">{"@type":"FAQPage"}</script>
          </head>
          <body>
            <h1>FAQ</h1>
            <a href="/docs">Docs</a>
            <a href="https://external.example">External</a>
            Frequently asked questions.
          </body>
        </html>`
    });

    expect(snapshot.title).toBe("FAQ");
    expect(snapshot.meta.author).toBe("OpenVisi");
    expect(snapshot.meta.canonical).toBe("https://example.com/faq");
    expect(snapshot.jsonLd).toEqual([{ "@type": "FAQPage" }]);
    expect(snapshot.headings.h1).toEqual(["FAQ"]);
    expect(snapshot.links.internal).toEqual(["https://example.com/docs"]);
    expect(snapshot.links.external).toEqual(["https://external.example/"]);
    expect(snapshot.diagnostics?.hasFAQSchema).toBe(true);
    expect(snapshot.diagnostics?.hasFAQSection).toBe(true);
  });

  it("keeps the existing crawler public API export available", () => {
    expect(typeof crawlSite).toBe("function");
  });
});
