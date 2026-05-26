import { constants } from "node:fs";
import { access, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Command } from "commander";
import type { OpenVisiConfigInput } from "../config.js";

export const starterConfig: OpenVisiConfigInput = {
  brandName: "OpenVisi",
  domain: "openvisi.dev",
  category: "AI Visibility diagnostics",
  competitors: [
    {
      name: "Example Competitor",
      domain: "example.com",
      aliases: ["Example"]
    }
  ],
  providers: [
    {
      provider: "mock",
      model: "mock-v0",
      enabled: true
    }
  ],
  outputDir: "openvisi-report",
  includeExperimentalMetrics: false,
  promptPackInput: {
    audience: "B2B SaaS teams",
    problems: [
      "measuring AI-generated answer visibility",
      "understanding how AI describes a brand"
    ],
    integrations: ["Google Search Console", "Slack"]
  }
};

export interface InitOptions {
  force?: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create a starter OpenVisi config file.")
    .option("--force", "Overwrite an existing openvisi.config.json")
    .action(async (options: InitOptions) => {
      try {
        const configPath = await writeStarterConfig(process.cwd(), Boolean(options.force));
        console.log(`Created OpenVisi config: ${configPath}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown init error";
        console.error(`OpenVisi init failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function writeStarterConfig(directory: string, force = false): Promise<string> {
  const configPath = path.resolve(directory, "openvisi.config.json");
  const exists = await fileExists(configPath);

  if (exists && !force) {
    throw new Error("openvisi.config.json already exists. Re-run with --force to overwrite it.");
  }

  await writeFile(configPath, `${JSON.stringify(starterConfig, null, 2)}\n`, "utf8");
  return configPath;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
