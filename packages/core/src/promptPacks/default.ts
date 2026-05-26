import type { PromptSpec } from "../schema/scan.js";
import type { PromptPackInput } from "./types.js";

export function createDefaultPromptPack(input: PromptPackInput): PromptSpec[] {
  const normalized = normalizeInput(input);
  const prompts: PromptSpec[] = [
    categoryDiscoveryPrompt(
      "category-discovery-best-tools",
      `What are the best ${normalized.category} tools for ${normalized.audience}?`,
      normalized
    ),
    categoryDiscoveryPrompt(
      "category-discovery-recommended-products",
      `Which ${normalized.category} products are most often recommended?`,
      normalized
    ),
    categoryDiscoveryPrompt(
      "category-discovery-shortlist",
      `Which ${normalized.category} tools should be included in an evaluation shortlist?`,
      normalized
    ),
    brandSpecificPrompt(
      "brand-specific-what-does-brand-do",
      `What does ${normalized.brandName} do?`,
      normalized
    ),
    brandSpecificPrompt(
      "brand-specific-who-is-brand-for",
      `Who is ${normalized.brandName} for?`,
      normalized
    ),
    brandSpecificPrompt(
      "brand-specific-when-to-consider-brand",
      `When should a buyer consider ${normalized.brandName}?`,
      normalized
    ),
    alternativeComparisonPrompt(
      "alternative-comparison-brand-alternatives",
      `What are alternatives to ${normalized.brandName}?`,
      normalized,
      normalized.competitorNames
    ),
    buyerIntentPrompt(
      "buyer-intent-evaluation-criteria",
      `What should a buyer consider when evaluating ${normalized.category} tools?`,
      normalized
    ),
    buyerIntentPrompt(
      "buyer-intent-trust-signals",
      `What trust signals should buyers look for in ${normalized.category} tools?`,
      normalized
    ),
    buyerIntentPrompt(
      "buyer-intent-vendor-shortlist",
      `How should ${normalized.audience} build a shortlist of ${normalized.category} tools?`,
      normalized
    )
  ];

  for (const competitorName of normalized.competitorNames.slice(0, 3)) {
    prompts.push(
      alternativeComparisonPrompt(
        `alternative-comparison-${slugify(normalized.brandName)}-vs-${slugify(competitorName)}`,
        `How does ${normalized.brandName} compare to ${competitorName}?`,
        normalized,
        [competitorName]
      )
    );
  }

  for (const problem of normalized.problems.slice(0, 3)) {
    prompts.push(
      problemSolutionPrompt(
        `problem-solution-${slugify(problem)}`,
        `Which ${normalized.category} products are most often recommended for ${problem}?`,
        normalized,
        problem
      )
    );
  }

  for (const integration of normalized.integrations.slice(0, 3)) {
    prompts.push(
      integrationPrompt(
        `integration-${slugify(integration)}`,
        `Which ${normalized.category} tools integrate with ${integration}?`,
        normalized,
        integration
      )
    );
  }

  return prompts.slice(0, 20);
}

interface NormalizedPromptPackInput {
  brandName: string;
  category: string;
  domain: string;
  competitors: PromptPackInput["competitors"];
  competitorNames: string[];
  audience: string;
  problems: string[];
  integrations: string[];
}

function categoryDiscoveryPrompt(
  id: string,
  text: string,
  input: NormalizedPromptPackInput
): PromptSpec {
  return {
    id,
    text,
    intent: "category_discovery",
    category: input.category,
    expectedEntities: expectedEntities(input)
  };
}

function brandSpecificPrompt(
  id: string,
  text: string,
  input: NormalizedPromptPackInput
): PromptSpec {
  return {
    id,
    text,
    intent: "brand_specific",
    category: input.category,
    targetEntity: input.brandName,
    expectedEntities: [input.brandName],
    metadata: {
      domain: input.domain
    }
  };
}

function alternativeComparisonPrompt(
  id: string,
  text: string,
  input: NormalizedPromptPackInput,
  competitorNames: string[]
): PromptSpec {
  return {
    id,
    text,
    intent: "alternative_comparison",
    category: input.category,
    targetEntity: input.brandName,
    expectedEntities: expectedEntities(input, competitorNames)
  };
}

function buyerIntentPrompt(
  id: string,
  text: string,
  input: NormalizedPromptPackInput
): PromptSpec {
  return {
    id,
    text,
    intent: "buyer_intent",
    category: input.category,
    expectedEntities: expectedEntities(input)
  };
}

function problemSolutionPrompt(
  id: string,
  text: string,
  input: NormalizedPromptPackInput,
  problem: string
): PromptSpec {
  return {
    id,
    text,
    intent: "problem_solution",
    category: input.category,
    expectedEntities: expectedEntities(input),
    metadata: {
      problem
    }
  };
}

function integrationPrompt(
  id: string,
  text: string,
  input: NormalizedPromptPackInput,
  integration: string
): PromptSpec {
  return {
    id,
    text,
    intent: "integration",
    category: input.category,
    expectedEntities: expectedEntities(input),
    metadata: {
      integration
    }
  };
}

function normalizeInput(input: PromptPackInput): NormalizedPromptPackInput {
  const brandName = cleanText(input.brandName) || "the target entity";
  const category = cleanText(input.category) || "AI Visibility";
  const domain = cleanText(input.domain);
  const competitors = Array.isArray(input.competitors) ? input.competitors : [];
  const competitorNames = uniqueNonEmpty(competitors.map((competitor) => competitor.name));
  const audience = cleanText(input.audience) || "teams";
  const problems = uniqueNonEmpty(input.problems ?? []);
  const integrations = uniqueNonEmpty(input.integrations ?? []);

  return {
    brandName,
    category,
    domain,
    competitors,
    competitorNames,
    audience,
    problems,
    integrations
  };
}

function expectedEntities(
  input: NormalizedPromptPackInput,
  additionalEntities: string[] = []
): string[] {
  return uniqueNonEmpty([input.brandName, ...additionalEntities, ...input.competitorNames]);
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }

  return result;
}

function cleanText(value: string | undefined): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function slugify(value: string): string {
  return (
    cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}
