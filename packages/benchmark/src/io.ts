import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export async function ensureDir(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
}

export async function readJsonFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  label = path.basename(filePath)
): Promise<T> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse error";
    throw new Error(`Failed to read ${label}: ${message}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid ${label}:\n${formatZodIssues(result.error)}`);
  }

  return result.data;
}

export async function readJsonArrayFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  label = path.basename(filePath)
): Promise<T[]> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse error";
    throw new Error(`Failed to read ${label}: ${message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid ${label}: expected an array.`);
  }

  const output: T[] = [];
  const errors: string[] = [];
  parsed.forEach((record, index) => {
    const result = schema.safeParse(record);
    if (result.success) {
      output.push(result.data);
      return;
    }

    errors.push(`record ${index}: ${formatZodIssues(result.error)}`);
  });

  if (errors.length > 0) {
    throw new Error(`Invalid ${label}:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return output;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function appendJsonlRecord(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await appendFile(filePath, `${JSON.stringify(data)}\n`, "utf8");
}

export async function readJsonlFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  label = path.basename(filePath)
): Promise<T[]> {
  let text = "";

  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown read error";
    throw new Error(`Failed to read ${label}: ${message}`);
  }

  const records: T[] = [];
  const errors: string[] = [];
  text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .forEach((line, index) => {
      try {
        const parsed = JSON.parse(line) as unknown;
        const result = schema.safeParse(parsed);
        if (result.success) {
          records.push(result.data);
          return;
        }

        errors.push(`line ${index + 1}: ${formatZodIssues(result.error)}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown JSONL parse error";
        errors.push(`line ${index + 1}: ${message}`);
      }
    });

  if (errors.length > 0) {
    throw new Error(`Invalid ${label}:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return records;
}

export function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const location = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${location}: ${issue.message}`;
    })
    .join("; ");
}
