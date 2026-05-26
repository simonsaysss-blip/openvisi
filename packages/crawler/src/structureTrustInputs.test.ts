import { describe, expect, it } from "vitest";
import type { CrawledPageSnapshot } from "@openvisi/core";
import { createStructureTrustInputBundle } from "./structureTrustInputs.js";

describe("createStructureTrustInputBundle", () => {
  it("returns deterministic output for the same input", () => {
    const input = {
      crawledPages: snapshots(),
      generatedAt: "2026-01-01T00:00:00.000Z",
      preferredSourceDomains: ["openvisi.dev"]
    };

    expect(createStructureTrustInputBundle(input)).toEqual(createStructureTrustInputBundle(input));
  });

  it("counts AI-readable Structure signals from diagnostics", () => {
    const bundle = createStructureTrustInputBundle({
      crawledPages: snapshots(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.aiReadableStructureSignals).toMatchObject({
      pagesWithClearH1: 2,
      pagesWithDocsLikeStructure: 1,
      pagesWithFAQSection: 1,
      pagesWithComparisonSignals: 1,
      averageContentDepthEstimate: 250
    });
  });

  it("counts Machine-readable Trust signals from diagnostics", () => {
    const bundle = createStructureTrustInputBundle({
      crawledPages: snapshots(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.machineReadableTrustSignals).toMatchObject({
      pagesWithJsonLd: 1,
      pagesWithOrganizationSchema: 1,
      pagesWithProductSchema: 0,
      pagesWithFAQSchema: 1,
      pagesWithAuthorMetadata: 0,
      pagesWithLastModifiedMetadata: 1,
      pagesWithCanonical: 2,
      httpsPages: 2
    });
  });

  it("generates source gap candidates only from detected missing evidence", () => {
    const bundle = createStructureTrustInputBundle({
      crawledPages: snapshots(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.sourceGapCandidates.map((candidate) => candidate.type)).toEqual(
      expect.arrayContaining(["missing_product_schema", "missing_author_metadata"])
    );
    expect(bundle.sourceGapCandidates.map((candidate) => candidate.type)).not.toContain(
      "missing_canonical"
    );
  });

  it("does not include metrics or aiVisibilityScore", () => {
    const bundle = createStructureTrustInputBundle({
      crawledPages: snapshots(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    }) as unknown as Record<string, unknown>;

    expect(bundle.aiVisibilityScore).toBeUndefined();
    expect(bundle.metrics).toBeUndefined();
  });

  it("handles empty crawledPages conservatively", () => {
    const bundle = createStructureTrustInputBundle({
      crawledPages: [],
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.pageCount).toBe(0);
    expect(bundle.aiReadableStructureSignals.averageContentDepthEstimate).toBe(0);
    expect(bundle.sourceGapCandidates).toEqual([]);
  });
});

function snapshots(): CrawledPageSnapshot[] {
  return [
    {
      url: "https://openvisi.dev/",
      title: "OpenVisi",
      textContent: "OpenVisi documentation",
      meta: {},
      jsonLd: [{ "@type": "Organization" }],
      headings: { h1: ["OpenVisi"], h2: ["Documentation"], h3: [] },
      links: { internal: [], external: [] },
      fetchedAt: "2026-01-01T00:00:00.000Z",
      renderMode: "static",
      diagnostics: {
        hasJsonLd: true,
        hasOrganizationSchema: true,
        hasProductSchema: false,
        hasFAQSchema: false,
        hasAuthorMetadata: false,
        hasLastModifiedMetadata: true,
        canonicalPresent: true,
        httpsEnabled: true,
        hasClearH1: true,
        hasDocsLikeStructure: true,
        hasFAQSection: false,
        hasComparisonPageSignals: false,
        contentDepthEstimate: 300
      }
    },
    {
      url: "https://openvisi.dev/faq",
      title: "OpenVisi FAQ",
      textContent: "Frequently asked questions compare source structures.",
      meta: {},
      jsonLd: [{ "@type": "FAQPage" }],
      headings: { h1: ["FAQ"], h2: ["Frequently Asked Questions"], h3: [] },
      links: { internal: [], external: [] },
      fetchedAt: "2026-01-01T00:00:00.000Z",
      renderMode: "static",
      diagnostics: {
        hasJsonLd: false,
        hasOrganizationSchema: false,
        hasProductSchema: false,
        hasFAQSchema: true,
        hasAuthorMetadata: false,
        hasLastModifiedMetadata: false,
        canonicalPresent: true,
        httpsEnabled: true,
        hasClearH1: true,
        hasDocsLikeStructure: false,
        hasFAQSection: true,
        hasComparisonPageSignals: true,
        contentDepthEstimate: 200
      }
    }
  ];
}
