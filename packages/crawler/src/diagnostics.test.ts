import { describe, expect, it } from "vitest";
import {
  extractAiReadableStructureDiagnostics,
  extractMachineReadableTrustDiagnostics
} from "./diagnostics.js";

describe("crawler diagnostics", () => {
  it("detects JSON-LD Organization, Product, and FAQ schema", () => {
    const diagnostics = extractMachineReadableTrustDiagnostics({
      url: "https://example.com",
      meta: {
        author: "OpenVisi",
        "article:modified_time": "2026-05-26",
        canonical: "https://example.com/"
      },
      jsonLd: [
        { "@type": "Organization" },
        { "@type": "SoftwareApplication" },
        { "@type": "FAQPage" }
      ]
    });

    expect(diagnostics?.hasJsonLd).toBe(true);
    expect(diagnostics?.hasOrganizationSchema).toBe(true);
    expect(diagnostics?.hasProductSchema).toBe(true);
    expect(diagnostics?.hasFAQSchema).toBe(true);
    expect(diagnostics?.hasAuthorMetadata).toBe(true);
    expect(diagnostics?.hasLastModifiedMetadata).toBe(true);
    expect(diagnostics?.canonicalPresent).toBe(true);
    expect(diagnostics?.httpsEnabled).toBe(true);
  });

  it("sets hasClearH1 only when exactly one non-empty h1 exists", () => {
    expect(
      extractAiReadableStructureDiagnostics({
        url: "https://example.com",
        headings: { h1: ["One clear H1"] }
      })?.hasClearH1
    ).toBe(true);

    expect(
      extractAiReadableStructureDiagnostics({
        url: "https://example.com",
        headings: { h1: ["First", "Second"] }
      })?.hasClearH1
    ).toBe(false);
  });

  it("detects FAQ and comparison page signals from headings or text", () => {
    const diagnostics = extractAiReadableStructureDiagnostics({
      url: "https://example.com/alternatives",
      textContent: "Compare OpenVisi vs other tools. Frequently asked questions.",
      headings: {
        h2: ["FAQ", "Alternatives"]
      }
    });

    expect(diagnostics?.hasFAQSection).toBe(true);
    expect(diagnostics?.hasComparisonPageSignals).toBe(true);
  });
});
