#!/usr/bin/env node
/* global console, process */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = ["README.md", "CHANGELOG.md", "ROADMAP.md", "ARCHITECTURE.md", "CONTRIBUTING.md", "SECURITY.md", "CODE_OF_CONDUCT.md", "docs", "examples"];
const ignoredDirs = new Set(["node_modules", ".git", "dist", ".next", ".openvisi-demo", "coverage", "reports"]);
const errors = [];

const markdownFiles = [];
for (const root of roots) {
  await collectMarkdown(path.join(repoRoot, root), markdownFiles);
}

for (const filePath of markdownFiles) {
  await checkMarkdownFile(filePath);
}

if (errors.length > 0) {
  console.error("Documentation link check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation link check passed (${markdownFiles.length} Markdown files).`);

async function collectMarkdown(targetPath, output) {
  if (!(await exists(targetPath))) return;
  const info = await stat(targetPath);

  if (info.isDirectory()) {
    if (ignoredDirs.has(path.basename(targetPath))) return;
    for (const entry of await readdir(targetPath)) {
      await collectMarkdown(path.join(targetPath, entry), output);
    }
    return;
  }

  if (targetPath.endsWith(".md")) output.push(targetPath);
}

async function checkMarkdownFile(filePath) {
  const text = await readFile(filePath, "utf8");
  const dir = path.dirname(filePath);
  const links = extractMarkdownLinks(text);

  for (const link of links) {
    if (shouldIgnoreLink(link)) continue;

    const target = normalizeLocalTarget(link);
    if (!target) continue;

    const resolved = path.resolve(dir, target);
    if (!resolved.startsWith(repoRoot)) {
      errors.push(`${relative(filePath)} links outside repo: ${link}`);
      continue;
    }

    if (!(await exists(resolved))) {
      errors.push(`${relative(filePath)} has missing local link: ${link}`);
    }
  }
}

function extractMarkdownLinks(text) {
  const links = [];
  const inlineLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;
  let match;

  while ((match = inlineLinkPattern.exec(text)) !== null) {
    links.push(match[1].trim());
  }

  return links;
}

function shouldIgnoreLink(link) {
  return (
    link.length === 0 ||
    link.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(link)
  );
}

function normalizeLocalTarget(link) {
  const withoutTitle = link.replace(/^<(.+)>$/, "$1").split(/\s+/)[0];
  const withoutAnchor = withoutTitle.split("#")[0];
  return withoutAnchor.length > 0 ? decodeURIComponent(withoutAnchor) : null;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function relative(filePath) {
  return path.relative(repoRoot, filePath);
}
