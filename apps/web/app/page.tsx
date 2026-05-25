const metrics = [
  ["AI Visibility", "CLI-first scoring"],
  ["Entity Clarity", "Brand understanding"],
  ["Technical", "Sitemap, robots, llms.txt"],
  ["Schema", "Structured data readiness"]
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">OpenVisi</p>
          <h1>AI visibility analytics for LLM-powered discovery</h1>
        </div>
        <code>npm run cli -- scan https://example.com</code>
      </section>
      <section className="metrics" aria-label="Dashboard metrics">
        {metrics.map(([label, description]) => (
          <article className="metric" key={label}>
            <span>{label}</span>
            <strong>{description}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
