type MetricState = "measured" | "directional" | "not_measured";

type SummaryMetric = {
  label: string;
  value: string;
  delta: string;
  state: MetricState;
  detail: string;
};

type BenchmarkRow = {
  entity: string;
  category: string;
  score: number | null;
  presence: number | null;
  clarity: number | null;
  citation: number | null;
  displacement: number | null;
  confidence: string;
  state: MetricState;
};

const summaryMetrics: SummaryMetric[] = [
  {
    label: "AI Visibility Score",
    value: "72",
    delta: "+4.8",
    state: "directional",
    detail: "Composite sample from benchmark-ready metric fields"
  },
  {
    label: "Answer Presence",
    value: "64%",
    delta: "+7.2",
    state: "directional",
    detail: "Prompt coverage weighted by category-intent pack"
  },
  {
    label: "Citation Coverage",
    value: "38%",
    delta: "-2.1",
    state: "directional",
    detail: "Official and third-party source availability"
  },
  {
    label: "Competitor Displacement",
    value: "42%",
    delta: "+5.4",
    state: "directional",
    detail: "Share of benchmark answers routed to alternatives"
  }
];

const benchmarkRows: BenchmarkRow[] = [
  {
    entity: "OpenVisi",
    category: "AI Visibility Platform",
    score: 72,
    presence: 64,
    clarity: 71,
    citation: 38,
    displacement: 42,
    confidence: "Medium",
    state: "directional"
  },
  {
    entity: "Developer Docs Co.",
    category: "Developer Tools",
    score: 81,
    presence: 77,
    clarity: 83,
    citation: 69,
    displacement: 24,
    confidence: "High",
    state: "measured"
  },
  {
    entity: "Regulated SaaS Inc.",
    category: "QMS Software",
    score: 58,
    presence: 46,
    clarity: 61,
    citation: 54,
    displacement: 63,
    confidence: "Medium",
    state: "directional"
  },
  {
    entity: "Education Platform A",
    category: "Learning Platform",
    score: 49,
    presence: 39,
    clarity: 44,
    citation: 31,
    displacement: 68,
    confidence: "Low",
    state: "directional"
  },
  {
    entity: "AI Startup Index",
    category: "AI Products",
    score: null,
    presence: null,
    clarity: null,
    citation: null,
    displacement: null,
    confidence: "Blocked",
    state: "not_measured"
  }
];

const evidenceItems = [
  ["Methodology", "AI Visibility Benchmark v0.1"],
  ["Evidence state", "Directional sample"],
  ["Prompt pack", "Category discovery + alternatives"],
  ["Source coverage", "Official docs, comparison pages, third-party mentions"],
  ["Review gate", "Final score blocked until provider evidence is verified"]
];

const registryItems = [
  ["PRD-014", "Citation Coverage improves after docs restructure", "Under observation"],
  ["PRD-015", "Entity Clarity rises after category-page rewrite", "Registered"],
  ["PRD-016", "Competitor Displacement falls in buyer-intent prompts", "Draft"]
];

const reportSections = [
  "AI Visibility Score",
  "Answer Presence",
  "Entity Clarity",
  "Citation Coverage",
  "AI Citation Signals",
  "Competitor Displacement"
];

const researchItems = [
  ["Field test", "Developer docs as AI Visibility infrastructure"],
  ["Methodology", "Directional metrics and evidence states"],
  ["Benchmark note", "Regulated SaaS and machine-readable trust"]
];

const pricingItems = [
  ["Open Source", "Local diagnostics and schemas"],
  ["Team", "Tracked entities and scheduled reports"],
  ["Enterprise", "Custom benchmarks and audit workflows"]
];

function stateLabel(state: MetricState) {
  if (state === "measured") return "Measured";
  if (state === "not_measured") return "Not measured";
  return "Directional";
}

function formatMetric(value: number | null, suffix = "") {
  return value === null ? "null" : `${value}${suffix}`;
}

export default function HomePage() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="OpenVisi navigation">
        <div className="brand-block">
          <span className="brand-mark">OV</span>
          <div>
            <p>OpenVisi</p>
            <strong>Trust Layer</strong>
          </div>
        </div>

        <nav className="nav-list" aria-label="Product sections">
          {["Overview", "Benchmarks", "Dashboard", "Reports", "Predictions", "Research", "Pricing", "Enterprise"].map(
            (item) => (
              <a className={item === "Overview" ? "active" : ""} href={`#${item.toLowerCase()}`} key={item}>
                {item}
              </a>
            )
          )}
        </nav>

        <div className="workspace-card">
          <span>Workspace</span>
          <strong>AI Visibility Lab</strong>
          <small>Benchmark pack: v0.1</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar" id="overview">
          <div>
            <p className="eyebrow">The Trust Layer for AI Visibility</p>
            <h1>AI Visibility Benchmark Command Center</h1>
            <p className="definition">
              AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an
              entity across AI-generated answers.
            </p>
          </div>
          <div className="run-state" aria-label="Current benchmark state">
            <span>Benchmark state</span>
            <strong>Sample diagnostic</strong>
            <small>Provider-backed scoring pending review</small>
          </div>
        </header>

        <section className="metric-grid" id="dashboard" aria-label="Executive metric summary">
          {summaryMetrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <div className="metric-card__top">
                <span>{metric.label}</span>
                <em className={`state state--${metric.state}`}>{stateLabel(metric.state)}</em>
              </div>
              <div className="metric-value-row">
                <strong>{metric.value}</strong>
                <small className={metric.delta.startsWith("-") ? "delta negative" : "delta positive"}>
                  {metric.delta}
                </small>
              </div>
              <p>{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="panel benchmark-panel" id="benchmarks">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">AI Visibility Benchmark</p>
                <h2>Entity Visibility Scores</h2>
              </div>
              <span className="sample-badge">Sample data</span>
            </div>

            <div className="benchmark-table" role="table" aria-label="AI Visibility benchmark comparison">
              <div className="benchmark-row benchmark-row--head" role="row">
                <span>Entity</span>
                <span>Score</span>
                <span>Presence</span>
                <span>Clarity</span>
                <span>Citation</span>
                <span>Displacement</span>
                <span>Confidence</span>
              </div>
              {benchmarkRows.map((row) => (
                <div className="benchmark-row" role="row" key={row.entity}>
                  <span className="entity-cell">
                    <strong>{row.entity}</strong>
                    <small>{row.category}</small>
                  </span>
                  <span className="score-cell">
                    <strong>{formatMetric(row.score)}</strong>
                    <i style={{ width: `${row.score ?? 8}%` }} />
                  </span>
                  <span>{formatMetric(row.presence, "%")}</span>
                  <span>{formatMetric(row.clarity, "%")}</span>
                  <span>{formatMetric(row.citation, "%")}</span>
                  <span className={(row.displacement ?? 0) > 55 ? "risk-value" : ""}>
                    {formatMetric(row.displacement, "%")}
                  </span>
                  <span>
                    <em className={`state state--${row.state}`}>{row.confidence}</em>
                  </span>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel evidence-panel" aria-label="Evidence drawer">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Evidence Drawer</p>
                <h2>Methodology Snapshot</h2>
              </div>
            </div>
            <dl className="evidence-list">
              {evidenceItems.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="lower-grid">
          <article className="panel" id="reports">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Research Reports</p>
                <h2>Report Generation UX</h2>
              </div>
              <span className="sample-badge">Draft</span>
            </div>
            <div className="report-sections" aria-label="Report sections">
              {reportSections.map((section, index) => (
                <span key={section}>
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  {section}
                </span>
              ))}
            </div>
          </article>

          <article className="panel" id="predictions">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Prediction Registry</p>
                <h2>Visibility Claims Under Review</h2>
              </div>
            </div>
            <div className="registry-list">
              {registryItems.map(([id, claim, status]) => (
                <div className="registry-item" key={id}>
                  <span>{id}</span>
                  <strong>{claim}</strong>
                  <em>{status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="platform-grid">
          <article className="panel" id="research">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Research Hub</p>
                <h2>Published Visibility Research</h2>
              </div>
            </div>
            <div className="compact-list">
              {researchItems.map(([type, title]) => (
                <div key={title}>
                  <span>{type}</span>
                  <strong>{title}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel" id="pricing">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Pricing</p>
                <h2>Measurement Infrastructure Tiers</h2>
              </div>
            </div>
            <div className="compact-list">
              {pricingItems.map(([tier, scope]) => (
                <div key={tier}>
                  <span>{tier}</span>
                  <strong>{scope}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel enterprise-panel" id="enterprise">
            <div>
              <p className="panel-kicker">Enterprise Contact</p>
              <h2>Custom AI Visibility Benchmarks</h2>
            </div>
            <div className="enterprise-fields" aria-label="Enterprise qualification fields">
              {["Company", "Target entities", "Competitors", "Benchmark cadence", "Security review"].map((field) => (
                <span key={field}>{field}</span>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
