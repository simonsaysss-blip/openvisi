import { readFile } from "node:fs/promises";
import path from "node:path";

export async function readEnvValue(name: string, cwd = process.cwd()): Promise<string | undefined> {
  const fromProcess = process.env[name];
  if (fromProcess && fromProcess.trim().length > 0) {
    return fromProcess.trim();
  }

  const envPath = path.resolve(cwd, ".env");
  let text = "";
  try {
    text = await readFile(envPath, "utf8");
  } catch {
    return undefined;
  }

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    if (key !== name) continue;

    return unquoteEnvValue(trimmed.slice(separator + 1).trim());
  }

  return undefined;
}

function unquoteEnvValue(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
