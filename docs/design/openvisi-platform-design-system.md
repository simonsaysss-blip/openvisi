# OpenVisi Platform Design System

Status: Future Design Archive

This document describes a possible future product surface. It is not the current v0.1.0 RC scope, not a pricing commitment, and not a production SaaS roadmap. The current RC truth is the CLI artifact pipeline, canonical vocabulary, benchmark schema, and schema-backed directional demo.

Demo scores are directional unless provider-verified evidence is present. No ranking guarantees. No citation guarantees.

OpenVisi is the Trust Layer for AI Visibility.

This design system defines the product surface for a research-grade AI Visibility Platform covering benchmarks, brand analytics, LLM mention tracking, citation tracking, competitor comparison, prediction registry history, research reports, and enterprise dashboards.

The intended visual character is a hybrid of Stripe, Linear, Bloomberg, and Anthropic without copying any one system: precise, technical, premium, dense, and evidence-first.

## Product Design Thesis

OpenVisi should feel like infrastructure for measuring how entities appear in AI-generated answers, not a lightweight marketing dashboard.

The product interface must prioritize:

- Evidence before opinion.
- Metrics before narrative.
- Benchmarks before claims.
- Research notes before promotional copy.
- Traceability before decoration.
- Executive clarity without hiding raw signals.

Primary users include SaaS founders, CMOs, SEO and growth teams, AI startups, enterprise marketing teams, investors, and researchers. The UI must support both executive summary consumption and technical audit workflows.

## Brand Positioning

Primary line:

```text
OpenVisi is the Trust Layer for AI Visibility.
```

Canonical definition:

```text
AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers.
```

Product language:

- AI Visibility Platform
- AI Visibility Benchmark
- AI Visibility Diagnostics
- Brand Visibility Analytics
- LLM Mention Tracking
- Citation Tracking
- Competitor Comparison
- Prediction Registry
- Research Reports
- Enterprise Dashboard

Avoid language that makes OpenVisi sound like a generic plugin, automation tool, or growth shortcut. The product should read as measurement infrastructure.

## Visual Identity

### Tone

- Research grade
- Technical
- Trustworthy
- Institutional
- Premium SaaS
- Data-centric
- Calm under high information density

### Color System

| Role | Token | Hex | Usage |
| --- | --- | --- | --- |
| Primary | `brand.primary` | `#0A2540` | Navigation, key headings, primary data labels |
| Secondary | `brand.secondary` | `#102A43` | Dense panels, table headers, secondary brand zones |
| Accent | `brand.accent` | `#00D4FF` | Active states, selected benchmark slices, focus rings |
| Highlight | `brand.highlight` | `#64FFDA` | Positive deltas, citation improvements, active traces |
| Success | `status.success` | `#00C853` | Strong pass, high confidence, verified source |
| Warning | `status.warning` | `#FFB020` | Needs review, directional metric, incomplete evidence |
| Error | `status.error` | `#FF5252` | Regression, missing evidence, high displacement |
| Background | `surface.1` | `#F7FAFC` | Main application background |
| Dark Background | `surface.dark` | `#07131F` | Executive mode, command center, dark chart surfaces |

Usage rules:

- Use `#0A2540` as the anchor, not as the whole palette.
- Use accent colors sparingly for semantic signal, not decoration.
- Avoid full-page gradients.
- Avoid neon-on-black excess. Bloomberg density is welcome; crypto styling is not.
- In dense tables, reserve saturated color for exceptions, deltas, and selected states.

### Typography

Primary UI font:

```text
Inter
```

Data font:

```text
IBM Plex Mono
```

Rules:

- Use Inter for navigation, headings, controls, labels, and explanations.
- Use IBM Plex Mono for IDs, scores, confidence values, timestamps, prompt IDs, model names, URLs, and registry hashes.
- Do not use viewport-scaled type for dashboard surfaces.
- Use compact but readable type. Dense does not mean small everywhere.

Recommended scale:

| Token | Size | Line Height | Use |
| --- | ---: | ---: | --- |
| `display` | 48 | 54 | Homepage thesis only |
| `h1` | 32 | 40 | Page title |
| `h2` | 24 | 32 | Section title |
| `h3` | 18 | 26 | Panel title |
| `body` | 14 | 22 | Default UI text |
| `small` | 12 | 18 | Metadata, labels |
| `data` | 13 | 18 | Table values, metric cells |
| `caption` | 11 | 16 | Timestamps, source hints |

## Information Architecture

Top-level application:

```text
Homepage
Benchmark Platform
Dashboard
Reports
Prediction Registry
Research Hub
Pricing
Enterprise Contact
```

Authenticated app navigation:

```text
Overview
Benchmarks
Entities
Mentions
Citations
Competitors
Predictions
Reports
Research
Settings
```

Enterprise navigation additions:

```text
Teams
Workspaces
Audit Log
Data Sources
API Keys
Billing
Security
```

## Page Specifications

### Homepage

Purpose:

Introduce the category and establish trust quickly.

First viewport:

- Product name and positioning line.
- Canonical AI Visibility definition.
- Live-looking benchmark preview with labeled sample data.
- Primary CTA: view benchmark.
- Secondary CTA: read methodology.

Required sections:

- AI Visibility thesis.
- Four measurement dimensions: Presence, Accuracy, Citation, Competition.
- Benchmark preview.
- Enterprise reporting preview.
- Research methodology.
- Pricing or enterprise CTA.

Avoid:

- Oversized vague hero copy.
- Decorative cards that do not show real product surfaces.
- Marketing claims without measurement context.

### Benchmark Platform

Purpose:

Let users compare entities across categories and surfaces.

Primary layout:

- Left filter rail: category, model surface, region, date range, confidence level.
- Main benchmark table: entity rows, score columns, trend sparklines.
- Right evidence drawer: selected entity explanation, source coverage, methodology notes.

Core views:

- Category leaderboard.
- Entity comparison matrix.
- Citation coverage map.
- Competitor displacement ranking.
- Methodology and sample disclosure.

### Dashboard

Purpose:

Give an executive and operator view of AI Visibility performance.

Default layout:

- Executive summary band.
- AI Visibility Score card with confidence and evidence state.
- Four-layer score breakdown.
- Trend analysis.
- Citation and mention panels.
- Competitor displacement panel.
- Open issues and recommended actions.

Dashboard density:

- Above the fold should show score, delta, confidence, latest benchmark date, source count, competitor movement, and major risk.
- Every metric card must link to evidence.
- Empty states must explain what evidence is missing.

### Reports

Purpose:

Generate reproducible visibility reports.

Required flows:

- Create report.
- Select entity and competitors.
- Select prompt pack / benchmark pack.
- Select surfaces.
- Review evidence readiness.
- Generate draft.
- Human review.
- Export PDF / HTML / JSON.

Report sections:

- Executive Summary.
- AI Visibility Score.
- Answer Presence.
- Entity Clarity.
- Citation Coverage.
- AI Citation Signals.
- Competitor Displacement.
- Source Gaps.
- Recommended Fixes.
- Methodology and Limitations.

### Prediction Registry

Purpose:

Track claims, predictions, changes, and benchmark outcomes over time.

Use this as a trust surface, not a novelty feature.

Registry fields:

- Prediction ID.
- Entity.
- Claim.
- Metric affected.
- Baseline value.
- Predicted value.
- Time horizon.
- Evidence links.
- Confidence.
- Status.
- Outcome.
- Reviewer.

States:

- Draft.
- Registered.
- Under observation.
- Due for review.
- Confirmed.
- Missed.
- Inconclusive.

### Research Hub

Purpose:

Publish benchmark methodology, field tests, category analysis, and release notes.

Content types:

- Benchmark report.
- Field-test note.
- Methodology update.
- Category teardown.
- Prediction retrospective.
- Product release note.

Each research artifact must show:

- Date.
- Scope.
- Methodology.
- Evidence source.
- Limits.
- Related benchmark.

### Pricing

Purpose:

Communicate packaging without cheapening the platform.

Suggested tiers:

- Open Source: local diagnostics, docs, schemas.
- Team: hosted dashboard, tracked entities, scheduled reports.
- Business: competitor sets, citation tracking, team workflows.
- Enterprise: custom benchmarks, audit logs, procurement/security review, dedicated research support.

Pricing UI rules:

- Show measurable usage limits, not vague value claims.
- Include data retention, report exports, API access, and support level.
- Keep enterprise contact separate and serious.

### Enterprise Contact

Purpose:

Qualify serious benchmark, research, and dashboard deployments.

Required fields:

- Work email.
- Company.
- Role.
- Target entities.
- Competitors.
- Primary surfaces of interest.
- Reporting frequency.
- Security requirements.

Trust blocks:

- Methodology-first implementation.
- Reproducible reports.
- Audit-ready data model.
- Human review gates.

## Dashboard Architecture

### Layers

1. Executive Summary Layer
   - AI Visibility Score.
   - Confidence.
   - Latest movement.
   - Highest risk.
   - Suggested next action.

2. Diagnostic Layer
   - Presence.
   - Accuracy.
   - Citation.
   - Competition.
   - Trust and structure.

3. Evidence Layer
   - Prompts.
   - Answers.
   - Citations.
   - Crawled sources.
   - Model surface.
   - Timestamp.

4. Workflow Layer
   - Report generation.
   - Prediction registration.
   - Reviewer notes.
   - Export and share.

### Dashboard Grid

Desktop:

```text
12 columns
max content width: 1440px
outer margin: 32px
gap: 16px
panel radius: 8px max
panel padding: 16px
```

Large display / command center:

```text
16 columns
dark background allowed
data panels use 1px borders
charts use high contrast but low saturation
```

Tablet:

```text
8 columns
left nav collapses
right evidence drawer becomes bottom sheet
```

Mobile:

```text
4 columns
summary first
tables become sortable metric lists
charts become small multiples
```

## Benchmark Visualization Rules

Benchmark views must make comparison, confidence, and evidence state visible at the same time.

### Required Encodings

| Data | Primary Encoding | Secondary Encoding |
| --- | --- | --- |
| AI Visibility Score | Numeric score + horizontal bar | Delta and confidence |
| Answer Presence | Percent + trend sparkline | Prompt coverage count |
| Entity Clarity | Score + issue tags | Narrative mismatch count |
| Citation Coverage | Stacked source bar | Official vs third-party split |
| Competitor Displacement | Inverted risk score | Competitor names and frequency |
| Machine-readable Trust | Checklist score | Missing evidence list |
| AI Citation Signals | Signal count and quality | Source freshness |

### Score Bands

| Range | Label | Visual |
| ---: | --- | --- |
| 85-100 | Strong | Success color, solid bar |
| 70-84 | Competitive | Highlight color, solid bar |
| 50-69 | Watch | Warning color, striped marker |
| 0-49 | Risk | Error color, explicit issue label |
| null | Not measured | Neutral color, dashed line |

Rules:

- Never hide null values. Use `not measured`, `insufficient evidence`, or `blocked`.
- Scores require evidence provenance.
- Benchmark rankings must display sample size and date range.
- If a metric is directional, label it as directional.
- If a metric is mock-derived, label it as mock evidence.

## Data Visualization Standards

### Chart Types

Use:

- Ranked tables for benchmarks.
- Sparklines for short trend context.
- Small multiples for model or surface comparison.
- Heatmaps for category coverage.
- Slope charts for before/after movement.
- Stacked bars for citation source mix.
- Event timelines for prediction registry history.

Avoid:

- Donut charts for critical metrics.
- 3D charts.
- Decorative radial scores.
- Unlabeled color-only distinctions.
- Over-animated charts.

### Chart Anatomy

Every chart must include:

- Metric name.
- Date range.
- Entity set.
- Surface or model set.
- Sample size.
- Evidence state.
- Methodology link.

### Data States

Use explicit states:

- `measured`
- `directional`
- `mock`
- `blocked`
- `not_measured`
- `insufficient_evidence`

Display state in a visible badge near the metric title.

## Component Library

### Navigation

- `AppShell`
- `TopNav`
- `WorkspaceSwitcher`
- `EntitySwitcher`
- `BenchmarkFilterRail`
- `EvidenceDrawer`
- `CommandMenu`

### Metrics

- `MetricCard`
- `ScoreBand`
- `ScoreDelta`
- `ConfidenceBadge`
- `EvidenceStateBadge`
- `MetricBreakdown`
- `TrendSparkline`

### Benchmarking

- `BenchmarkTable`
- `EntityRankRow`
- `ComparisonMatrix`
- `CategoryLeaderboard`
- `CitationCoverageBar`
- `CompetitorDisplacementList`
- `BenchmarkMethodologyPopover`

### Reports

- `ReportBuilder`
- `ReportSectionPreview`
- `EvidenceChecklist`
- `ExportMenu`
- `ReviewerNote`
- `MethodologyDisclosure`

### Prediction Registry

- `PredictionTimeline`
- `PredictionStatusBadge`
- `PredictionClaimCard`
- `OutcomeReviewPanel`
- `RegistryAuditTrail`

### Research

- `ResearchArticleCard`
- `MethodologyCallout`
- `DatasetScopePanel`
- `FindingSummary`
- `LimitationsBlock`

### Enterprise

- `AuditLogTable`
- `TeamMemberTable`
- `DataSourceConnectorCard`
- `SecurityReviewPanel`
- `PlanUsageMeter`

## Component Rules

Metric cards:

- Must show value, label, evidence state, trend, and updated timestamp.
- Must link to detail.
- Must not rely on color alone.

Tables:

- Sticky header.
- Density toggle: comfortable / compact.
- Column visibility controls.
- Sortable metric columns.
- Row-level evidence drawer.
- Export controlled by role.

Drawers:

- Use for evidence, not generic settings.
- Must preserve current table context.
- Must deep-link to selected entity and metric.

Badges:

- Use consistent states.
- Keep text short.
- Prefer data state over marketing labels.

## UX Flows

### Flow 1: Run Benchmark

```text
Select category
Select target entity
Select competitor set
Select benchmark pack
Review evidence readiness
Run benchmark
Inspect results
Generate report
Register follow-up prediction
```

Guardrails:

- Show estimated scope before run.
- Explain missing source coverage before scoring.
- Require methodology snapshot before publishing.

### Flow 2: Investigate Visibility Drop

```text
Open dashboard alert
View affected metric
Compare prior period
Open evidence drawer
Inspect answer/citation/source changes
Tag likely cause
Create recommended fix
Schedule re-check
```

### Flow 3: Generate Enterprise Report

```text
Choose report template
Choose audience
Select metrics
Review limitations
Assign reviewer
Generate draft
Approve sections
Export
Archive evidence snapshot
```

### Flow 4: Register Prediction

```text
Create prediction
Attach baseline metric
Define expected movement
Set horizon
Assign reviewer
Lock prediction
Observe over time
Review outcome
Publish retrospective
```

## Next.js 15 Architecture

Production target:

```text
Next.js 15 App Router
TypeScript
Server Components by default
Client Components only for interactive charts, tables, filters, and drawers
Tailwind CSS
shadcn/ui
Recharts or Tremor-compatible chart primitives only after confirming bundle cost
```

Recommended app structure:

```text
apps/web/
  app/
    (marketing)/
      page.tsx
      pricing/page.tsx
      enterprise/page.tsx
      research/page.tsx
    (app)/
      dashboard/page.tsx
      benchmarks/page.tsx
      reports/page.tsx
      predictions/page.tsx
      entities/[entityId]/page.tsx
    api/
      reports/route.ts
      benchmarks/route.ts
  components/
    shell/
    metrics/
    benchmark/
    reports/
    predictions/
    charts/
    research/
    enterprise/
  lib/
    design/
    metrics/
    benchmark/
    auth/
    data/
  styles/
    globals.css
```

Rendering rules:

- Marketing pages can be static.
- Benchmark pages should use server-side data fetching with cache tags.
- Dashboard filters should be URL-addressable.
- Evidence drawers should support deep links.
- Report generation should be async with status polling.
- Prediction registry updates must be auditable.

## shadcn/ui Mapping

| Need | shadcn/ui Primitive | OpenVisi Component |
| --- | --- | --- |
| App navigation | `NavigationMenu`, `Sheet` | `AppShell`, `BenchmarkFilterRail` |
| Page tabs | `Tabs` | `MetricTabs`, `ReportTabs` |
| Data table controls | `Table`, `DropdownMenu`, `Checkbox` | `BenchmarkTable` |
| Filters | `Select`, `Popover`, `Command` | `BenchmarkFilters` |
| Evidence state | `Badge` | `EvidenceStateBadge` |
| Summary cards | `Card` | `MetricCard` |
| Drill-down | `Sheet`, `Dialog` | `EvidenceDrawer` |
| Report workflow | `Stepper` custom + `Card` | `ReportBuilder` |
| Registry timeline | custom | `PredictionTimeline` |
| Alerts | `Alert` | `MetricRiskAlert` |
| Forms | `Form`, `Input`, `Textarea` | `EnterpriseContactForm` |
| Loading | `Skeleton` | `MetricSkeleton`, `TableSkeleton` |

Component styling:

- Keep radius at 8px or less.
- Use 1px borders and subtle shadows.
- Avoid nested card structures.
- Use compact controls for data-heavy pages.
- Use icon buttons for repeated table and chart actions.

## Tailwind Token Implementation

Use [tailwind-tokens.ts](tailwind-tokens.ts) as the canonical implementation seed.

Core CSS variables:

```css
:root {
  --ov-bg: #F7FAFC;
  --ov-fg: #0A2540;
  --ov-surface: #FFFFFF;
  --ov-surface-raised: #EEF4F8;
  --ov-border: #D9E2EC;
  --ov-primary: #0A2540;
  --ov-secondary: #102A43;
  --ov-accent: #00D4FF;
  --ov-highlight: #64FFDA;
  --ov-success: #00C853;
  --ov-warning: #FFB020;
  --ov-error: #FF5252;
  --ov-dark: #07131F;
}
```

Class patterns:

```text
page background: bg-[var(--ov-bg)] text-[var(--ov-fg)]
panel: rounded-lg border border-[var(--ov-border)] bg-white shadow-sm
data value: font-mono tabular-nums
active focus: ring-2 ring-[var(--ov-accent)] ring-offset-2
critical value: text-[var(--ov-error)]
```

## Enterprise SaaS Specifications

Security and trust surfaces:

- Workspace-level access control.
- Role-based exports.
- Audit log for benchmark runs, report approvals, prediction changes, and source changes.
- Methodology version pinned to every published report.
- Evidence snapshot retention policy.
- Clear data provenance for each metric.

Roles:

- Owner.
- Admin.
- Analyst.
- Reviewer.
- Viewer.
- External reviewer.

Enterprise dashboard requirements:

- Multi-entity portfolio view.
- Competitor set management.
- Scheduled benchmark runs.
- Report approval workflow.
- API access status.
- Data retention settings.
- Export history.

## AI Visibility Platform Design Language

Preferred product metaphors:

- Benchmark.
- Evidence.
- Registry.
- Signal.
- Surface.
- Snapshot.
- Layer.
- Confidence.
- Citation.
- Displacement.

Preferred UI labels:

- Evidence state.
- Methodology snapshot.
- Source coverage.
- Prompt coverage.
- Citation mix.
- Competitor movement.
- Prediction outcome.
- Report readiness.

Avoid vague labels:

- Magic score.
- Growth score.
- Optimization engine.
- Secret ranking.
- AI hack.

## OpenVisi Brand Rules

Logo usage:

- Use the wordmark in primary navy on light surfaces.
- Use inverse wordmark on dark command-center surfaces.
- Do not pair the wordmark with decorative mascots.

Voice:

- Precise.
- Calm.
- Methodological.
- Transparent about limitations.
- Confident without inflated claims.

Copy rules:

- Lead with what is measured.
- State evidence scope.
- State confidence.
- State limitation.
- Then state recommendation.

Example:

```text
Citation Coverage declined from 42% to 31% across the current benchmark pack.
The drop is concentrated in third-party sources, while official source coverage is unchanged.
Review source freshness and comparison-page clarity before the next benchmark run.
```

## Accessibility And Quality Bar

Required:

- WCAG AA contrast minimum.
- Keyboard navigable tables, filters, drawers, and dialogs.
- Visible focus rings.
- Screen-reader labels for icon buttons.
- Non-color indicators for score bands.
- Timestamp and methodology disclosure for all benchmark results.
- Reduced-motion support.

Performance:

- Dashboard first meaningful content under 2 seconds on standard broadband.
- Use virtualization for large tables.
- Defer heavy charts below the fold.
- Prefer server-rendered summaries.
- Lazy-load report preview and historical registry charts.

## Implementation Priorities

Phase 1:

- Marketing homepage.
- Benchmark preview.
- Dashboard shell.
- Metric cards.
- Benchmark table.
- Evidence drawer.
- Report template preview.

Phase 2:

- Prediction registry.
- Research hub.
- Report builder.
- Entity detail pages.
- Citation source explorer.

Phase 3:

- Enterprise workspaces.
- Scheduled benchmarks.
- Approval workflows.
- Audit logs.
- API and export controls.

Definition of done:

- Every metric surface links to evidence.
- Every score shows state and methodology.
- Every chart has date range and sample size.
- Every report can be reproduced from stored inputs.
- Every public claim maps back to measured or explicitly directional evidence.
