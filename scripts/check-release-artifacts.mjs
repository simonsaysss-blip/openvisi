#!/usr/bin/env node
/* global console, process */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "CHANGELOG.md",
  "ROADMAP.md",
  "ARCHITECTURE.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "docs/release-checklist.md",
  "docs/release-rehearsal.md",
  "docs/versioning.md",
  "docs/release-notes/v0.1.0.md",
  "docs/release-notes/v0.1.0-rc-checklist.md",
  "docs/release-notes/v0.1.0-rc-freeze-review.md",
  "docs/release-notes/v0.1.0-known-limitations.md",
  "docs/release-notes/v0.1.0-publish-plan.md"
];
// These are explicitly documented local runtime output directories. They are
// ignored by git and may exist while developers inspect demo or benchmark runs.
// The release check should not delete user data or fail only because these
// allowlisted local artifacts are present.
const ignoredLocalRuntimeDirs = [
  ".openvisi-release",
  ".openvisi-demo",
  "runs",
  "openvisi-report",
  "openvisi-crawl",
  "openvisi-eval",
  "openvisi-measurement",
  "openvisi-metrics-draft",
  "openvisi-metrics-review",
  "openvisi-metrics-finalization",
  "openvisi-debug-report"
];
const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /OPENAI_API_KEY\s*[:=]/i,
  /ANTHROPIC_API_KEY\s*[:=]/i,
  /GOOGLE_API_KEY\s*[:=]/i,
  /apiKey\s*[:=]/i
];
const errors = [];

for (const file of requiredFiles) {
  if (!(await exists(path.join(repoRoot, file)))) {
    errors.push(`Missing required release file: ${file}`);
  }
}

const presentIgnoredRuntimeDirs = [];
for (const dir of ignoredLocalRuntimeDirs) {
  if (await exists(path.join(repoRoot, dir))) {
    presentIgnoredRuntimeDirs.push(dir);
  }
}

await checkExamplesForSecrets(path.join(repoRoot, "examples"));

if (errors.length > 0) {
  console.error("Release artifact check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Release artifact check passed.");
if (presentIgnoredRuntimeDirs.length > 0) {
  console.log(
    `Ignored local runtime artifacts: ${presentIgnoredRuntimeDirs.join(", ")}`
  );
}

async function checkExamplesForSecrets(directory) {
  if (!(await exists(directory))) return;
  for (const entry of await readdir(directory)) {
    const filePath = path.join(directory, entry);
    const info = await stat(filePath);

    if (info.isDirectory()) {
      await checkExamplesForSecrets(filePath);
      continue;
    }

    const text = await readFile(filePath, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.test(text)) {
        errors.push(`Example file may contain an API key or API-key-like placeholder: ${path.relative(repoRoot, filePath)}`);
      }
    }
  }
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
