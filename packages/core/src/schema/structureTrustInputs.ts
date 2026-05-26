export type SourceGapType =
  | "missing_json_ld"
  | "missing_organization_schema"
  | "missing_product_schema"
  | "missing_faq_schema"
  | "missing_author_metadata"
  | "missing_last_modified_metadata"
  | "missing_canonical"
  | "unclear_h1_structure"
  | "thin_content"
  | "missing_docs_structure"
  | "missing_faq_section"
  | "missing_comparison_content";

export type SourceGapSeverity = "low" | "medium" | "high";

export interface StructureTrustSourceArtifacts {
  crawledPages: "crawled-pages.json";
  crawlerSummary: "crawler-summary.json";
}

export interface AiReadableStructureSignals {
  pagesWithClearH1: number;
  pagesWithDocsLikeStructure: number;
  pagesWithFAQSection: number;
  pagesWithComparisonSignals: number;
  averageContentDepthEstimate: number;
}

export interface MachineReadableTrustSignals {
  pagesWithJsonLd: number;
  pagesWithOrganizationSchema: number;
  pagesWithProductSchema: number;
  pagesWithFAQSchema: number;
  pagesWithAuthorMetadata: number;
  pagesWithLastModifiedMetadata: number;
  pagesWithCanonical: number;
  httpsPages: number;
}

export interface AiCitationSignalInputs {
  hasOfficialStructuredData: boolean;
  hasDocumentationLikeSources: boolean;
  hasFAQLikeSources: boolean;
  hasComparisonLikeSources: boolean;
  preferredSourceDomains: string[];
}

export interface SourceGapCandidate {
  id: string;
  type: SourceGapType;
  severity: SourceGapSeverity;
  description: string;
  evidence: string[];
}

export interface StructureTrustInputBundle {
  schemaVersion: "0.1";
  generatedAt: string;
  sourceArtifacts: StructureTrustSourceArtifacts;
  pageCount: number;
  aiReadableStructureSignals: AiReadableStructureSignals;
  machineReadableTrustSignals: MachineReadableTrustSignals;
  aiCitationSignalInputs: AiCitationSignalInputs;
  sourceGapCandidates: SourceGapCandidate[];
  limitations: string[];
}

const sourceGapTypes: SourceGapType[] = [
  "missing_json_ld",
  "missing_organization_schema",
  "missing_product_schema",
  "missing_faq_schema",
  "missing_author_metadata",
  "missing_last_modified_metadata",
  "missing_canonical",
  "unclear_h1_structure",
  "thin_content",
  "missing_docs_structure",
  "missing_faq_section",
  "missing_comparison_content"
];

const sourceGapSeverities: SourceGapSeverity[] = ["low", "medium", "high"];

export function validateStructureTrustInputBundleShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["structure trust input bundle must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("structure trust input bundle must not include aiVisibilityScore.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateSourceArtifacts(input.sourceArtifacts, errors);
  validateNumber(input.pageCount, "pageCount", errors);
  validateAiReadableStructureSignals(input.aiReadableStructureSignals, errors);
  validateMachineReadableTrustSignals(input.machineReadableTrustSignals, errors);
  validateAiCitationSignalInputs(input.aiCitationSignalInputs, errors);
  validateSourceGapCandidates(input.sourceGapCandidates, errors);

  if (!Array.isArray(input.limitations)) {
    errors.push("limitations must be an array.");
  } else if (!input.limitations.every((item) => typeof item === "string")) {
    errors.push("limitations must contain only strings.");
  }

  return errors;
}

function validateSourceArtifacts(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("sourceArtifacts must be an object.");
    return;
  }

  validateLiteral(value.crawledPages, "crawled-pages.json", "sourceArtifacts.crawledPages", errors);
  validateLiteral(
    value.crawlerSummary,
    "crawler-summary.json",
    "sourceArtifacts.crawlerSummary",
    errors
  );
}

function validateAiReadableStructureSignals(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("aiReadableStructureSignals must be an object.");
    return;
  }

  for (const key of [
    "pagesWithClearH1",
    "pagesWithDocsLikeStructure",
    "pagesWithFAQSection",
    "pagesWithComparisonSignals",
    "averageContentDepthEstimate"
  ]) {
    validateNumber(value[key], `aiReadableStructureSignals.${key}`, errors);
  }
}

function validateMachineReadableTrustSignals(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("machineReadableTrustSignals must be an object.");
    return;
  }

  for (const key of [
    "pagesWithJsonLd",
    "pagesWithOrganizationSchema",
    "pagesWithProductSchema",
    "pagesWithFAQSchema",
    "pagesWithAuthorMetadata",
    "pagesWithLastModifiedMetadata",
    "pagesWithCanonical",
    "httpsPages"
  ]) {
    validateNumber(value[key], `machineReadableTrustSignals.${key}`, errors);
  }
}

function validateAiCitationSignalInputs(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("aiCitationSignalInputs must be an object.");
    return;
  }

  for (const key of [
    "hasOfficialStructuredData",
    "hasDocumentationLikeSources",
    "hasFAQLikeSources",
    "hasComparisonLikeSources"
  ]) {
    if (typeof value[key] !== "boolean") {
      errors.push(`aiCitationSignalInputs.${key} must be a boolean.`);
    }
  }

  if (!Array.isArray(value.preferredSourceDomains)) {
    errors.push("aiCitationSignalInputs.preferredSourceDomains must be an array.");
  } else if (!value.preferredSourceDomains.every((item) => typeof item === "string")) {
    errors.push("aiCitationSignalInputs.preferredSourceDomains must contain only strings.");
  }
}

function validateSourceGapCandidates(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("sourceGapCandidates must be an array.");
    return;
  }

  for (const [index, candidate] of value.entries()) {
    if (!isRecord(candidate)) {
      errors.push(`sourceGapCandidates[${index}] must be an object.`);
      continue;
    }

    validateString(candidate.id, `sourceGapCandidates[${index}].id`, errors);
    if (!sourceGapTypes.includes(candidate.type as SourceGapType)) {
      errors.push(`sourceGapCandidates[${index}].type must be a known source gap type.`);
    }
    if (!sourceGapSeverities.includes(candidate.severity as SourceGapSeverity)) {
      errors.push(`sourceGapCandidates[${index}].severity must be low, medium, or high.`);
    }
    validateString(candidate.description, `sourceGapCandidates[${index}].description`, errors);
    if (!Array.isArray(candidate.evidence)) {
      errors.push(`sourceGapCandidates[${index}].evidence must be an array.`);
    } else if (!candidate.evidence.every((item) => typeof item === "string")) {
      errors.push(`sourceGapCandidates[${index}].evidence must contain only strings.`);
    }
  }
}

function validateLiteral(
  value: unknown,
  expected: string,
  fieldName: string,
  errors: string[]
): void {
  if (value !== expected) {
    errors.push(`${fieldName} must be "${expected}".`);
  }
}

function validateIsoString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    errors.push(`${fieldName} must be an ISO date string.`);
  }
}

function validateNumber(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push(`${fieldName} must be a non-negative number.`);
  }
}

function validateString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} must be a non-empty string.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
