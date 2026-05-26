import path from "node:path";
import {
  createArtifactManifest,
  createCrawlReportReferences,
  type OpenVisiArtifact
} from "@openvisi/core";
import { pathExists } from "./output.js";

export { createArtifactManifest, createCrawlReportReferences };
export type {
  ArtifactBundleStage,
  ArtifactBundleValidationResult,
  ArtifactValidationIssue,
  ArtifactValidationSeverity,
  OpenVisiArtifact,
  OpenVisiArtifactManifest,
  OpenVisiArtifactType,
  ReportReference,
  ReportReferencesFile
} from "@openvisi/core";

export async function getExistingArtifacts(outputDir: string): Promise<OpenVisiArtifact[]> {
  const artifacts: OpenVisiArtifact[] = [];

  for (const definition of artifactDefinitions) {
    const filePath = path.join(outputDir, definition.path);
    if (await pathExists(filePath)) {
      artifacts.push({ ...definition, generated: true });
    }
  }

  return artifacts;
}

export function artifactById(id: string): OpenVisiArtifact {
  const artifact = artifactDefinitions.find((definition) => definition.id === id);
  if (!artifact) {
    return {
      id,
      type: "unknown",
      path: `${id}.json`,
      description: "Unknown OpenVisi artifact.",
      generated: false,
      requiredFor: [],
      stage: "unknown"
    };
  }
  return { ...artifact };
}

const artifactDefinitions: OpenVisiArtifact[] = [
  {
    id: "config.normalized",
    type: "config",
    path: "config.normalized.json",
    description: "Normalized OpenVisi scan config.",
    generated: false,
    requiredFor: ["scan", "report"],
    stage: "stage-1c"
  },
  {
    id: "prompt-pack",
    type: "prompt-pack",
    path: "prompt-pack.json",
    description: "PromptSpec[] used to plan AI Visibility answer collection.",
    generated: false,
    requiredFor: ["scan", "evaluator"],
    stage: "stage-1c"
  },
  {
    id: "scan-plan",
    type: "scan-plan",
    path: "scan-plan.json",
    description: "Dry-run scan plan without crawling, metrics, or provider calls.",
    generated: false,
    requiredFor: ["scan"],
    stage: "stage-1c"
  },
  {
    id: "crawled-pages",
    type: "crawled-pages",
    path: "crawled-pages.json",
    description: "Canonical CrawledPageSnapshot[] static crawler artifact.",
    generated: false,
    requiredFor: ["report", "evaluator", "metrics"],
    stage: "stage-2b"
  },
  {
    id: "crawler-summary",
    type: "crawler-summary",
    path: "crawler-summary.json",
    description: "Aggregated static crawler diagnostics summary.",
    generated: false,
    requiredFor: ["report", "metrics"],
    stage: "stage-2b"
  },
  {
    id: "structure-trust-inputs",
    type: "structure-trust-inputs",
    path: "structure-trust-inputs.json",
    description: "Crawler-derived Structure and Trust input artifact for downstream modules.",
    generated: false,
    requiredFor: ["report", "metrics"],
    stage: "stage-2f"
  },
  {
    id: "warnings",
    type: "warnings",
    path: "warnings.json",
    description: "Warnings produced by the current OpenVisi command.",
    generated: false,
    requiredFor: ["scan", "report"],
    stage: "stage-1c"
  },
  {
    id: "report-references",
    type: "report-reference",
    path: "report-references.json",
    description: "Mapping from generated artifacts to future report sections.",
    generated: false,
    requiredFor: ["report"],
    stage: "stage-2c"
  },
  {
    id: "artifact-manifest",
    type: "unknown",
    path: "artifact-manifest.json",
    description: "Manifest of generated OpenVisi artifacts in this output directory.",
    generated: false,
    requiredFor: ["scan", "report", "dashboard"],
    stage: "stage-2c"
  },
  {
    id: "metrics",
    type: "metrics",
    path: "metrics.json",
    description: "Computed AI Visibility metrics.",
    generated: false,
    requiredFor: ["report", "dashboard"],
    stage: "future"
  },
  {
    id: "answers",
    type: "answers",
    path: "answers.json",
    description: "Provider-generated LLMAnswer[] artifact.",
    generated: false,
    requiredFor: ["metrics", "report"],
    stage: "stage-3b"
  },
  {
    id: "answer-signal-inputs",
    type: "answer-signal-inputs",
    path: "answer-signal-inputs.json",
    description: "Evaluator-derived answer and citation signal input artifact.",
    generated: false,
    requiredFor: ["metrics", "report"],
    stage: "stage-3c"
  },
  {
    id: "measurement-inputs",
    type: "measurement-inputs",
    path: "measurement-inputs.json",
    description: "Composed measurement input bundle for future metrics composition.",
    generated: false,
    requiredFor: ["metrics"],
    stage: "stage-3d"
  },
  {
    id: "metrics-draft",
    type: "metrics-draft",
    path: "metrics-draft.json",
    description: "Explainable draft metrics artifact derived from measurement inputs.",
    generated: false,
    requiredFor: ["metrics-review"],
    stage: "stage-4a"
  },
  {
    id: "metrics-review",
    type: "metrics-review",
    path: "metrics-review.json",
    description: "Review gate artifact for draft metrics finalization readiness.",
    generated: false,
    requiredFor: ["metrics"],
    stage: "stage-4b"
  },
  {
    id: "metrics-finalization",
    type: "metrics-finalization",
    path: "metrics-finalization.json",
    description: "Finalization guard artifact for future metrics generation permission.",
    generated: false,
    requiredFor: ["metrics"],
    stage: "stage-4c"
  },
  {
    id: "debug-report",
    type: "debug-report",
    path: "debug-report.md",
    description: "Human-readable artifact pipeline debug report.",
    generated: false,
    requiredFor: ["debugging"],
    stage: "stage-5a"
  },
  {
    id: "citations",
    type: "citations",
    path: "citations.json",
    description: "Provider citation artifacts.",
    generated: false,
    requiredFor: ["metrics", "report"],
    stage: "future"
  },
  {
    id: "markdown-report",
    type: "report",
    path: "report.md",
    description: "Markdown report.",
    generated: false,
    requiredFor: ["report"],
    stage: "existing-report"
  },
  {
    id: "html-report",
    type: "report",
    path: "report.html",
    description: "Static HTML report.",
    generated: false,
    requiredFor: ["report"],
    stage: "existing-report"
  }
];
