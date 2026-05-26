#!/usr/bin/env node
/* global console, process */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const forbiddenPhrases = [
  "AI SEO tool",
  "SEO for ChatGPT",
  "rank higher in AI"
];
const errors = [];
const rootPackage = await readPackage("package.json");
const workspacePackagePaths = [
  "apps/cli/package.json",
  "apps/web/package.json",
  "packages/analyzer/package.json",
  "packages/core/package.json",
  "packages/crawler/package.json",
  "packages/evaluator/package.json",
  "packages/providers/package.json",
  "packages/report/package.json"
];

checkPackage("package.json", rootPackage, { requireRepository: true });

for (const packagePath of workspacePackagePaths) {
  const packageJson = await readPackage(packagePath);
  checkPackage(packagePath, packageJson, { requireRepository: false });
}

const cliPackage = await readPackage("apps/cli/package.json");
if (!cliPackage.bin?.openvisi) {
  errors.push("apps/cli/package.json must define bin.openvisi.");
}

if (errors.length > 0) {
  console.error("Package metadata check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Package metadata check passed.");

async function readPackage(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

function checkPackage(relativePath, packageJson, options) {
  if (!packageJson.name) errors.push(`${relativePath} must define name.`);
  if (!packageJson.version) errors.push(`${relativePath} must define version.`);
  if (!packageJson.description) errors.push(`${relativePath} must define description.`);
  if (!packageJson.license) errors.push(`${relativePath} must define license.`);
  if (options.requireRepository && !packageJson.repository) {
    errors.push(`${relativePath} must define repository.`);
  }

  const searchable = [
    packageJson.name,
    packageJson.description,
    ...(Array.isArray(packageJson.keywords) ? packageJson.keywords : [])
  ]
    .filter(Boolean)
    .join(" ");

  for (const phrase of forbiddenPhrases) {
    if (searchable.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(`${relativePath} uses forbidden positioning phrase: ${phrase}`);
    }
  }
}
