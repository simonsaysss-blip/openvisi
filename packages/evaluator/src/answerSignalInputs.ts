import type {
  AnswerSignalInputBundle,
  AnswersArtifact,
  Citation,
  LLMAnswer,
  OpenVisiScanConfig
} from "@openvisi/core";

export interface CreateAnswerSignalInputBundleInput {
  answersArtifact: AnswersArtifact;
  config: OpenVisiScanConfig;
  generatedAt?: string;
}

export function createAnswerSignalInputBundle(
  input: CreateAnswerSignalInputBundleInput
): AnswerSignalInputBundle {
  const answers = input.answersArtifact.answers;
  const targetBrandTerms = [input.config.brandName];
  const categoryTerms = tokenize(input.config.category);
  const domainTerms = tokenize(input.config.domain.replace(/\.[^.]+$/, ""));
  const audienceTerms = collectAudienceTerms(input.config);
  const competitorTerms = input.config.competitors.map((competitor) => ({
    name: competitor.name,
    terms: [competitor.name, ...(competitor.aliases ?? [])]
  }));
  const promptResults = answers.map((answer) =>
    createPromptResult(answer, {
      targetBrandTerms,
      targetDomain: input.config.domain,
      competitorTerms
    })
  );
  const competitorMentionCounts = Object.fromEntries(
    competitorTerms.map((competitor) => [
      competitor.name,
      answers.filter((answer) => includesAnyTerm(answer.answerText, competitor.terms)).length
    ])
  );
  const targetBrandMentionCounts = answers.map((answer) =>
    countTermMentions(answer.answerText, targetBrandTerms)
  );
  const targetDomainCitationCounts = answers.map((answer) =>
    answer.citations.filter((citation) => citationTargetsDomain(citation, input.config.domain)).length
  );
  const answersMarkedAsMock = answers.filter((answer) => isMockAnswer(answer)).length;

  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceArtifacts: {
      answers: "answers.json",
      promptPack: "prompt-pack.json",
      config: "config.normalized.json"
    },
    provider: input.answersArtifact.provider,
    model: input.answersArtifact.model,
    answerCount: answers.length,
    answerPresenceSignals: {
      targetBrandMentions: targetBrandMentionCounts.reduce((sum, count) => sum + count, 0),
      answersWithTargetBrand: promptResults.filter((result) => result.targetBrandMentioned).length,
      answersWithoutTargetBrand: promptResults.filter((result) => !result.targetBrandMentioned).length
    },
    entityClaritySignals: {
      answersWithCategoryTerms: countAnswersWithTerms(answers, categoryTerms),
      answersWithDomainTerms: countAnswersWithTerms(answers, domainTerms),
      answersWithAudienceTerms: countAnswersWithTerms(answers, audienceTerms),
      possibleAmbiguityCount: 0
    },
    citationCoverageSignals: {
      answersWithCitations: answers.filter((answer) => answer.citations.length > 0).length,
      answersWithTargetDomainCitation: targetDomainCitationCounts.filter((count) => count > 0).length,
      totalCitationCount: answers.reduce((sum, answer) => sum + answer.citations.length, 0),
      targetDomainCitationCount: targetDomainCitationCounts.reduce((sum, count) => sum + count, 0)
    },
    competitorDisplacementSignals: {
      answersMentioningCompetitors: promptResults.filter(
        (result) => result.competitorsMentioned.length > 0
      ).length,
      answersMentioningCompetitorsWithoutTargetBrand: promptResults.filter(
        (result) => result.competitorsMentioned.length > 0 && !result.targetBrandMentioned
      ).length,
      competitorMentionCounts
    },
    narrativeAccuracySignals: {
      answersWithUnsupportedClaims: 0,
      answersMarkedAsMock,
      requiresHumanReview: true
    },
    promptResults,
    limitations: [
      "Derived from evaluator answer artifacts only.",
      "Does not compute final AI Visibility metrics.",
      ...(answersMarkedAsMock > 0 ? ["Mock answers are not real LLM outputs."] : [])
    ]
  };
}

function createPromptResult(
  answer: LLMAnswer,
  input: {
    targetBrandTerms: string[];
    targetDomain: string;
    competitorTerms: Array<{ name: string; terms: string[] }>;
  }
): AnswerSignalInputBundle["promptResults"][number] {
  const competitorsMentioned = input.competitorTerms
    .filter((competitor) => includesAnyTerm(answer.answerText, competitor.terms))
    .map((competitor) => competitor.name);

  return {
    promptId: answer.promptId,
    targetBrandMentioned: includesAnyTerm(answer.answerText, input.targetBrandTerms),
    competitorsMentioned,
    citationCount: answer.citations.length,
    targetDomainCited: answer.citations.some((citation) =>
      citationTargetsDomain(citation, input.targetDomain)
    ),
    mockAnswer: isMockAnswer(answer)
  };
}

function collectAudienceTerms(config: OpenVisiScanConfig): string[] {
  const promptTerms = config.promptPack.flatMap((prompt) => tokenize(prompt.text));
  const likelyAudienceTerms = ["teams", "buyers", "developers", "maintainers", "b2b", "saas"];
  return [...new Set(promptTerms.filter((term) => likelyAudienceTerms.includes(term)))];
}

function countAnswersWithTerms(answers: LLMAnswer[], terms: string[]): number {
  if (terms.length === 0) return 0;
  return answers.filter((answer) => includesAnyTerm(answer.answerText, terms)).length;
}

function countTermMentions(text: string, terms: string[]): number {
  const normalized = text.toLowerCase();
  return terms.reduce((count, term) => {
    const escaped = escapeRegExp(term.toLowerCase());
    return count + (normalized.match(new RegExp(`\\b${escaped}\\b`, "g"))?.length ?? 0);
  }, 0);
}

function includesAnyTerm(text: string, terms: string[]): boolean {
  return terms.some((term) => countTermMentions(text, [term]) > 0);
}

function citationTargetsDomain(citation: Citation, targetDomain: string): boolean {
  const normalizedTarget = normalizeDomain(targetDomain);
  if (citation.sourceDomain && normalizeDomain(citation.sourceDomain) === normalizedTarget) {
    return true;
  }

  try {
    return normalizeDomain(new URL(citation.url).hostname) === normalizedTarget;
  } catch {
    return false;
  }
}

function isMockAnswer(answer: LLMAnswer): boolean {
  return Boolean(
    answer.raw &&
      typeof answer.raw === "object" &&
      "mock" in answer.raw &&
      (answer.raw as { mock?: unknown }).mock === true
  );
}

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function tokenize(value: string): string[] {
  return [
    ...new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2)
    )
  ];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
