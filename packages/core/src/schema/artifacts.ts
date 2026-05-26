export type OpenVisiArtifactType =
  | "config"
  | "prompt-pack"
  | "scan-plan"
  | "crawled-pages"
  | "crawler-summary"
  | "structure-trust-inputs"
  | "warnings"
  | "report-reference"
  | "answer-signal-inputs"
  | "measurement-inputs"
  | "metrics-draft"
  | "metrics-review"
  | "metrics-finalization"
  | "debug-report"
  | "metrics"
  | "answers"
  | "citations"
  | "report"
  | "unknown";

export type ArtifactBundleStage =
  | "dry-run"
  | "static-crawl"
  | "evaluation"
  | "measurement-inputs"
  | "metrics-draft"
  | "metrics-review"
  | "metrics-finalization"
  | "debug-report"
  | "full-scan"
  | "report"
  | "unknown";
export type ArtifactValidationSeverity = "error" | "warning";

export interface OpenVisiArtifact {
  id: string;
  type: OpenVisiArtifactType;
  path: string;
  description: string;
  generated: boolean;
  requiredFor: string[];
  stage: string;
}

export interface OpenVisiArtifactManifest {
  schemaVersion: "0.1";
  project: "OpenVisi";
  generatedAt: string;
  stage: ArtifactBundleStage;
  artifacts: OpenVisiArtifact[];
  warnings: string[];
}

export interface ReportReference {
  section: string;
  artifactId: string;
  path: string;
  description: string;
}

export interface ReportReferencesFile {
  schemaVersion: "0.1";
  generatedAt: string;
  references: ReportReference[];
}

export interface ArtifactValidationIssue {
  severity: ArtifactValidationSeverity;
  message: string;
  artifactId?: string;
  path?: string;
}

export interface ArtifactBundleValidationResult {
  valid: boolean;
  issues: ArtifactValidationIssue[];
}

export const artifactTypeDefinitions: Record<OpenVisiArtifactType, { description: string }> = {
  config: { description: "OpenVisi configuration artifact." },
  "prompt-pack": { description: "Prompt pack artifact." },
  "scan-plan": { description: "Dry-run scan plan artifact." },
  "crawled-pages": { description: "Canonical CrawledPageSnapshot[] artifact." },
  "crawler-summary": { description: "Aggregate crawler diagnostics artifact." },
  "structure-trust-inputs": {
    description: "Crawler-derived AI-readable Structure and Machine-readable Trust input artifact."
  },
  warnings: { description: "Command warnings artifact." },
  "report-reference": { description: "Report reference mapping artifact." },
  "answer-signal-inputs": {
    description: "Evaluator-derived answer and citation signal input artifact."
  },
  "measurement-inputs": {
    description: "Composed measurement input bundle for future metrics composition."
  },
  "metrics-draft": {
    description: "Explainable draft metrics artifact derived from measurement inputs."
  },
  "metrics-review": {
    description: "Review gate artifact for draft metrics finalization readiness."
  },
  "metrics-finalization": {
    description: "Finalization guard artifact for future metrics generation permission."
  },
  "debug-report": {
    description: "Human-readable artifact pipeline debug report."
  },
  metrics: { description: "Computed metrics artifact." },
  answers: { description: "LLM answer artifact." },
  citations: { description: "Citation artifact." },
  report: { description: "Generated report artifact." },
  unknown: { description: "Unknown or extension artifact." }
};

export const requiredArtifactsByStage = {
  "dry-run": ["scan-plan", "prompt-pack", "config.normalized", "warnings", "artifact-manifest"],
  "static-crawl": [
    "crawled-pages",
    "crawler-summary",
    "structure-trust-inputs",
    "warnings",
    "artifact-manifest",
    "report-references"
  ],
  evaluation: [
    "config.normalized",
    "prompt-pack",
    "answers",
    "answer-signal-inputs",
    "warnings",
    "artifact-manifest"
  ],
  "measurement-inputs": ["measurement-inputs", "warnings", "artifact-manifest"],
  "metrics-draft": ["metrics-draft", "warnings", "artifact-manifest"],
  "metrics-review": ["metrics-review", "warnings", "artifact-manifest"],
  "metrics-finalization": ["metrics-finalization", "warnings", "artifact-manifest"],
  "debug-report": ["debug-report", "warnings", "artifact-manifest"],
  "full-scan": ["scan-result", "metrics", "answers", "crawled-pages", "artifact-manifest"],
  report: ["report", "artifact-manifest"],
  unknown: []
} as const satisfies Record<ArtifactBundleStage, readonly string[]>;

export function createArtifactManifest(input: {
  generatedAt: string;
  stage: ArtifactBundleStage;
  artifacts: OpenVisiArtifact[];
  warnings?: string[];
}): OpenVisiArtifactManifest {
  return {
    schemaVersion: "0.1",
    project: "OpenVisi",
    generatedAt: input.generatedAt,
    stage: input.stage,
    artifacts: input.artifacts,
    warnings: input.warnings ?? []
  };
}

export function createCrawlReportReferences(input: { generatedAt: string }): ReportReferencesFile {
  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt,
    references: [
      {
        section: "AI-readable Structure",
        artifactId: "structure-trust-inputs",
        path: "structure-trust-inputs.json",
        description:
          "Crawler-derived input signals for AI-readable Structure diagnostics."
      },
      {
        section: "Machine-readable Trust",
        artifactId: "structure-trust-inputs",
        path: "structure-trust-inputs.json",
        description:
          "Crawler-derived input signals for Machine-readable Trust diagnostics."
      },
      {
        section: "AI Citation Signals",
        artifactId: "structure-trust-inputs",
        path: "structure-trust-inputs.json",
        description:
          "Crawler-derived source structure inputs for future AI Citation Signals analysis."
      },
      {
        section: "Source Gaps",
        artifactId: "structure-trust-inputs",
        path: "structure-trust-inputs.json",
        description:
          "Crawler-derived source gap candidates for downstream diagnostic interpretation."
      },
      {
        section: "Raw Crawled Pages",
        artifactId: "crawled-pages",
        path: "crawled-pages.json",
        description: "Canonical CrawledPageSnapshot[] used as source evidence."
      },
      {
        section: "Crawler Summary",
        artifactId: "crawler-summary",
        path: "crawler-summary.json",
        description: "Aggregated crawler diagnostics used as source evidence."
      }
    ]
  };
}

export function validateArtifactManifestShape(manifest: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(manifest)) return ["artifact manifest must be an object."];

  validateLiteral(manifest.schemaVersion, "0.1", "schemaVersion", errors);
  validateLiteral(manifest.project, "OpenVisi", "project", errors);
  validateIsoString(manifest.generatedAt, "generatedAt", errors);
  validateStage(manifest.stage, "stage", errors);

  if (!Array.isArray(manifest.artifacts)) {
    errors.push("artifacts must be an array.");
  } else {
    for (const [index, artifact] of manifest.artifacts.entries()) {
      validateArtifactShape(artifact, `artifacts[${index}]`, errors);
    }
  }

  if (!Array.isArray(manifest.warnings)) {
    errors.push("warnings must be an array.");
  } else if (!manifest.warnings.every((warning) => typeof warning === "string")) {
    errors.push("warnings must contain only strings.");
  }

  return errors;
}

export function validateReportReferencesShape(references: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(references)) return ["report references must be an object."];

  validateLiteral(references.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(references.generatedAt, "generatedAt", errors);

  if (!Array.isArray(references.references)) {
    errors.push("references must be an array.");
  } else {
    for (const [index, reference] of references.references.entries()) {
      validateReferenceShape(reference, `references[${index}]`, errors);
    }
  }

  return errors;
}

export function validateArtifactBundleReferences(input: {
  manifest: OpenVisiArtifactManifest;
  existingArtifactPaths: string[];
  expectedStage?: ArtifactBundleStage;
  reportReferences?: ReportReferencesFile | null;
  requireReportReferences?: boolean;
}): ArtifactBundleValidationResult {
  const issues: ArtifactValidationIssue[] = [];
  const existing = new Set(input.existingArtifactPaths);

  if (input.expectedStage && input.manifest.stage !== input.expectedStage) {
    issues.push({
      severity: "error",
      message: `Expected artifact bundle stage ${input.expectedStage}, received ${input.manifest.stage}.`
    });
  }

  for (const artifact of input.manifest.artifacts) {
    if (!existing.has(artifact.path)) {
      issues.push({
        severity: "error",
        message: `Missing artifact file: ${artifact.path}`,
        artifactId: artifact.id,
        path: artifact.path
      });
    }
  }

  const artifactIds = new Set(input.manifest.artifacts.map((artifact) => artifact.id));
  for (const requiredId of requiredArtifactsByStage[input.manifest.stage]) {
    if (!artifactIds.has(requiredId)) {
      issues.push({
        severity: "error",
        message: `Missing required artifact id for ${input.manifest.stage}: ${requiredId}`,
        artifactId: requiredId
      });
    }
  }

  if (input.requireReportReferences && !input.reportReferences) {
    issues.push({
      severity: "error",
      message: "report-references.json is required but was not found.",
      path: "report-references.json"
    });
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues
  };
}

function validateArtifactShape(value: unknown, prefix: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  validateString(value.id, `${prefix}.id`, errors);
  validateArtifactType(value.type, `${prefix}.type`, errors);
  validateRelativePath(value.path, `${prefix}.path`, errors);
  validateString(value.description, `${prefix}.description`, errors);

  if (typeof value.generated !== "boolean") {
    errors.push(`${prefix}.generated must be a boolean.`);
  }

  if (!Array.isArray(value.requiredFor)) {
    errors.push(`${prefix}.requiredFor must be an array.`);
  } else if (!value.requiredFor.every((item) => typeof item === "string")) {
    errors.push(`${prefix}.requiredFor must contain only strings.`);
  }

  validateString(value.stage, `${prefix}.stage`, errors);
}

function validateReferenceShape(value: unknown, prefix: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  validateString(value.section, `${prefix}.section`, errors);
  validateString(value.artifactId, `${prefix}.artifactId`, errors);
  validateRelativePath(value.path, `${prefix}.path`, errors);
  validateString(value.description, `${prefix}.description`, errors);
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

function validateStage(value: unknown, fieldName: string, errors: string[]): void {
  if (
    value !== "dry-run" &&
    value !== "static-crawl" &&
    value !== "evaluation" &&
    value !== "measurement-inputs" &&
    value !== "metrics-draft" &&
    value !== "metrics-review" &&
    value !== "metrics-finalization" &&
    value !== "debug-report" &&
    value !== "full-scan" &&
    value !== "report" &&
    value !== "unknown"
  ) {
    errors.push(`${fieldName} must be a known artifact bundle stage.`);
  }
}

function validateArtifactType(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || !(value in artifactTypeDefinitions)) {
    errors.push(`${fieldName} must be a known artifact type.`);
  }
}

function validateString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} must be a non-empty string.`);
  }
}

function validateRelativePath(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} must be a non-empty relative path.`);
    return;
  }

  if (isAbsolutePath(value)) {
    errors.push(`${fieldName} must be relative, not absolute.`);
  }
}

function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
