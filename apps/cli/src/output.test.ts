import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CrawledPageSnapshot } from "@openvisi/core";
import { createCrawlerSummary, pathExists, writeCrawlerArtifacts } from "./output.js";

describe("crawler output helpers", () => {
  it("summarizes diagnostics and writes crawler artifacts", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-output-"));
    const snapshots = [snapshot({ hasJsonLd: true, hasClearH1: true })];
    const summary = createCrawlerSummary({
      domain: "example.com",
      seedUrl: "https://example.com",
      renderMode: "static",
      generatedAt: "2026-05-26T00:00:00.000Z",
      snapshots
    });

    await writeCrawlerArtifacts(directory, snapshots, summary, ["static only"]);

    expect(summary.diagnosticsSummary.pagesWithJsonLd).toBe(1);
    expect(summary.diagnosticsSummary.pagesWithClearH1).toBe(1);
    await expect(readJson(path.join(directory, "crawled-pages.json"))).resolves.toHaveLength(1);
    await expect(readJson(path.join(directory, "crawler-summary.json"))).resolves.toMatchObject({
      pageCount: 1,
      renderMode: "static"
    });
    await expect(readJson(path.join(directory, "warnings.json"))).resolves.toEqual([
      "static only"
    ]);
    await expect(pathExists(path.join(directory, "warnings.json"))).resolves.toBe(true);
    await expect(pathExists(path.join(directory, "missing.json"))).resolves.toBe(false);
  });
});

function snapshot(diagnostics: NonNullable<CrawledPageSnapshot["diagnostics"]>): CrawledPageSnapshot {
  return {
    url: "https://example.com",
    textContent: "",
    meta: {},
    jsonLd: [],
    headings: { h1: [], h2: [], h3: [] },
    links: { internal: [], external: [] },
    fetchedAt: "2026-05-26T00:00:00.000Z",
    renderMode: "static",
    diagnostics
  };
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}
