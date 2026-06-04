#!/usr/bin/env node
/**
 * OpenVisi Cloud Run HTTP Server
 *
 * POST /run   — 執行 artifact pipeline，結果上傳至 GCS
 * GET  /health — 健康檢查
 *
 * 環境變數：
 *   GCS_BUCKET   — Cloud Storage bucket 名稱（必填）
 *   PORT         — 監聽 port（預設 8080）
 *   OPENAI_API_KEY  — 選填，real provider 用
 *   ANTHROPIC_API_KEY — 選填
 *   GEMINI_API_KEY    — 選填
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CLI_ENTRY = join(ROOT, "apps/cli/dist/index.js");

const PORT = parseInt(process.env.PORT || "8080", 10);
const GCS_BUCKET = process.env.GCS_BUCKET;

// ── GCS upload helper ─────────────────────────────────────────────────────────
async function uploadToGCS(localDir, runId) {
  if (!GCS_BUCKET) {
    console.warn("[gcs] GCS_BUCKET not set — skipping upload");
    return null;
  }

  // Use gcloud CLI (available in Cloud Run environment)
  return new Promise((resolve, reject) => {
    const dest = `gs://${GCS_BUCKET}/runs/${runId}/`;
    const proc = spawn("gsutil", ["-m", "cp", "-r", `${localDir}/*`, dest], {
      stdio: "inherit",
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(`gs://${GCS_BUCKET}/runs/${runId}`);
      } else {
        reject(new Error(`gsutil exited with code ${code}`));
      }
    });
  });
}

// ── Pipeline runner ───────────────────────────────────────────────────────────
async function runPipeline(config, outputDir) {
  const configPath = join(outputDir, "openvisi.config.json");

  // Write config to temp dir
  const { writeFile, mkdir } = await import("node:fs/promises");
  await mkdir(outputDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2));

  const stages = [
    ["init", "--config", configPath, "--output", outputDir],
    ["crawl", "--config", configPath, "--output", outputDir],
    ["eval", "--config", configPath, "--output", outputDir],
    ["inputs", "--config", configPath, "--output", outputDir],
    ["metrics", "--config", configPath, "--output", outputDir],
  ];

  const logs = [];

  for (const [cmd, ...args] of stages) {
    await new Promise((resolve, reject) => {
      const proc = spawn("node", [CLI_ENTRY, cmd, ...args], {
        env: { ...process.env },
        cwd: ROOT,
      });
      proc.stdout.on("data", (d) => logs.push(`[${cmd}] ${d.toString().trim()}`));
      proc.stderr.on("data", (d) => logs.push(`[${cmd}:err] ${d.toString().trim()}`));
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Stage '${cmd}' failed (exit ${code})`));
      });
    });
  }

  return logs;
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost`);

  // GET /health
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", version: "0.1.0" }));
    return;
  }

  // POST /run
  if (req.method === "POST" && url.pathname === "/run") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      const runId = randomUUID();
      const outputDir = join(ROOT, ".openvisi-runs", runId);

      try {
        const config = body ? JSON.parse(body) : null;
        if (!config || !config.domain) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request body must include at least { domain, brandName, category }" }));
          return;
        }

        console.log(`[run:${runId}] Starting pipeline for domain: ${config.domain}`);
        const logs = await runPipeline(config, outputDir);

        // Upload to GCS
        let gcsPath = null;
        try {
          gcsPath = await uploadToGCS(outputDir, runId);
          console.log(`[run:${runId}] Uploaded to ${gcsPath}`);
        } catch (uploadErr) {
          console.warn(`[run:${runId}] GCS upload failed: ${uploadErr.message}`);
        }

        // Cleanup local temp dir
        await rm(outputDir, { recursive: true, force: true });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            runId,
            status: "completed",
            gcsPath,
            logs,
          })
        );
      } catch (err) {
        console.error(`[run:${runId}] Error: ${err.message}`);
        await rm(outputDir, { recursive: true, force: true }).catch(() => {});
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ runId, error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`OpenVisi Cloud Run server listening on port ${PORT}`);
  console.log(`GCS bucket: ${GCS_BUCKET || "(not set — local mode)"}`);
});
