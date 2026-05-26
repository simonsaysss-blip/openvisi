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
  const highSignalCount = audit.issues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "high"
  ).length;
  const scoreCards = [
    {
      label: "AI Visibility Score",
      score: audit.scores.aiVisibility,
      description: "Weighted diagnostic signal across machine-readable visibility categories."
    },
    {
      label: "Entity Clarity Score",
      score: audit.scores.entityClarity.score,
      description: "How clearly the site identifies the organization, audience, location, and offer."
    },
    {
      label: "Technical Discoverability Score",
      score: audit.scores.technicalDiscoverability.score,
      description: "Crawlability, metadata, canonical, sitemap, robots, and llms.txt signals."
    },
    {
      label: "Structured Data Score",
      score: audit.scores.structuredData.score,
      description: "schema.org and JSON-LD coverage for machine-readable entity structure."
    },
    {
      label: "Content Chunkability Score",
      score: audit.scores.contentChunkability.score,
      description: "Heading structure, FAQ patterns, definitions, and readable text density."
    },
    {
      label: "Citation Readiness Score",
      score: audit.scores.citationReadiness.score,
      description: "Trust, freshness, evidence, and attribution signals for factual interpretation."
    }
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>OpenVisi Report - ${escapeHtml(audit.target.domain)}</title>
    <style>
      :root {
        color-scheme: light dark;
        --bg: #f5f7fa;
        --surface: #ffffff;
        --surface-muted: #f8fafc;
        --text: #101418;
        --muted: #5d6675;
        --border: #d8dee8;
        --accent: #2563eb;
        --accent-soft: #dbeafe;
        --critical: #991b1b;
        --critical-bg: #fee2e2;
        --high: #9a3412;
        --high-bg: #ffedd5;
        --medium: #854d0e;
        --medium-bg: #fef3c7;
        --low: #334155;
        --low-bg: #e2e8f0;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #0b0f14;
          --surface: #111820;
          --surface-muted: #151e28;
          --text: #e5e7eb;
          --muted: #9aa4b2;
          --border: #263241;
          --accent: #60a5fa;
          --accent-soft: #17263b;
          --critical: #fecaca;
          --critical-bg: #5f161e;
          --high: #fed7aa;
          --high-bg: #4a2411;
          --medium: #fde68a;
          --medium-bg: #3f310b;
          --low: #cbd5e1;
          --low-bg: #263241;
        }
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 320px),
          var(--bg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
      }
      main { max-width: 1180px; margin: 0 auto; padding: 40px 20px 56px; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { font-size: clamp(2rem, 5vw, 4.2rem); line-height: 0.98; letter-spacing: 0; margin-bottom: 18px; }
      h2 { font-size: 1.05rem; letter-spacing: 0; margin-bottom: 18px; }
      h3 { font-size: 0.95rem; margin-bottom: 10px; }
      p { color: var(--muted); }
      section { margin-top: 18px; }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
        gap: 24px;
        align-items: end;
        padding: 28px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: linear-gradient(135deg, var(--surface), var(--surface-muted));
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .target {
        display: inline-flex;
        max-width: 100%;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: 7px;
        color: var(--text);
        background: var(--surface);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.85rem;
        overflow-wrap: anywhere;
      }
      .hero-meta {
        display: grid;
        gap: 8px;
        color: var(--muted);
        font-size: 0.9rem;
      }
      .hero-score {
        padding: 22px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }
      .score-value {
        display: flex;
        align-items: baseline;
        gap: 8px;
        color: var(--text);
        font-size: 4rem;
        font-weight: 760;
        line-height: 1;
      }
      .score-value span { color: var(--muted); font-size: 1.15rem; font-weight: 650; }
      .grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
      .score-card {
        grid-column: span 4;
        min-height: 188px;
        padding: 18px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }
      .score-card.primary { grid-column: span 8; }
      .score-card-title {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .score-card strong {
        display: block;
        margin: 18px 0 10px;
        color: var(--text);
        font-size: 2.35rem;
        line-height: 1;
      }
      .progress {
        width: 100%;
        height: 9px;
        overflow: hidden;
        border-radius: 999px;
        background: var(--low-bg);
      }
      .progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--accent), #22c55e);
      }
      .panel {
        padding: 22px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--surface);
      }
      .summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
      .summary-item {
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface-muted);
      }
      .summary-item strong { display: block; font-size: 1.4rem; }
      .list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
      .list li {
        display: grid;
        gap: 6px;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface-muted);
      }
      .row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 750;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .badge.critical { color: var(--critical); background: var(--critical-bg); }
      .badge.high { color: var(--high); background: var(--high-bg); }
      .badge.medium { color: var(--medium); background: var(--medium-bg); }
      .badge.low { color: var(--low); background: var(--low-bg); }
      .badge.neutral { color: var(--muted); background: var(--surface-muted); border: 1px solid var(--border); }
      .split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .signal-box {
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface-muted);
      }
      .signal-box ul { margin: 0; padding-left: 18px; color: var(--muted); }
      .signal-box li { margin: 8px 0; }
      .asset-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
      .asset {
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface-muted);
      }
      .asset strong { display: block; margin-bottom: 6px; }
      table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
      th, td { padding: 10px 8px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
      th { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; }
      td { color: var(--text); }
      .url { max-width: 520px; overflow-wrap: anywhere; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.82rem; }
      .muted { color: var(--muted); }
      .footer-note { margin-top: 18px; font-size: 0.88rem; }

      @media (max-width: 860px) {
        main { padding: 24px 14px 42px; }
        .hero { grid-template-columns: 1fr; }
        .score-card, .score-card.primary { grid-column: span 12; }
        .summary-grid, .asset-grid, .split { grid-template-columns: 1fr; }
        .row { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <div class="eyebrow">OpenVisi Static Report</div>
          <h1>Machine-readable visibility diagnostics</h1>
          <p class="target">${escapeHtml(audit.target.normalizedUrl)}</p>
        </div>
        <div class="hero-score">
          <div class="score-card-title">AI Visibility Score <span>Snapshot</span></div>
          <div class="score-value">${audit.scores.aiVisibility}<span>/100</span></div>
          ${progressBar(audit.scores.aiVisibility)}
          <div class="hero-meta">
            <span>Domain: ${escapeHtml(audit.target.domain)}</span>
            <span>Generated: ${escapeHtml(audit.generatedAt)}</span>
            <span>Methodology: ${escapeHtml(audit.methodologyVersion)}</span>
          </div>
        </div>
      </section>

      <section class="grid">
        ${scoreCards.map((card, index) => scoreCard(card, index === 0)).join("")}
      </section>

      <section class="panel">
        <h2>Executive Summary</h2>
        <p>
          This static report summarizes public machine-readable visibility signals collected during
          one crawl snapshot. Scores are heuristic diagnostics for structure, clarity, and
          discoverability; they do not predict rankings, citations, or answer inclusion in any
          specific LLM-powered product.
        </p>
        <div class="summary-grid">
          ${summaryItem("Crawled pages", audit.crawl.pages.length)}
          ${summaryItem("Skipped URLs", audit.crawl.skippedUrls.length)}
          ${summaryItem("Diagnostic signals", audit.issues.length)}
          ${summaryItem("High priority signals", highSignalCount)}
        </div>
      </section>

      <section class="panel">
        <h2>Top Diagnostic Signals</h2>
        ${renderHtmlIssues(audit.issues)}
      </section>

      <section class="panel">
        <h2>Suggested Structural Improvements</h2>
        ${renderHtmlRecommendations(audit.recommendations)}
      </section>

      <section class="panel">
        <h2>Structured Data Findings</h2>
        ${renderStructuredDataFindings(audit)}
      </section>

      <section class="panel">
        <h2>Crawl Summary</h2>
        ${renderCrawlSummary(audit)}
      </section>

      <section class="grid">
        ${renderHtmlAnalyzer("Entity Clarity", audit.analyzers.entity)}
        ${renderHtmlAnalyzer("Technical Discoverability", audit.analyzers.technical)}
        ${renderHtmlAnalyzer("Content Chunkability", audit.analyzers.content)}
        ${renderHtmlAnalyzer("Citation Readiness", audit.analyzers.citationReadiness)}
      </section>

      <p class="footer-note muted">
        Generated by OpenVisi. This report is static HTML with embedded CSS and no runtime scripts.
      </p>
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
  return `<article class="score-card">
    <div class="score-card-title">
      ${escapeHtml(label)}
      <span class="badge neutral">${escapeHtml(analyzer.maturity)}</span>
    </div>
    <strong>${analyzer.score}/100</strong>
    ${progressBar(analyzer.score)}
    <p>${escapeHtml(analyzer.interpretation)}</p>
    <div class="split">
      <div class="signal-box">
        <h3>Detected signals</h3>
        ${htmlList(analyzer.detectedSignals)}
      </div>
      <div class="signal-box">
        <h3>Missing signals</h3>
        ${htmlList(analyzer.missingSignals)}
      </div>
    </div>
  </article>`;
}

function htmlList(items: string[]): string {
  if (items.length === 0) return "<p>No signals recorded.</p>";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderHtmlIssues(issues: VisibilityIssue[]): string {
  if (issues.length === 0) return `<p>No major diagnostic signals detected.</p>`;
  return `<ol class="list">${issues.map(renderIssueItem).join("")}</ol>`;
}

function renderIssueItem(issue: VisibilityIssue): string {
  return `<li>
    <div class="row">
      <div>
        <strong>${escapeHtml(issue.title)}</strong>
        <p>${escapeHtml(issue.description)}</p>
      </div>
      ${severityBadge(issue.severity)}
    </div>
    ${issue.evidence.length > 0 ? `<p class="muted">Evidence: ${escapeHtml(issue.evidence.join("; "))}</p>` : ""}
  </li>`;
}

function renderHtmlRecommendations(recommendations: RecommendedFix[]): string {
  if (recommendations.length === 0) return `<p>No structural improvements generated.</p>`;
  return `<ol class="list">${recommendations.map(renderRecommendationItem).join("")}</ol>`;
}

function renderRecommendationItem(fix: RecommendedFix): string {
  return `<li>
    <div class="row">
      <div>
        <strong>${escapeHtml(fix.title)}</strong>
        <p>${escapeHtml(fix.description)}</p>
      </div>
      ${severityBadge(fix.priority)}
    </div>
  </li>`;
}

function renderStructuredDataFindings(audit: AuditResult): string {
  const analyzer = audit.analyzers.structuredData;
  return `<div class="row">
      <div>
        <h3>Structured Data Score</h3>
        <p>${escapeHtml(analyzer.interpretation)}</p>
      </div>
      <span class="badge neutral">${escapeHtml(analyzer.maturity)}</span>
    </div>
    <div class="score-value">${analyzer.score}<span>/100</span></div>
    ${progressBar(analyzer.score)}
    <div class="split">
      <div class="signal-box">
        <h3>Detected structured data signals</h3>
        ${htmlList(analyzer.detectedSignals)}
      </div>
      <div class="signal-box">
        <h3>Missing structured data signals</h3>
        ${htmlList(analyzer.missingSignals)}
      </div>
    </div>
    <div class="signal-box" style="margin-top: 14px;">
      <h3>Evidence</h3>
      ${htmlList(analyzer.evidence)}
    </div>`;
}

function renderCrawlSummary(audit: AuditResult): string {
  const { crawl } = audit;
  return `<div class="asset-grid">
      ${assetCard("robots.txt", crawl.assets.robotsTxt.found, crawl.assets.robotsTxt.statusCode)}
      ${assetCard("sitemap.xml", crawl.assets.sitemapXml.found, crawl.assets.sitemapXml.statusCode)}
      ${assetCard("llms.txt", crawl.assets.llmsTxt.found, crawl.assets.llmsTxt.statusCode)}
    </div>
    <div class="summary-grid" style="margin-top: 14px;">
      ${summaryItem("Max pages", crawl.maxPages)}
      ${summaryItem("Pages crawled", crawl.pages.length)}
      ${summaryItem("Skipped URLs", crawl.skippedUrls.length)}
      ${summaryItem("Robots respected", crawl.respectRobots ? "yes" : "no")}
    </div>
    <div style="overflow-x: auto; margin-top: 16px;">
      <table>
        <thead>
          <tr>
            <th>URL</th>
            <th>Status</th>
            <th>Title</th>
            <th>Schema blocks</th>
          </tr>
        </thead>
        <tbody>
          ${crawl.pages.slice(0, 12).map(renderPageRow).join("")}
        </tbody>
      </table>
    </div>`;
}

function renderPageRow(page: AuditResult["crawl"]["pages"][number]): string {
  return `<tr>
    <td class="url">${escapeHtml(page.url)}</td>
    <td>${page.statusCode}</td>
    <td>${escapeHtml(page.title ?? "Untitled")}</td>
    <td>${page.schemaJsonLd.length}</td>
  </tr>`;
}

function scoreCard(
  card: { label: string; score: number; description: string },
  primary = false
): string {
  return `<article class="score-card${primary ? " primary" : ""}">
    <div class="score-card-title">${escapeHtml(card.label)} <span>${scoreLabel(card.score)}</span></div>
    <strong>${card.score}/100</strong>
    ${progressBar(card.score)}
    <p>${escapeHtml(card.description)}</p>
  </article>`;
}

function progressBar(score: number): string {
  const value = clampScore(score);
  return `<div class="progress" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
    <span style="width: ${value}%"></span>
  </div>`;
}

function summaryItem(label: string, value: string | number): string {
  return `<div class="summary-item"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function assetCard(label: string, found: boolean, statusCode: number | null): string {
  const severity = found ? "low" : "high";
  const status = statusCode === null ? "not found" : String(statusCode);
  return `<div class="asset">
    <div class="row">
      <strong>${escapeHtml(label)}</strong>
      ${severityBadge(severity)}
    </div>
    <span class="muted">${found ? "Found" : "Missing"} · ${escapeHtml(status)}</span>
  </div>`;
}

function severityBadge(severity: VisibilityIssue["severity"]): string {
  return `<span class="badge ${escapeHtml(severity)}">${escapeHtml(severity)}</span>`;
}

function scoreLabel(score: number): string {
  if (score >= 80) return "strong";
  if (score >= 60) return "moderate";
  if (score >= 40) return "limited";
  return "weak";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
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
