#!/usr/bin/env node
/* global console, fetch, process, URL */
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
import { join, relative, resolve, dirname } from "node:path";
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

  const accessToken = await getGoogleAccessToken();
  const files = await listFiles(localDir);

  for (const file of files) {
    const objectName = `runs/${runId}/${relative(localDir, file)}`;
    await uploadFileToGCS({
      accessToken,
      bucket: GCS_BUCKET,
      file,
      objectName,
    });
  }

  return `gs://${GCS_BUCKET}/runs/${runId}`;
}

async function getGoogleAccessToken() {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: {
        "Metadata-Flavor": "Google",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get Cloud Run metadata token: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("Cloud Run metadata token response did not include access_token.");
  }
  return payload.access_token;
}

async function uploadFileToGCS(input) {
  const body = await readFile(input.file);
  const url = new URL(
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(input.bucket)}/o`
  );
  url.searchParams.set("uploadType", "media");
  url.searchParams.set("name", input.objectName);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to upload ${input.objectName}: HTTP ${response.status} ${text}`);
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

// ── Benchmark runner ─────────────────────────────────────────────────────────
async function runBenchmarkPipeline() {
  const logs = [];
  const runOutput = await runCliStage("run", ["--config", "bench.config.json"], logs);
  const runId = parseRunId(runOutput);

  await runCliStage("score", ["--run", runId], logs);
  await runCliStage("report", ["--run", runId], logs);
  await runCliStage("cost", ["--run", runId], logs);

  return {
    runId,
    runDir: join(ROOT, "runs", runId),
    logs,
  };
}

async function runCliStage(cmd, args, logs) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const proc = spawn("node", [CLI_ENTRY, cmd, ...args], {
      env: { ...process.env },
      cwd: ROOT,
    });

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      logs.push(`[${cmd}] ${text.trim()}`);
    });
    proc.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      logs.push(`[${cmd}:err] ${text.trim()}`);
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Stage '${cmd}' failed (exit ${code}): ${stderr || stdout}`));
      }
    });
  });
}

function parseRunId(output) {
  const match = output.match(/^Run ID:\s*(.+)$/m);
  if (!match?.[1]) {
    throw new Error("Unable to parse benchmark run ID from CLI output.");
  }
  return match[1].trim();
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
      const requestId = randomUUID();
      let runDir = null;

      try {
        const config = body ? JSON.parse(body) : null;
        if (!config) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request body must be valid JSON." }));
          return;
        }

        console.log(`[request:${requestId}] Starting benchmark harness run`);
        const benchmark = await runBenchmarkPipeline();
        runDir = benchmark.runDir;

        // Upload to GCS
        let gcsPath = null;
        try {
          gcsPath = await uploadToGCS(runDir, benchmark.runId);
          console.log(`[run:${benchmark.runId}] Uploaded to ${gcsPath}`);
        } catch (uploadErr) {
          console.warn(`[run:${benchmark.runId}] GCS upload failed: ${uploadErr.message}`);
        }

        // Cleanup local temp dir
        await rm(runDir, { recursive: true, force: true });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            runId: benchmark.runId,
            status: "completed",
            gcsPath,
            logs: benchmark.logs,
          })
        );
      } catch (err) {
        console.error(`[request:${requestId}] Error: ${err.message}`);
        if (runDir) {
          await rm(runDir, { recursive: true, force: true }).catch(() => {});
        }
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ requestId, error: err.message }));
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
