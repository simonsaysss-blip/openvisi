#!/usr/bin/env node
/* global console, process */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredDocs = [
  "CHANGELOG.md",
  "docs/release-checklist.md",
  "docs/release-rehearsal.md",
  "docs/release-notes/v0.1.0.md",
  "docs/release-notes/v0.1.0-rc-checklist.md",
  "docs/release-notes/v0.1.0-rc-freeze-review.md",
  "docs/release-notes/v0.1.0-known-limitations.md",
  "docs/release-notes/v0.1.0-publish-plan.md"
];
const requiredScripts = ["release:check", "release:rehearse", "demo:mock"];
const runtimeDirs = [
  ".openvisi-demo",
  ".openvisi-release",
  "openvisi-report",
  "openvisi-crawl",
  "openvisi-eval",
  "openvisi-measurement",
  "openvisi-metrics-draft",
  "openvisi-metrics-review",
  "openvisi-metrics-finalization",
  "openvisi-debug-report"
];
const requiredLimitations = [
  /mock-only/i,
  /No final AI Visibility Score/i,
  /No `?metrics\.json`?/i,
  /No `?scan-result\.json`?/i,
  /No real provider adapters/i
];
const errors = [];

for (const docPath of requiredDocs) {
  if (!(await exists(path.join(repoRoot, docPath)))) {
    errors.push(`Missing required RC document: ${docPath}`);
  }
}

const packageJson = JSON.parse(await readText("package.json"));
for (const scriptName of requiredScripts) {
  if (!packageJson.scripts?.[scriptName]) {
    errors.push(`package.json must define ${scriptName}.`);
  }
}

const readme = await readText("README.md");
if (/OpenVisi is an AI SEO/i.test(readme) || /rank higher in AI/i.test(readme)) {
  errors.push("README uses forbidden AI SEO positioning.");
}

const releaseText = (
  await Promise.all([
  "README.md",
  "CHANGELOG.md",
  "docs/release-checklist.md",
  "docs/release-rehearsal.md",
  "docs/release-notes/v0.1.0.md",
  "docs/release-notes/v0.1.0-rc-checklist.md",
  "docs/release-notes/v0.1.0-rc-freeze-review.md",
  "docs/release-notes/v0.1.0-known-limitations.md",
  "docs/release-notes/v0.1.0-publish-plan.md"
].map((docPath) => safeReadText(docPath)))
)
  .join("\n");

for (const limitationPattern of requiredLimitations) {
  if (!limitationPattern.test(releaseText)) {
    errors.push(`Release docs missing required limitation: ${limitationPattern}`);
  }
}

for (const dir of runtimeDirs) {
  if (await exists(path.join(repoRoot, dir))) {
    errors.push(`Runtime artifact directory must be cleaned before RC freeze: ${dir}`);
  }
}

if (errors.length > 0) {
  console.error("OpenVisi RC freeze check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("OpenVisi v0.1.0 RC freeze check passed.");
console.log("Required release docs: present");
console.log("Required npm scripts: present");
console.log("Runtime artifacts: clean");
console.log("Published: no");
console.log("Git tag created: no");
console.log("Final metrics generated: no");
console.log("Final AI Visibility Score generated: no");
console.log("Release rehearsal summary is not required to exist in the repo.");

async function safeReadText(relativePath) {
  try {
    return await readText(relativePath);
  } catch {
    return "";
  }
}

async function readText(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
