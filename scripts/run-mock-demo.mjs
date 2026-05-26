#!/usr/bin/env node
/* global console, process */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(repoRoot, ".openvisi-demo");
const cliEntry = path.join(repoRoot, "apps/cli/dist/index.js");
const args = new Set(process.argv.slice(2));

if (args.has("--clean")) {
  await rm(workspace, { recursive: true, force: true });
  console.log("Removed .openvisi-demo");
  process.exit(0);
}

let server;

try {
  await prepareWorkspace();
  await ensureBuiltCli();

  server = await startFixtureServer();
  const serverUrl = `http://127.0.0.1:${server.address().port}`;
  const domain = `127.0.0.1:${server.address().port}`;

  await writeDemoConfig({ serverUrl, domain });
  await runPipeline({ serverUrl });
  await assertArtifacts();
  await printSummary();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`OpenVisi mock demo failed: ${message}`);
  process.exitCode = 1;
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function prepareWorkspace() {
  if (!args.has("--keep")) {
    await rm(workspace, { recursive: true, force: true });
  }
  await mkdir(workspace, { recursive: true });
}

async function ensureBuiltCli() {
  if (existsSync(cliEntry)) return;

  console.log("Built CLI not found. Running npm run build...");
  await run("npm", ["run", "build"]);
}

async function startFixtureServer() {
  const localServer = http.createServer((request, response) => {
    const url = request.url ?? "/";
    const route = url.split("?")[0];
    const html = pageForRoute(route);

    if (!html) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
  });

  await new Promise((resolve, reject) => {
    localServer.once("error", reject);
    localServer.listen(0, "127.0.0.1", resolve);
  });

  return localServer;
}

function pageForRoute(route) {
  if (route === "/") return homePage();
  if (route === "/docs") return docsPage();
  if (route === "/faq" || route === "/compare") return faqComparePage();
  return null;
}

function baseHtml({ title, canonicalPath, body, jsonLd }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <link rel="canonical" href="http://127.0.0.1${canonicalPath}">
    <meta name="description" content="OpenVisi Demo is a local fixture for AI Visibility diagnostics.">
    <meta name="author" content="OpenVisi">
    <meta property="article:modified_time" content="2026-01-01T00:00:00.000Z">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body>
    <nav>
      <a href="/">Home</a>
      <a href="/docs">Docs</a>
      <a href="/faq">FAQ</a>
    </nav>
    ${body}
  </body>
</html>`;
}

function homePage() {
  return baseHtml({
    title: "OpenVisi Demo",
    canonicalPath: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "OpenVisi Demo",
      url: "http://127.0.0.1"
    },
    body: `<main>
      <h1>OpenVisi Demo</h1>
      <p>OpenVisi Demo provides AI Visibility diagnostics for machine-readable trust and AI-readable structure.</p>
      <h2>AI-readable Structure</h2>
      <p>The fixture includes clear headings, documentation links, FAQ content, and comparison language for repeatable local validation.</p>
      <h2>Machine-readable Trust</h2>
      <p>Structured data and canonical metadata are included so crawler artifacts can capture deterministic trust signals.</p>
    </main>`
  });
}

function docsPage() {
  return baseHtml({
    title: "OpenVisi Demo Documentation",
    canonicalPath: "/docs",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "OpenVisi Demo",
      applicationCategory: "DeveloperApplication"
    },
    body: `<main>
      <h1>Documentation</h1>
      <h2>Developer Guide</h2>
      <p>This documentation page explains how teams inspect AI Visibility artifacts, crawler summaries, and review gates.</p>
      <h2>API Reference</h2>
      <p>The demo page uses docs-like structure, guide language, and reference sections to exercise static crawler diagnostics.</p>
      <h3>Tutorial</h3>
      <p>Run the local mock pipeline, inspect artifact bundles, and open the generated debug report.</p>
    </main>`
  });
}

function faqComparePage() {
  return baseHtml({
    title: "OpenVisi Demo FAQ and Comparison",
    canonicalPath: "/faq",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is this real LLM evidence?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This local demo uses deterministic mock evaluator evidence."
          }
        }
      ]
    },
    body: `<main>
      <h1>FAQ</h1>
      <h2>Frequently Asked Questions</h2>
      <p>This FAQ explains that mock evaluator evidence is not real LLM evidence.</p>
      <h2>Comparison</h2>
      <p>OpenVisi Demo can be compared with generic visibility diagnostics, alternatives, and competitor analysis workflows.</p>
      <p>Buyers should compare evidence quality, reproducibility, citation readiness, and machine-readable structure.</p>
    </main>`
  });
}

async function writeDemoConfig({ serverUrl, domain }) {
  const config = {
    brandName: "OpenVisi Demo",
    domain,
    category: "AI Visibility diagnostics",
    competitors: [
      {
        name: "Reference Visibility Tool",
        domain: "reference.example",
        aliases: ["Reference Tool"]
      }
    ],
    providers: [
      {
        provider: "mock",
        model: "mock-v0",
        enabled: true
      }
    ],
    outputDir: path.join(workspace, "openvisi-report"),
    includeExperimentalMetrics: false,
    promptPackInput: {
      audience: "technical teams evaluating AI Visibility infrastructure",
      problems: [
        "understanding how AI-generated answers describe an entity",
        "reviewing machine-readable trust signals"
      ],
      integrations: ["GitHub", "documentation sites"]
    },
    metadata: {
      localFixtureBaseUrl: serverUrl
    }
  };

  await writeFile(
    path.join(workspace, "openvisi.config.json"),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8"
  );
}

async function runPipeline({ serverUrl }) {
  const config = path.join(workspace, "openvisi.config.json");
  const dirs = outputDirs();

  await runCli(["scan", "--dry-run", "--config", config, "--provider", "mock", "--output", dirs.report]);
  await runCli(["artifacts", "inspect", "--output", dirs.report, "--stage", "dry-run"]);
  await runCli([
    "crawl",
    "--config",
    config,
    "--output",
    dirs.crawl,
    "--url",
    serverUrl,
    "--render-mode",
    "static",
    "--max-pages",
    "3"
  ]);
  await runCli(["artifacts", "inspect", "--output", dirs.crawl, "--stage", "static-crawl"]);
  await runCli(["eval", "--config", config, "--provider", "mock", "--output", dirs.eval]);
  await runCli(["artifacts", "inspect", "--output", dirs.eval, "--stage", "evaluation"]);
  await runCli([
    "inputs",
    "compose",
    "--crawl-output",
    dirs.crawl,
    "--eval-output",
    dirs.eval,
    "--output",
    dirs.measurement
  ]);
  await runCli(["artifacts", "inspect", "--output", dirs.measurement, "--stage", "measurement-inputs"]);
  await runCli([
    "metrics",
    "draft",
    "--measurement-output",
    dirs.measurement,
    "--output",
    dirs.metricsDraft
  ]);
  await runCli(["artifacts", "inspect", "--output", dirs.metricsDraft, "--stage", "metrics-draft"]);
  await runCli([
    "metrics",
    "review",
    "--metrics-draft-output",
    dirs.metricsDraft,
    "--output",
    dirs.metricsReview
  ]);
  await runCli(["artifacts", "inspect", "--output", dirs.metricsReview, "--stage", "metrics-review"]);
  await runCli([
    "metrics",
    "guard",
    "--metrics-review-output",
    dirs.metricsReview,
    "--output",
    dirs.metricsFinalization
  ]);
  await runCli([
    "artifacts",
    "inspect",
    "--output",
    dirs.metricsFinalization,
    "--stage",
    "metrics-finalization"
  ]);
  await runCli([
    "debug",
    "report",
    "--dry-run-output",
    dirs.report,
    "--crawl-output",
    dirs.crawl,
    "--eval-output",
    dirs.eval,
    "--measurement-output",
    dirs.measurement,
    "--metrics-draft-output",
    dirs.metricsDraft,
    "--metrics-review-output",
    dirs.metricsReview,
    "--metrics-finalization-output",
    dirs.metricsFinalization,
    "--output",
    dirs.debugReport
  ]);
  await runCli(["artifacts", "inspect", "--output", dirs.debugReport, "--stage", "debug-report"]);
}

async function assertArtifacts() {
  const dirs = outputDirs();

  await assertContains(dirs.report, [
    "artifact-manifest.json",
    "config.normalized.json",
    "prompt-pack.json",
    "scan-plan.json",
    "warnings.json"
  ]);
  await assertMissing(dirs.report, ["crawled-pages.json", "answers.json", "metrics.json", "scan-result.json"]);

  await assertContains(dirs.crawl, [
    "artifact-manifest.json",
    "crawled-pages.json",
    "crawler-summary.json",
    "structure-trust-inputs.json",
    "report-references.json",
    "warnings.json"
  ]);
  await assertMissing(dirs.crawl, ["answers.json", "metrics.json", "scan-result.json"]);

  await assertContains(dirs.eval, [
    "artifact-manifest.json",
    "answers.json",
    "answer-signal-inputs.json",
    "config.normalized.json",
    "prompt-pack.json",
    "warnings.json"
  ]);
  await assertMissing(dirs.eval, ["metrics.json", "scan-result.json"]);

  await assertContains(dirs.measurement, [
    "artifact-manifest.json",
    "measurement-inputs.json",
    "warnings.json"
  ]);
  await assertContains(dirs.metricsDraft, [
    "artifact-manifest.json",
    "metrics-draft.json",
    "warnings.json"
  ]);
  await assertContains(dirs.metricsReview, [
    "artifact-manifest.json",
    "metrics-review.json",
    "warnings.json"
  ]);
  await assertContains(dirs.metricsFinalization, [
    "artifact-manifest.json",
    "metrics-finalization.json",
    "warnings.json"
  ]);
  await assertContains(dirs.debugReport, [
    "artifact-manifest.json",
    "debug-report.md",
    "warnings.json"
  ]);

  for (const directory of Object.values(dirs)) {
    await assertMissing(directory, ["metrics.json", "scan-result.json", "report.md", "report.html"]);
  }

  const debugReport = await readFile(path.join(dirs.debugReport, "debug-report.md"), "utf8");
  for (const expected of [
    "This is not a final AI Visibility report.",
    "No final AI Visibility Score is computed.",
    "Mock evaluator evidence is not real LLM evidence.",
    "Final metrics generation is blocked"
  ]) {
    if (!debugReport.includes(expected)) {
      throw new Error(`debug-report.md is missing required text: ${expected}`);
    }
  }

  const finalization = JSON.parse(
    await readFile(path.join(dirs.metricsFinalization, "metrics-finalization.json"), "utf8")
  );
  assertEqual(finalization.status, "blocked", "metrics-finalization.status");
  assertEqual(
    finalization.decision?.allowedToGenerateMetricsJson,
    false,
    "decision.allowedToGenerateMetricsJson"
  );
  assertEqual(
    finalization.decision?.allowedToComputeAiVisibilityScore,
    false,
    "decision.allowedToComputeAiVisibilityScore"
  );
  assertEqual(
    finalization.decision?.allowedToGenerateScanResult,
    false,
    "decision.allowedToGenerateScanResult"
  );
}

async function assertContains(directory, fileNames) {
  for (const fileName of fileNames) {
    if (!existsSync(path.join(directory, fileName))) {
      throw new Error(`Artifact check failed: expected ${path.join(directory, fileName)}`);
    }
  }
}

async function assertMissing(directory, fileNames) {
  for (const fileName of fileNames) {
    if (existsSync(path.join(directory, fileName))) {
      throw new Error(`Artifact check failed: unexpected ${path.join(directory, fileName)}`);
    }
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Artifact check failed: ${label} expected ${expected}, received ${actual}`);
  }
}

async function printSummary() {
  const dirs = outputDirs();
  const finalization = JSON.parse(
    await readFile(path.join(dirs.metricsFinalization, "metrics-finalization.json"), "utf8")
  );

  console.log("");
  console.log("OpenVisi mock demo completed.");
  console.log(`Debug report: ${path.relative(repoRoot, path.join(dirs.debugReport, "debug-report.md"))}`);
  console.log("Final metrics generated: no");
  console.log("Final AI Visibility Score generated: no");
  console.log("Evidence mode: mock");
  console.log(`Finalization status: ${finalization.status}`);
}

function outputDirs() {
  return {
    report: path.join(workspace, "openvisi-report"),
    crawl: path.join(workspace, "openvisi-crawl"),
    eval: path.join(workspace, "openvisi-eval"),
    measurement: path.join(workspace, "openvisi-measurement"),
    metricsDraft: path.join(workspace, "openvisi-metrics-draft"),
    metricsReview: path.join(workspace, "openvisi-metrics-review"),
    metricsFinalization: path.join(workspace, "openvisi-metrics-finalization"),
    debugReport: path.join(workspace, "openvisi-debug-report")
  };
}

async function runCli(commandArgs) {
  await run(process.execPath, [cliEntry, ...commandArgs]);
}

async function run(command, commandArgs) {
  console.log(`$ ${[command, ...commandArgs].map(shellQuote).join(" ")}`);

  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repoRoot,
      stdio: "inherit",
      env: {
        ...process.env,
        NO_COLOR: "1"
      }
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${commandArgs.join(" ")}`));
      }
    });
  });
}

function shellQuote(value) {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}
