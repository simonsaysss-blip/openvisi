import type {
  AnalyzerResult,
  AuditResult,
  CrawlResult,
  JsonValue,
  PageData,
  RecommendedFix,
  ScoreCategory,
  ScoreDetail,
  VisibilityIssue
} from "./types.js";

const weights: Record<ScoreCategory, number> = {
  entityClarity: 0.25,
  technicalDiscoverability: 0.2,
  structuredData: 0.2,
  contentChunkability: 0.15,
  citationReadiness: 0.1,
  promptSimulation: 0.1
};

export function createAudit(crawl: CrawlResult): AuditResult {
  const entity = analyzeEntity(crawl);
  const technical = analyzeTechnical(crawl);
  const structuredData = analyzeStructuredData(crawl);
  const content = analyzeContent(crawl);
  const citationReadiness = analyzeCitationReadiness(crawl);
  const promptSimulation = analyzePromptSimulation();

  const issues = sortIssues([
    ...entity.issues,
    ...technical.issues,
    ...structuredData.issues,
    ...content.issues,
    ...citationReadiness.issues,
    ...promptSimulation.issues
  ]).slice(0, 10);

  const recommendations = sortRecommendations([
    ...entity.recommendations,
    ...technical.recommendations,
    ...structuredData.recommendations,
    ...content.recommendations,
    ...citationReadiness.recommendations,
    ...promptSimulation.recommendations
  ]).slice(0, 10);

  const aiVisibility = clampScore(
    entity.score * weights.entityClarity +
      technical.score * weights.technicalDiscoverability +
      structuredData.score * weights.structuredData +
      content.score * weights.contentChunkability +
      citationReadiness.score * weights.citationReadiness +
      promptSimulation.score * weights.promptSimulation
  );

  return {
    projectName: "OpenVisi AI Visibility Audit",
    generatedAt: new Date().toISOString(),
    target: {
      inputUrl: crawl.inputUrl,
      normalizedUrl: crawl.normalizedUrl,
      domain: crawl.domain
    },
    scores: {
      aiVisibility,
      entityClarity: detail(entity, weights.entityClarity),
      technicalDiscoverability: detail(technical, weights.technicalDiscoverability),
      structuredData: detail(structuredData, weights.structuredData),
      contentChunkability: detail(content, weights.contentChunkability),
      citationReadiness: detail(citationReadiness, weights.citationReadiness),
      promptSimulation: detail(promptSimulation, weights.promptSimulation)
    },
    analyzers: {
      entity,
      technical,
      structuredData,
      content,
      citationReadiness,
      promptSimulation
    },
    issues,
    recommendations,
    crawl
  };
}

export function analyzeEntity(crawl: CrawlResult): AnalyzerResult {
  const collector = createCollector();
  const homepage = getHomepage(crawl);
  const allText = getAllVisibleText(crawl.pages);
  const schemaTypes = getSchemaTypes(crawl.pages);
  const evidence: string[] = [];
  let score = 15;

  if (homepage?.title) {
    score += 10;
    evidence.push(`Brand/title signal found: ${homepage.title}`);
  } else {
    collector.add(
      "missing-title",
      "entityClarity",
      "high",
      "Homepage title is missing",
      "AI systems need a direct title signal to identify the site entity.",
      ["Add a concise homepage title with the brand name and category."]
    );
  }

  if (homepage && homepage.h1.length > 0) {
    score += 10;
    evidence.push(`Homepage H1 found: ${homepage.h1.join(" | ")}`);
  } else {
    collector.add(
      "missing-h1",
      "entityClarity",
      "high",
      "Homepage H1 is missing",
      "A clear H1 helps LLMs identify the main entity and page purpose.",
      ["Add one primary H1 that names the brand or the core offer."]
    );
  }

  if (homepage?.metaDescription && homepage.metaDescription.length >= 80) {
    score += 12;
    evidence.push("Homepage meta description includes a descriptive entity summary.");
  } else {
    collector.add(
      "thin-meta-description",
      "entityClarity",
      "medium",
      "Homepage meta description is missing or too thin",
      "AI systems need concise brand descriptions to identify what the organization does.",
      ["Write a direct description with brand, business type, audience, location, and services."]
    );
  }

  if (containsAny(allText, ["school", "academy", "platform", "toolkit", "software", "saas"])) {
    score += 10;
    evidence.push("Business type signals found in page copy.");
  } else {
    collector.add(
      "unclear-business-type",
      "entityClarity",
      "medium",
      "Business type is not explicit",
      "LLMs need a category label before they can compare or recommend a site.",
      ["State the business type clearly, such as open-source toolkit, school, SaaS, or platform."]
    );
  }

  if (containsAny(allText, ["service", "services", "course", "courses", "product", "solution"])) {
    score += 10;
    evidence.push("Service or product description signals found.");
  } else {
    collector.add(
      "unclear-service-description",
      "entityClarity",
      "medium",
      "Service description is weak",
      "AI answer engines need compact explanations of what the site offers.",
      ["Add a short service overview and dedicated service pages."]
    );
  }

  if (containsAny(allText, ["taipei", "new taipei", "linkou", "taiwan", "remote", "global"])) {
    score += 8;
    evidence.push("Location or service-area signal found.");
  } else {
    collector.add(
      "weak-location-signal",
      "entityClarity",
      "low",
      "Location or service area is unclear",
      "Local and vertical AI discovery benefits from explicit geography or service scope.",
      ["Add city, region, country, or service-area details where relevant."]
    );
  }

  if (containsAny(allText, ["student", "parent", "developer", "maintainer", "team", "marketer"])) {
    score += 10;
    evidence.push("Target audience signals found.");
  } else {
    collector.add(
      "weak-audience-signal",
      "entityClarity",
      "medium",
      "Target audience is unclear",
      "LLMs need audience labels to decide when a recommendation is relevant.",
      ["Add explicit audience copy such as developers, maintainers, marketers, or parents."]
    );
  }

  if (hasContactSignal(crawl.pages)) {
    score += 10;
    evidence.push("Contact information or contact page discovered.");
  } else {
    collector.add(
      "missing-contact-signal",
      "entityClarity",
      "medium",
      "Contact information is hard to find",
      "Trust and entity verification are weaker when contact signals are absent.",
      ["Add a contact page or visible email, phone, address, or support channel."]
    );
  }

  if (schemaTypes.some((type) => ["Organization", "LocalBusiness"].includes(type))) {
    score += 15;
    evidence.push("Organization or LocalBusiness schema found.");
  } else {
    collector.add(
      "missing-organization-schema",
      "entityClarity",
      "high",
      "Organization-level schema is missing",
      "Without Organization or LocalBusiness schema, LLMs have fewer explicit entity signals.",
      ["Add Organization or LocalBusiness JSON-LD with name, URL, logo, sameAs, and contact."]
    );
  }

  return collector.result(score, evidence);
}

export function analyzeTechnical(crawl: CrawlResult): AnalyzerResult {
  const collector = createCollector();
  const evidence: string[] = [];
  let score = 10;

  if (crawl.assets.robotsTxt.found) {
    score += 12;
    evidence.push("robots.txt found.");
  } else {
    collector.add(
      "missing-robots",
      "technicalDiscoverability",
      "medium",
      "robots.txt was not found",
      "Robots directives help crawlers understand access policy.",
      ["Publish a clear robots.txt and include a Sitemap directive."]
    );
  }

  if (crawl.assets.sitemapXml.found) {
    score += 15;
    evidence.push("sitemap.xml found.");
  } else {
    collector.add(
      "missing-sitemap",
      "technicalDiscoverability",
      "high",
      "sitemap.xml was not found",
      "Sitemaps help AI and search crawlers discover canonical pages.",
      ["Publish an XML sitemap with canonical URLs for important pages."]
    );
  }

  if (crawl.assets.llmsTxt.found) {
    score += 12;
    evidence.push("llms.txt found.");
  } else {
    collector.add(
      "missing-llms-txt",
      "technicalDiscoverability",
      "low",
      "llms.txt was not found",
      "llms.txt is an emerging convention for AI-readable site guidance.",
      ["Add /llms.txt with concise site, product, documentation, and contact guidance."]
    );
  }

  const successfulPages = crawl.pages.filter((page) => page.statusCode >= 200 && page.statusCode < 300);
  score += ratio(successfulPages.length, crawl.pages.length) * 12;
  evidence.push(`${successfulPages.length} of ${crawl.pages.length} crawled pages returned 2xx status.`);

  score += coverageScore(
    crawl,
    (page) => Boolean(page.canonical),
    12,
    evidence,
    collector,
    "low-canonical-coverage",
    "Canonical URL coverage is low",
    "Canonical links reduce ambiguity when AI crawlers consolidate pages.",
    "Add canonical links to important indexable pages."
  );

  score += coverageScore(
    crawl,
    (page) => Boolean(page.metaDescription),
    12,
    evidence,
    collector,
    "low-meta-description-coverage",
    "Meta description coverage is low",
    "Meta descriptions give AI systems concise page summaries.",
    "Add direct, non-duplicative meta descriptions to important pages."
  );

  score += coverageScore(
    crawl,
    (page) => Object.keys(page.openGraph).length > 0,
    12,
    evidence,
    collector,
    "low-open-graph-coverage",
    "Open Graph coverage is low",
    "Open Graph metadata reinforces shareable title, description, and image context.",
    "Add og:title, og:description, og:url, and og:image to public pages."
  );

  score += coverageScore(
    crawl,
    (page) => page.schemaJsonLd.length > 0,
    13,
    evidence,
    collector,
    "low-jsonld-coverage",
    "JSON-LD coverage is low",
    "JSON-LD provides explicit facts that are easier for machines to parse.",
    "Add JSON-LD to the homepage and high-value informational pages."
  );

  return collector.result(score, evidence);
}

export function analyzeStructuredData(crawl: CrawlResult): AnalyzerResult {
  const collector = createCollector();
  const schemaTypes = getSchemaTypes(crawl.pages);
  const evidence: string[] = [];
  let score = 10;
  const expectedTypes = [
    "Organization",
    "LocalBusiness",
    "Product",
    "Service",
    "FAQPage",
    "BreadcrumbList",
    "Article",
    "Course",
    "EducationalOrganization"
  ];
  const foundExpectedTypes = expectedTypes.filter((type) => schemaTypes.includes(type));

  score += Math.min(foundExpectedTypes.length * 12, 60);
  if (foundExpectedTypes.length > 0) {
    evidence.push(`Schema types found: ${foundExpectedTypes.join(", ")}`);
  } else {
    collector.add(
      "no-key-schema-types",
      "structuredData",
      "high",
      "No key schema.org types were detected",
      "Structured data gives AI systems explicit facts about the site entity and content.",
      ["Add relevant JSON-LD such as Organization, Service, Product, FAQPage, or Article."]
    );
  }

  const schemaPageCoverage = ratio(
    crawl.pages.filter((page) => page.schemaJsonLd.length > 0).length,
    crawl.pages.length
  );
  score += schemaPageCoverage * 25;
  evidence.push(`${Math.round(schemaPageCoverage * 100)}% of crawled pages include JSON-LD.`);

  if (!schemaTypes.some((type) => ["Organization", "LocalBusiness"].includes(type))) {
    collector.add(
      "missing-entity-schema",
      "structuredData",
      "high",
      "Entity schema is missing",
      "Organization or LocalBusiness schema is the strongest machine-readable entity anchor.",
      ["Add Organization or LocalBusiness schema to the homepage."]
    );
  }

  if (!schemaTypes.includes("FAQPage")) {
    collector.add(
      "missing-faq-schema",
      "structuredData",
      "medium",
      "FAQPage schema was not detected",
      "FAQPage schema helps expose direct questions and answers for AI retrieval.",
      ["Add FAQPage JSON-LD to pages that already contain real user questions and answers."]
    );
  }

  return collector.result(score, evidence);
}

export function analyzeContent(crawl: CrawlResult): AnalyzerResult {
  const collector = createCollector();
  const evidence: string[] = [];
  let score = 15;

  const h1Coverage = ratio(crawl.pages.filter((page) => page.h1.length > 0).length, crawl.pages.length);
  score += h1Coverage * 15;
  evidence.push(`${Math.round(h1Coverage * 100)}% of pages include an H1.`);

  const h2Coverage = ratio(crawl.pages.filter((page) => page.h2.length > 0).length, crawl.pages.length);
  score += h2Coverage * 15;
  evidence.push(`${Math.round(h2Coverage * 100)}% of pages include H2 sections.`);

  const readablePages = crawl.pages.filter((page) => page.visibleText.length >= 800).length;
  const readableCoverage = ratio(readablePages, crawl.pages.length);
  score += readableCoverage * 18;
  evidence.push(`${readablePages} pages have at least 800 visible text characters.`);

  const faqFound = crawl.pages.some(
    (page) =>
      /faq|frequently asked questions|common questions/i.test(page.url) ||
      /frequently asked questions|common questions|\bfaq\b/i.test(page.visibleText)
  );
  if (faqFound) {
    score += 14;
    evidence.push("FAQ-like content discovered.");
  } else {
    collector.add(
      "no-faq-content",
      "contentChunkability",
      "medium",
      "FAQ or Q&A content was not detected",
      "LLM retrieval benefits from direct question-answer blocks.",
      ["Add a real FAQ section covering audience, services, pricing, process, and eligibility."]
    );
  }

  const definitionPages = crawl.pages.filter((page) =>
    /\b(is an?|are|refers to|means|helps|provides)\b/i.test(page.visibleText)
  ).length;
  const definitionCoverage = ratio(definitionPages, crawl.pages.length);
  score += definitionCoverage * 13;
  evidence.push(`${definitionPages} pages include definition-style explanatory paragraphs.`);

  const textPoorPages = crawl.pages.filter((page) => page.visibleText.length < 400);
  if (textPoorPages.length > 0) {
    collector.add(
      "text-poor-pages",
      "contentChunkability",
      "medium",
      "Some pages appear text-poor",
      "Highly visual pages with little text are harder for AI systems to summarize and cite.",
      [
        "Add concise explanatory copy, headings, and answer-ready paragraphs to thin pages.",
        ...textPoorPages.slice(0, 3).map((page) => page.url)
      ]
    );
  }

  const imageHeavyPages = crawl.pages.filter(
    (page) => page.imageCount >= 8 && page.visibleText.length / Math.max(page.imageCount, 1) < 220
  );
  if (imageHeavyPages.length > 0) {
    collector.add(
      "image-heavy-pages",
      "contentChunkability",
      "low",
      "Some pages may rely heavily on visuals",
      "LLMs can miss information that is only available in images or decorative cards.",
      [
        "Pair important visuals with crawlable text, captions, and structured explanations.",
        ...imageHeavyPages.slice(0, 3).map((page) => page.url)
      ]
    );
  } else {
    score += 10;
    evidence.push("No severe text-to-visual ratio warning detected.");
  }

  return collector.result(score, evidence);
}

export function analyzeCitationReadiness(crawl: CrawlResult): AnalyzerResult {
  const collector = createCollector();
  const evidence: string[] = [];
  const allText = getAllVisibleText(crawl.pages);
  let score = 15;

  const authorSignals = /last updated|updated on|reviewed by|author|written by|editorial/i.test(allText);
  if (authorSignals) {
    score += 18;
    evidence.push("Author, reviewer, or last-updated signals found.");
  } else {
    collector.add(
      "missing-freshness-signals",
      "citationReadiness",
      "medium",
      "Author, reviewer, or last-updated signals are weak",
      "AI answer engines prefer content with attribution and freshness markers for factual claims.",
      ["Add author/reviewer names and last-updated dates to important informational pages."]
    );
  }

  const pagesWithExternalLinks = crawl.pages.filter((page) => page.externalLinks.length > 0).length;
  const externalCoverage = ratio(pagesWithExternalLinks, crawl.pages.length);
  score += externalCoverage * 18;
  evidence.push(`${pagesWithExternalLinks} pages include external references.`);

  if (/\b(20\d{2}|19\d{2}|\d+%|\d+\+|\d{2,})\b/.test(allText)) {
    score += 14;
    evidence.push("Clear factual claim patterns detected.");
  } else {
    collector.add(
      "weak-factual-claims",
      "citationReadiness",
      "low",
      "Clear factual claims are limited",
      "Citation-ready pages usually make specific, verifiable claims.",
      ["Add factual statements with dates, numbers, qualifications, and supporting context."]
    );
  }

  if (hasLikelyPage(crawl.pages, ["about", "contact"])) {
    score += 15;
    evidence.push("About/contact trust pages are available.");
  } else {
    collector.add(
      "missing-trust-pages",
      "citationReadiness",
      "medium",
      "Trust pages are hard to discover",
      "About and contact pages help readers and LLMs verify the site operator.",
      ["Add or expose About and Contact pages in navigation and sitemap."]
    );
  }

  if (hasLikelyPage(crawl.pages, ["case", "research", "evidence", "resources", "blog"])) {
    score += 12;
    evidence.push("Evidence or resource pages discovered.");
  } else {
    collector.add(
      "missing-evidence-pages",
      "citationReadiness",
      "low",
      "Evidence pages were not discovered",
      "Dedicated resources or case pages make factual claims easier to verify and cite.",
      ["Create resource, case study, research, or documentation pages for important claims."]
    );
  }

  if (/award|certified|license|licensed|review|testimonial|case study|customer|registration/i.test(allText)) {
    score += 13;
    evidence.push("Trust signals detected in visible content.");
  }

  return collector.result(score, evidence);
}

function analyzePromptSimulation(): AnalyzerResult {
  return {
    score: 50,
    issues: [
      {
        id: "prompt-simulation-not-run",
        category: "promptSimulation",
        severity: "low",
        title: "Prompt simulation was not run",
        description:
          "No provider API key was used in this MVP scan, so LLM answer consistency was not measured.",
        evidence: [
          "Configure a BYOK provider adapter in a later phase to compare LLM answers against crawl evidence."
        ]
      }
    ],
    recommendations: [
      {
        id: "fix-prompt-simulation-not-run",
        category: "promptSimulation",
        priority: "low",
        title: "Add BYOK prompt simulation",
        description:
          "Configure provider adapters to compare LLM interpretation against crawl evidence."
      }
    ],
    evidence: ["Provider adapters are scaffolded, but no API-backed prompt simulation ran."]
  };
}

function createCollector() {
  const issues: VisibilityIssue[] = [];
  const recommendations: RecommendedFix[] = [];

  return {
    add(
      id: string,
      category: ScoreCategory,
      severity: VisibilityIssue["severity"],
      title: string,
      description: string,
      fixEvidence: string[]
    ): void {
      issues.push({
        id,
        category,
        severity,
        title,
        description,
        evidence: fixEvidence
      });
      recommendations.push({
        id: `fix-${id}`,
        category,
        priority: severity,
        title: recommendationTitle(title),
        description: fixEvidence[0] ?? description
      });
    },
    result(score: number, evidence: string[]): AnalyzerResult {
      return {
        score: clampScore(score),
        issues,
        recommendations,
        evidence
      };
    }
  };
}

function coverageScore(
  crawl: CrawlResult,
  predicate: (page: PageData) => boolean,
  maxScore: number,
  evidence: string[],
  collector: ReturnType<typeof createCollector>,
  issueId: string,
  title: string,
  description: string,
  fix: string
): number {
  const coverage = ratio(crawl.pages.filter(predicate).length, crawl.pages.length);
  evidence.push(`${Math.round(coverage * 100)}% coverage for ${title.toLowerCase()}.`);
  if (coverage < 0.6) {
    collector.add(issueId, "technicalDiscoverability", "medium", title, description, [fix]);
  }
  return coverage * maxScore;
}

function detail(result: AnalyzerResult, weight: number): ScoreDetail {
  return {
    score: result.score,
    weight,
    evidence: result.evidence
  };
}

function getHomepage(crawl: CrawlResult): PageData | undefined {
  return crawl.pages.find(
    (page) => stripTrailingSlash(page.url) === stripTrailingSlash(crawl.normalizedUrl)
  );
}

function getAllVisibleText(pages: PageData[]): string {
  return pages.map((page) => page.visibleText).join(" ");
}

function getSchemaTypes(pages: PageData[]): string[] {
  const types = new Set<string>();
  for (const page of pages) {
    for (const schema of page.schemaJsonLd) {
      collectSchemaTypes(schema, types);
    }
  }
  return [...types];
}

function collectSchemaTypes(value: JsonValue, types: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item, types);
    return;
  }
  if (value && typeof value === "object") {
    const typeValue = value["@type"];
    if (typeof typeValue === "string") types.add(typeValue);
    if (Array.isArray(typeValue)) {
      for (const item of typeValue) {
        if (typeof item === "string") types.add(item);
      }
    }
    for (const child of Object.values(value)) collectSchemaTypes(child, types);
  }
}

function hasLikelyPage(pages: PageData[], needles: string[]): boolean {
  return pages.some((page) => needles.some((needle) => page.url.toLowerCase().includes(needle)));
}

function hasContactSignal(pages: PageData[]): boolean {
  return (
    hasLikelyPage(pages, ["contact"]) ||
    pages.some((page) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d/i.test(page.visibleText))
  );
}

function containsAny(text: string, needles: string[]): boolean {
  const lowerText = text.toLowerCase();
  return needles.some((needle) => lowerText.includes(needle));
}

function recommendationTitle(title: string): string {
  return title
    .replace(/^Homepage /, "")
    .replace(/^(Missing|No|Some|Clear|Trust|Entity)/, "Improve")
    .replace(/\s+/g, " ")
    .trim();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ratio(part: number, total: number): number {
  if (total <= 0) return 0;
  return part / total;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function sortIssues(issues: VisibilityIssue[]): VisibilityIssue[] {
  const rank: Record<VisibilityIssue["severity"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  };
  return [...issues].sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function sortRecommendations(recommendations: RecommendedFix[]): RecommendedFix[] {
  const rank: Record<RecommendedFix["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  };
  return [...recommendations].sort((a, b) => rank[a.priority] - rank[b.priority]);
}
