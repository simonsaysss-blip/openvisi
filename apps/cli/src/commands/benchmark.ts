import type { Command } from "commander";
import {
  estimateBenchmarkCost,
  generateBenchmarkReport,
  runBenchmark,
  scoreBenchmark
} from "@openvisi/benchmark";

export interface BenchmarkRunOptions {
  config: string;
}

export interface BenchmarkRunCliResult {
  runId: string;
  runDir: string;
  completedResponses: number;
  errorRecords: number;
  cacheHits: number;
}

export interface BenchmarkRunReference {
  run: string;
}

export function registerBenchmarkCommands(program: Command): void {
  program
    .command("run")
    .description("Run a flat-file OpenVisi benchmark harness.")
    .option("--config <path>", "Benchmark config path", "bench.config.json")
    .action(async (options: BenchmarkRunOptions) => {
      try {
        const result = await runBenchmarkCommand(options);
        console.log("OpenVisi benchmark run completed.");
        console.log(`Run ID: ${result.runId}`);
        console.log(`Run directory: ${result.runDir}`);
        console.log(`Completed responses: ${result.completedResponses}`);
        console.log(`Error records: ${result.errorRecords}`);
        console.log(`Cache hits: ${result.cacheHits}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown benchmark run error";
        console.error(`OpenVisi benchmark run failed: ${message}`);
        process.exitCode = 1;
      }
    });

  program
    .command("score")
    .description("Score an OpenVisi benchmark run with deterministic rule-based metrics.")
    .requiredOption("--run <runId>", "Benchmark run ID")
    .action(async (options: BenchmarkRunReference) => {
      try {
        const result = await scoreBenchmarkCommand(options);
        console.log(`OpenVisi benchmark metrics written to: ${result.metricsPath}`);
        console.log(`Metric results: ${result.metricCount}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown benchmark score error";
        console.error(`OpenVisi benchmark score failed: ${message}`);
        process.exitCode = 1;
      }
    });

  program
    .command("report")
    .description("Generate a static Markdown benchmark report.")
    .requiredOption("--run <runId>", "Benchmark run ID")
    .action(async (options: BenchmarkRunReference) => {
      try {
        const result = await reportBenchmarkCommand(options);
        console.log(`OpenVisi benchmark report written to: ${result.reportPath}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown benchmark report error";
        console.error(`OpenVisi benchmark report failed: ${message}`);
        process.exitCode = 1;
      }
    });

  program
    .command("cost")
    .description("Estimate benchmark cost from raw response token usage.")
    .requiredOption("--run <runId>", "Benchmark run ID")
    .action(async (options: BenchmarkRunReference) => {
      try {
        const result = await costBenchmarkCommand(options);
        console.log(`OpenVisi benchmark cost report written to: ${result.costPath}`);
        console.log(`Total benchmark cost: ${result.totalBenchmarkCost}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown benchmark cost error";
        console.error(`OpenVisi benchmark cost failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runBenchmarkCommand(
  options: BenchmarkRunOptions
): Promise<BenchmarkRunCliResult> {
  return runBenchmark({ configPath: options.config });
}

export async function scoreBenchmarkCommand(options: BenchmarkRunReference) {
  return scoreBenchmark({ runId: options.run });
}

export async function reportBenchmarkCommand(options: BenchmarkRunReference) {
  return generateBenchmarkReport({ runId: options.run });
}

export async function costBenchmarkCommand(options: BenchmarkRunReference) {
  return estimateBenchmarkCost({ runId: options.run });
}
