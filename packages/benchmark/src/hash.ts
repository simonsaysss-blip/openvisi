import { createHash } from "node:crypto";

export function stableHash(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex");
}

export function createRunId(dateLabel: string): string {
  const slug = dateLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug.length > 0 ? slug : `benchmark-${new Date().toISOString().slice(0, 10)}`;
}

function stableStringify(input: unknown): string {
  if (input === null || typeof input !== "object") {
    return JSON.stringify(input);
  }

  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = input as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
