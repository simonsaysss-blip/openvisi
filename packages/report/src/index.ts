import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditResult, RecommendedFix, ScoreDetail, VisibilityIssue } from "@openvisi/core";

export interface ReportPaths {
  directory: string;
  markdown: string;
  json: string;
  html: string;
}

export async function writeReports(
  audit: AuditResult,
  outputRoot = "reports"
): Promise<ReportPaths> {
  const folderName = slugifyDomain(audit.target.domain);
  const directory = path.resolve(process.cwd(), outputRoot, folderName);
  await mkdir(directory, { recursive: true });

  const markdown = path.join(directory, "report.md");
  const json = path.join(directory, "report.json");
  const html = path.join(directory, "report.html");

  await writeFile(markdown, renderMarkdownReport(audit), "utf8");
  await writeFile(json, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  await writeFile(html, renderHtmlReport(audit), "utf8");

  return { directory, markdown, json, html };
}

export function renderMarkdownReport(audit: AuditResult): string {
  return `# Machine-Readable Visibility Diagnostic Report

## Snapshot Summary

- Target: ${audit.target.normalizedUrl}
- Domain: ${audit.target.domain}
- Generated at: ${audit.generatedAt}
- Methodology version: ${audit.methodologyVersion}
- Crawled pages: ${audit.crawl.pages.length}
- Robots respected: ${audit.crawl.respectRobots ? "yes" : "no"}
- AI Visibility Score: ${audit.scores.aiVisibility}/100

This report is a heuristic diagnostic snapshot of public machine-readable visibility signals. It does not predict rankings, citations, or answer inclusion in any specific LLM-powered product.

## Scores

${scoreLine("Entity Clarity", audit.scores.entityClarity)}
${scoreLine("Technical Discoverability", audit.scores.technicalDiscoverability)}
${scoreLine("Structured Data", audit.scores.structuredData)}
${scoreLine("Content Chunkability", audit.scores.contentChunkability)}
${scoreLine("Citation Readiness", audit.scores.citationReadiness)}
${scoreLine("Prompt Simulation", audit.scores.promptSimulation)}

## Analyzer Details

${renderAnalyzer("Entity Analyzer", audit.analyzers.entity)}

${renderAnalyzer("Technical Analyzer", audit.analyzers.technical)}

${renderAnalyzer("Structured Data Analyzer", audit.analyzers.structuredData)}

${renderAnalyzer("Content Analyzer", audit.analyzers.content)}

${renderAnalyzer("Citation Readiness Analyzer", audit.analyzers.citationReadiness)}

${renderAnalyzer("Prompt Simulation Analyzer", audit.analyzers.promptSimulation)}

## Priority Diagnostic Signals

${renderIssues(audit.issues)}

## Suggested Structural Improvements

${renderRecommendations(audit.recommendations)}

## Entity Clarity Evidence

${renderEvidence(audit.scores.entityClarity.evidence)}

## Schema & Structured Data

${renderEvidence(audit.scores.structuredData.evidence)}

## Content Structure Evidence

${renderEvidence(audit.scores.contentChunkability.evidence)}

## Citation Readiness

${renderEvidence(audit.scores.citationReadiness.evidence)}

## Prompt Simulation Placeholder

${renderEvidence(audit.scores.promptSimulation.evidence)}

## Suggested Follow-up Analysis

1. Review high-severity entity and discoverability signals first.
2. Add explicit schema.org JSON-LD for the organization and key content types where appropriate.
3. Expand thin pages with clear, chunkable, crawlable explanations.
4. Add attribution, freshness markers, and evidence pages for factual claims.
`;
}

export function renderHtmlReport(audit: AuditResult): string {
  const issueItems = audit.issues
    .map(
      (issue) =>
        `<li><strong>${escapeHtml(issue.title)}</strong><br>${escapeHtml(issue.description)}</li>`
    )
    .join("");
  const fixItems = audit.recommendations
    .map(
      (fix) =>
        `<li><strong>${escapeHtml(fix.title)}</strong><br>${escapeHtml(fix.description)}</li>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OpenVisi Report - ${escapeHtml(audit.target.domain)}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #101418; background: #f6f7f9; }
      main { max-width: 960px; margin: 0 auto; padding: 40px 20px; }
      section { margin: 24px 0; }
      .hero, .panel { background: #fff; border: 1px solid #e4e7ec; border-radius: 8px; padding: 24px; }
      .score { font-size: 56px; line-height: 1; font-weight: 700; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .metric { background: #fff; border: 1px solid #e4e7ec; border-radius: 8px; padding: 16px; }
      .metric strong { display: block; font-size: 28px; margin-top: 8px; }
      li { margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Machine-Readable Visibility Diagnostic Report</h1>
        <p>${escapeHtml(audit.target.normalizedUrl)}</p>
        <p>Methodology version ${escapeHtml(audit.methodologyVersion)}</p>
        <div class="score">${audit.scores.aiVisibility}/100</div>
      </section>
      <section class="grid">
        ${metric("Entity", audit.scores.entityClarity.score)}
        ${metric("Technical", audit.scores.technicalDiscoverability.score)}
        ${metric("Schema", audit.scores.structuredData.score)}
        ${metric("Content", audit.scores.contentChunkability.score)}
        ${metric("Citation", audit.scores.citationReadiness.score)}
        ${metric("Prompt", audit.scores.promptSimulation.score)}
      </section>
      <section class="panel">
        <h2>Analyzer Explainability</h2>
        ${renderHtmlAnalyzer("Entity Clarity", audit.analyzers.entity)}
        ${renderHtmlAnalyzer("Technical Discoverability", audit.analyzers.technical)}
        ${renderHtmlAnalyzer("Structured Data", audit.analyzers.structuredData)}
        ${renderHtmlAnalyzer("Content Chunkability", audit.analyzers.content)}
        ${renderHtmlAnalyzer("Citation Readiness", audit.analyzers.citationReadiness)}
        ${renderHtmlAnalyzer("Prompt Simulation", audit.analyzers.promptSimulation)}
      </section>
      <section class="panel">
        <h2>Priority Diagnostic Signals</h2>
        <ol>${issueItems}</ol>
      </section>
      <section class="panel">
        <h2>Suggested Structural Improvements</h2>
        <ol>${fixItems}</ol>
      </section>
    </main>
  </body>
</html>
`;
}

function scoreLine(label: string, detail: ScoreDetail): string {
  return `- ${label}: ${detail.score}/100 (weight ${Math.round(detail.weight * 100)}%)`;
}

function renderIssues(issues: VisibilityIssue[]): string {
  if (issues.length === 0) return "No major diagnostic signals detected.";
  return issues
    .map(
      (issue, index) =>
        `${index + 1}. **[${issue.severity}] ${issue.title}**\n   ${issue.description}\n   Evidence: ${issue.evidence.join("; ")}`
    )
    .join("\n");
}

function renderRecommendations(recommendations: RecommendedFix[]): string {
  if (recommendations.length === 0) return "No structural improvements generated.";
  return recommendations
    .map((fix, index) => `${index + 1}. **[${fix.priority}] ${fix.title}**\n   ${fix.description}`)
    .join("\n");
}

function renderEvidence(evidence: string[]): string {
  if (evidence.length === 0) return "No evidence collected yet.";
  return evidence.map((item) => `- ${item}`).join("\n");
}

function renderAnalyzer(label: string, analyzer: AuditResult["analyzers"]["entity"]): string {
  return `### ${label}

- Score: ${analyzer.score}/100
- Maturity: ${analyzer.maturity}
- Issues: ${analyzer.issues.length}
- Recommendations: ${analyzer.recommendations.length}

Interpretation:
${analyzer.interpretation}

Detected signals:
${renderEvidence(analyzer.detectedSignals)}

Missing signals:
${renderEvidence(analyzer.missingSignals)}

Suggested structural improvements:
${renderEvidence(analyzer.suggestedStructuralImprovements)}
`;
}

function renderHtmlAnalyzer(label: string, analyzer: AuditResult["analyzers"]["entity"]): string {
  return `<article>
    <h3>${escapeHtml(label)}</h3>
    <p><strong>Score:</strong> ${analyzer.score}/100 · <strong>Maturity:</strong> ${escapeHtml(analyzer.maturity)}</p>
    <p>${escapeHtml(analyzer.interpretation)}</p>
    <h4>Detected signals</h4>
    ${htmlList(analyzer.detectedSignals)}
    <h4>Missing signals</h4>
    ${htmlList(analyzer.missingSignals)}
    <h4>Suggested structural improvements</h4>
    ${htmlList(analyzer.suggestedStructuralImprovements)}
  </article>`;
}

function htmlList(items: string[]): string {
  if (items.length === 0) return "<p>No signals recorded.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function metric(label: string, score: number): string {
  return `<div class="metric">${escapeHtml(label)}<strong>${score}/100</strong></div>`;
}

function slugifyDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
