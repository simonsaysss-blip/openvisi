import { constants } from "node:fs";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CrawlResult } from "@openvisi/core";
import { runCrawlCommand } from "./crawl.js";

describe("runCrawlCommand", () => {
  it("writes canonical crawler artifacts", async () => {
    const directory = await createFixtureDirectory();
    const output = path.join(directory, "custom-output");

    await runCrawlCommand(
      {
        config: path.join(directory, "openvisi.config.json"),
        output,
        maxPages: 5,
        renderMode: "static"
      },
      async () => crawlResult()
    );

    const snapshots = (await readJson(path.join(output, "crawled-pages.json"))) as Array<{
      url: string;
      textContent: string;
      headings: { h1: string[]; h2: string[]; h3: string[] };
      links: { internal: string[]; external: string[] };
      renderMode: string;
      diagnostics: { hasJsonLd: boolean; hasOrganizationSchema: boolean };
    }>;
    const summary = (await readJson(path.join(output, "crawler-summary.json"))) as {
      pageCount: number;
      diagnosticsSummary: { pagesWithJsonLd: number; pagesWithOrganizationSchema: number };
    };
    const structureTrustInputs = (await readJson(
      path.join(output, "structure-trust-inputs.json")
    )) as {
      pageCount: number;
      machineReadableTrustSignals: { pagesWithJsonLd: number; pagesWithOrganizationSchema: number };
      aiCitationSignalInputs: { hasOfficialStructuredData: boolean };
    };
    const warnings = (await readJson(path.join(output, "warnings.json"))) as string[];
    const manifest = (await readJson(path.join(output, "artifact-manifest.json"))) as {
      artifacts: Array<{ path: string }>;
    };
    const reportReferences = (await readJson(path.join(output, "report-references.json"))) as {
      references: Array<{ section: string; path: string }>;
    };

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      url: "https://example.com/",
      textContent: "Example documentation FAQ",
      headings: { h1: ["Example"], h2: ["FAQ"], h3: [] },
      links: { internal: ["https://example.com/docs"], external: [] },
      renderMode: "static"
    });
    expect(snapshots[0]?.diagnostics.hasJsonLd).toBe(true);
    expect(snapshots[0]?.diagnostics.hasOrganizationSchema).toBe(true);
    expect(summary.pageCount).toBe(1);
    expect(summary.diagnosticsSummary.pagesWithJsonLd).toBe(1);
    expect(summary.diagnosticsSummary.pagesWithOrganizationSchema).toBe(1);
    expect(structureTrustInputs.pageCount).toBe(1);
    expect(structureTrustInputs.machineReadableTrustSignals.pagesWithJsonLd).toBe(1);
    expect(structureTrustInputs.machineReadableTrustSignals.pagesWithOrganizationSchema).toBe(1);
    expect(structureTrustInputs.aiCitationSignalInputs.hasOfficialStructuredData).toBe(true);
    expect(warnings).toContain("Crawler artifacts are static-only in Stage 2B.");
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "crawled-pages.json",
      "crawler-summary.json",
      "structure-trust-inputs.json",
      "warnings.json",
      "report-references.json",
      "artifact-manifest.json"
    ]);
    expect(reportReferences.references.map((reference) => reference.section)).toEqual([
      "AI-readable Structure",
      "Machine-readable Trust",
      "AI Citation Signals",
      "Source Gaps",
      "Raw Crawled Pages",
      "Crawler Summary"
    ]);
    expect(
      reportReferences.references
        .filter((reference) =>
          [
            "AI-readable Structure",
            "Machine-readable Trust",
            "AI Citation Signals",
            "Source Gaps"
          ].includes(reference.section)
        )
        .every((reference) => reference.path === "structure-trust-inputs.json")
    ).toBe(true);
  });

  it("emits a warning when headless render mode is requested", async () => {
    const directory = await createFixtureDirectory();
    const output = path.join(directory, "headless-output");

    await runCrawlCommand(
      {
        config: path.join(directory, "openvisi.config.json"),
        output,
        maxPages: 5,
        renderMode: "headless"
      },
      async () => crawlResult()
    );

    const warnings = (await readJson(path.join(output, "warnings.json"))) as string[];
    const snapshots = (await readJson(path.join(output, "crawled-pages.json"))) as Array<{
      renderMode: string;
    }>;

    expect(warnings[0]).toBe("Headless render mode is not implemented in Stage 2B; using static crawl.");
    expect(snapshots[0]?.renderMode).toBe("static");
  });

  it("does not write fake metrics, answers, citations, or scan results", async () => {
    const directory = await createFixtureDirectory();
    const output = path.join(directory, "no-fake-output");

    await runCrawlCommand(
      {
        config: path.join(directory, "openvisi.config.json"),
        output,
        maxPages: 5,
        renderMode: "static"
      },
      async () => crawlResult()
    );

    await expect(fileExists(path.join(output, "metrics.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "answers.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "answer-signal-inputs.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "measurement-inputs.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "metrics-draft.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "metrics-review.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "metrics-finalization.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "citations.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(output, "scan-result.json"))).resolves.toBe(false);
  });
});

async function createFixtureDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "openvisi-crawl-"));
  await writeFile(
    path.join(directory, "openvisi.config.json"),
    `${JSON.stringify(
      {
        brandName: "OpenVisi",
        domain: "example.com",
        category: "AI Visibility diagnostics",
        competitors: [],
        providers: [{ provider: "mock", enabled: true }],
        outputDir: "openvisi-report",
        includeExperimentalMetrics: false
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  return directory;
}

function crawlResult(): CrawlResult {
  return {
    inputUrl: "https://example.com",
    normalizedUrl: "https://example.com/",
    origin: "https://example.com",
    domain: "example.com",
    crawledAt: "2026-05-26T00:00:00.000Z",
    maxPages: 5,
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
        title: "Example",
        metaDescription: "Example documentation",
        h1: ["Example"],
        h2: ["FAQ"],
        h3: [],
        canonical: "https://example.com/",
        openGraph: {},
        schemaJsonLd: [{ "@type": "Organization" }],
        visibleText: "Example documentation FAQ",
        imageCount: 0,
        internalLinks: ["https://example.com/docs"],
        externalLinks: [],
        discoveredFrom: "homepage",
        error: null
      }
    ],
    skippedUrls: []
  };
}

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

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
