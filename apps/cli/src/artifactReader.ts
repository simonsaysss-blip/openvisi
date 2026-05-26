import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  validateArtifactBundleReferences,
  validateArtifactManifestShape,
  validateReportReferencesShape,
  type ArtifactBundleStage,
  type ArtifactBundleValidationResult,
  type OpenVisiArtifactManifest,
  type ReportReferencesFile
} from "@openvisi/core";
import { pathExists } from "./output.js";

export interface ArtifactBundleReadOptions {
  expectedStage?: ArtifactBundleStage;
  requireReportReferences?: boolean;
}

export interface ArtifactBundleReadResult {
  outputDir: string;
  manifest: OpenVisiArtifactManifest;
  reportReferences: ReportReferencesFile | null;
  existingArtifactPaths: string[];
  validation: ArtifactBundleValidationResult;
}

export async function readArtifactManifest(outputDir: string): Promise<OpenVisiArtifactManifest> {
  const filePath = resolveArtifactPath(outputDir, "artifact-manifest.json");

  if (!(await pathExists(filePath))) {
    throw new Error(`artifact-manifest.json was not found in ${outputDir}.`);
  }

  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const errors = validateArtifactManifestShape(parsed);

  if (errors.length > 0) {
    throw new Error(`Invalid artifact-manifest.json:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return parsed as OpenVisiArtifactManifest;
}

export async function readReportReferences(outputDir: string): Promise<ReportReferencesFile | null> {
  const filePath = resolveArtifactPath(outputDir, "report-references.json");

  if (!(await pathExists(filePath))) {
    return null;
  }

  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const errors = validateReportReferencesShape(parsed);

  if (errors.length > 0) {
    throw new Error(`Invalid report-references.json:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return parsed as ReportReferencesFile;
}

export async function readArtifactBundle(
  outputDir: string,
  options: ArtifactBundleReadOptions = {}
): Promise<ArtifactBundleReadResult> {
  const manifest = await readArtifactManifest(outputDir);
  const reportReferences = await readReportReferences(outputDir);
  const existingArtifactPaths: string[] = [];

  for (const artifact of manifest.artifacts) {
    if (await pathExists(resolveArtifactPath(outputDir, artifact.path))) {
      existingArtifactPaths.push(artifact.path);
    }
  }

  const validation = validateArtifactBundleReferences({
    manifest,
    existingArtifactPaths,
    ...(options.expectedStage ? { expectedStage: options.expectedStage } : {}),
    reportReferences,
    ...(options.requireReportReferences !== undefined
      ? { requireReportReferences: options.requireReportReferences }
      : {})
  });

  return {
    outputDir,
    manifest,
    reportReferences,
    existingArtifactPaths,
    validation
  };
}

export async function validateArtifactBundle(
  outputDir: string,
  options: ArtifactBundleReadOptions = {}
): Promise<ArtifactBundleValidationResult> {
  return (await readArtifactBundle(outputDir, options)).validation;
}

export function resolveArtifactPath(outputDir: string, relativePath: string): string {
  return path.resolve(outputDir, relativePath);
}
