import type { Command } from "commander";
import { registerArtifactsCommand } from "./artifacts.js";
import { registerCrawlCommand } from "./crawl.js";
import { registerDebugCommand } from "./debug.js";
import { registerEvalCommand } from "./eval.js";
import { registerInputsCommand } from "./inputs.js";
import { registerInitCommand } from "./init.js";
import { registerMetricsCommand } from "./metrics.js";
import { registerScanCommand } from "./scan.js";

export function registerCommands(program: Command): void {
  registerInitCommand(program);
  registerArtifactsCommand(program);
  registerCrawlCommand(program);
  registerDebugCommand(program);
  registerEvalCommand(program);
  registerInputsCommand(program);
  registerMetricsCommand(program);
  registerScanCommand(program);
}
