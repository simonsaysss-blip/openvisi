import { describe, expect, it } from "vitest";
import { validateStructureTrustInputBundleShape } from "./structureTrustInputs.js";
import type { StructureTrustInputBundle } from "./structureTrustInputs.js";

describe("StructureTrustInputBundle contract", () => {
  it("accepts a valid bundle", () => {
    expect(validateStructureTrustInputBundleShape(validBundle())).toEqual([]);
  });

  it("rejects missing required top-level fields", () => {
    expect(validateStructureTrustInputBundleShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        "sourceArtifacts must be an object.",
        "pageCount must be a non-negative number.",
        "aiReadableStructureSignals must be an object.",
        "machineReadableTrustSignals must be an object.",
        "aiCitationSignalInputs must be an object.",
        "sourceGapCandidates must be an array.",
        "limitations must be an array."
      ])
    );
  });

  it("rejects aiVisibilityScore because this is not a metrics artifact", () => {
    expect(validateStructureTrustInputBundleShape({ ...validBundle(), aiVisibilityScore: 82 })).toContain(
      "structure trust input bundle must not include aiVisibilityScore."
    );
  });
});

function validBundle(): StructureTrustInputBundle {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    sourceArtifacts: {
      crawledPages: "crawled-pages.json",
      crawlerSummary: "crawler-summary.json"
    },
    pageCount: 2,
    aiReadableStructureSignals: {
      pagesWithClearH1: 1,
      pagesWithDocsLikeStructure: 1,
      pagesWithFAQSection: 1,
      pagesWithComparisonSignals: 1,
      averageContentDepthEstimate: 420
    },
    machineReadableTrustSignals: {
      pagesWithJsonLd: 1,
      pagesWithOrganizationSchema: 1,
      pagesWithProductSchema: 1,
      pagesWithFAQSchema: 1,
      pagesWithAuthorMetadata: 0,
      pagesWithLastModifiedMetadata: 0,
      pagesWithCanonical: 1,
      httpsPages: 2
    },
    aiCitationSignalInputs: {
      hasOfficialStructuredData: true,
      hasDocumentationLikeSources: true,
      hasFAQLikeSources: true,
      hasComparisonLikeSources: true,
      preferredSourceDomains: ["openvisi.dev"]
    },
    sourceGapCandidates: [
      {
        id: "missing-author-metadata",
        type: "missing_author_metadata",
        severity: "low",
        description: "No author metadata detected on crawled pages.",
        evidence: ["crawler-summary.json"]
      }
    ],
    limitations: [
      "Derived from static crawler output only.",
      "Does not include LLM-generated answers or citation behavior."
    ]
  };
}
