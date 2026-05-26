#!/usr/bin/env node
/* global console, process */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.join(repoRoot, ".openvisi-release");
const packsDir = path.join(workspace, "packs");
const installSmokeDir = path.join(workspace, "install-smoke");
const logsDir = path.join(workspace, "logs");
const summaryPath = path.join(workspace, "summary.json");
const npmCache = path.join(repoRoot, ".npm-cache");
const args = new Set(process.argv.slice(2));
const checks = {
  releaseCheck: "pending",
  rootPackDryRun: "pending",
  workspacePackDryRun: "pending",
  cliTarballInstall: "pending",
  cliSmoke: "pending"
};

if (args.has("--clean")) {
  await rm(workspace, { recursive: true, force: true });
  console.log("Removed .openvisi-release");
  process.exit(0);
}

try {
  await rm(workspace, { recursive: true, force: true });
  await run("npm", ["run", "release:check"], {
    cwd: repoRoot
  });
  checks.releaseCheck = "passed";

  await prepareWorkspace();

  await runStep("rootPackDryRun", "npm", ["pack", "--dry-run", "--cache", npmCache], {
    cwd: repoRoot,
    logName: "root-pack-dry-run.log"
  });

  const workspacePackages = await getWorkspacePackages();
  const publishablePackages = workspacePackages.filter((workspacePackage) =>
    isPublishablePackage(workspacePackage)
  );

  for (const workspacePackage of publishablePackages) {
    await runStep(
      "workspacePackDryRun",
      "npm",
      ["pack", "--dry-run", "--cache", npmCache],
      {
        cwd: workspacePackage.directory,
        logName: `pack-dry-run-${safePackageName(workspacePackage.packageJson.name)}.log`
      }
    );
  }
  checks.workspacePackDryRun = "passed";

  const packTargets = resolveCliInstallPackTargets(workspacePackages);
  const packedTarballs = [];
  for (const workspacePackage of packTargets) {
    const output = await run("npm", [
      "pack",
      "--pack-destination",
      packsDir,
      "--cache",
      npmCache
    ], {
      cwd: workspacePackage.directory,
      logName: `pack-${safePackageName(workspacePackage.packageJson.name)}.log`
    });
    packedTarballs.push({
      packageName: workspacePackage.packageJson.name,
      tarballPath: resolvePackedTarball(output, workspacePackage.packageJson.name)
    });
  }

  const cliTarball = packedTarballs.find((tarball) => tarball.packageName === "openvisi");
  if (!cliTarball) {
    throw new Error("Could not find packed CLI tarball.");
  }

  const externalDependencies = await getExternalProductionDependencies(workspacePackages);
  await prepareInstallSmokeProject(externalDependencies);
  await seedInstallSmokeDependencies(externalDependencies);
  await runStep(
    "cliTarballInstall",
    "npm",
    [
      "install",
      ...packedTarballs.map((tarball) => tarball.tarballPath),
      "--cache",
      path.relative(installSmokeDir, npmCache),
      "--offline",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      "--package-lock=false"
    ],
    {
      cwd: installSmokeDir,
      logName: "install-smoke.log"
    }
  );

  await runCliSmoke();
  await assertInstallSmokeArtifacts();
  checks.cliSmoke = "passed";

  await writeSummary("passed", { cliTarball: cliTarball.tarballPath, publishablePackages });
  printSummary();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`OpenVisi release rehearsal failed: ${message}`);
  await writeSummary("failed", { error: message }).catch(() => undefined);
  process.exitCode = 1;
}

async function prepareWorkspace() {
  await rm(workspace, { recursive: true, force: true });
  await mkdir(packsDir, { recursive: true });
  await mkdir(installSmokeDir, { recursive: true });
  await mkdir(logsDir, { recursive: true });
}

async function prepareInstallSmokeProject(externalDependencies) {
  await rm(installSmokeDir, { recursive: true, force: true });
  await mkdir(installSmokeDir, { recursive: true });
  await writeFile(
    path.join(installSmokeDir, "package.json"),
    `${JSON.stringify(
      {
        name: "openvisi-release-install-smoke",
        version: "0.0.0",
        private: true,
        type: "module",
        dependencies: Object.fromEntries(
          externalDependencies.map((dependency) => [dependency.name, dependency.version])
        )
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

async function getWorkspacePackages() {
  const rootPackage = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  const workspaces = rootPackage.workspaces ?? [];
  const workspacePackages = [];

  for (const workspacePath of workspaces) {
    if (workspacePath.includes("*")) {
      throw new Error(`Wildcard workspace paths are not supported by release rehearsal: ${workspacePath}`);
    }

    const directory = path.join(repoRoot, workspacePath);
    const packagePath = path.join(directory, "package.json");
    if (!existsSync(packagePath)) continue;

    const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
    workspacePackages.push({
      workspacePath,
      directory,
      packageJson
    });
  }

  return workspacePackages;
}

async function getExternalProductionDependencies(workspacePackages) {
  const workspacePackageNames = new Set(
    workspacePackages.map((workspacePackage) => workspacePackage.packageJson.name)
  );
  const rootLock = JSON.parse(await readFile(path.join(repoRoot, "package-lock.json"), "utf8"));
  const dependencies = [];

  for (const [packagePath, packageInfo] of Object.entries(rootLock.packages ?? {})) {
    const packageName = topLevelNodeModuleName(packagePath);
    if (!packageName) continue;
    if (packageInfo.dev === true) continue;
    if (workspacePackageNames.has(packageName)) continue;
    if (packageName === "openvisi") continue;
    if (!packageInfo.version) continue;

    const sourcePath = path.join(repoRoot, "node_modules", ...packageName.split("/"));
    if (!existsSync(sourcePath)) continue;

    dependencies.push({
      name: packageName,
      version: packageInfo.version,
      sourcePath
    });
  }

  return dependencies.sort((left, right) => left.name.localeCompare(right.name));
}

function topLevelNodeModuleName(packagePath) {
  const parts = packagePath.split("/");
  if (parts[0] !== "node_modules") return null;
  if (parts[1]?.startsWith("@") && parts.length === 3) return `${parts[1]}/${parts[2]}`;
  if (!parts[1]?.startsWith("@") && parts.length === 2) return parts[1];
  return null;
}

function isPublishablePackage(workspacePackage) {
  return workspacePackage.packageJson.private !== true;
}

function resolveCliInstallPackTargets(workspacePackages) {
  const byName = new Map(
    workspacePackages.map((workspacePackage) => [
      workspacePackage.packageJson.name,
      workspacePackage
    ])
  );
  const cliPackage = workspacePackages.find((workspacePackage) => workspacePackage.packageJson.bin?.openvisi);
  if (!cliPackage) {
    throw new Error("Could not find CLI workspace package with bin.openvisi.");
  }

  const visited = new Set();
  const targets = [];

  function visit(workspacePackage) {
    const name = workspacePackage.packageJson.name;
    if (visited.has(name)) return;
    visited.add(name);

    const dependencies = {
      ...(workspacePackage.packageJson.dependencies ?? {}),
      ...(workspacePackage.packageJson.peerDependencies ?? {})
    };

    for (const dependencyName of Object.keys(dependencies)) {
      const dependencyPackage = byName.get(dependencyName);
      if (dependencyPackage) visit(dependencyPackage);
    }

    targets.push(workspacePackage);
  }

  visit(cliPackage);
  return targets;
}

async function seedInstallSmokeDependencies(externalDependencies) {
  const nodeModulesDir = path.join(installSmokeDir, "node_modules");
  await mkdir(nodeModulesDir, { recursive: true });

  for (const dependency of externalDependencies) {
    const destination = path.join(nodeModulesDir, ...dependency.name.split("/"));
    await mkdir(path.dirname(destination), { recursive: true });
    if (!existsSync(destination)) {
      await symlink(dependency.sourcePath, destination, "dir");
    }
  }
}

async function runCliSmoke() {
  await runStep("cliSmoke", "npx", ["--no-install", "openvisi", "--help"], {
    cwd: installSmokeDir,
    logName: "cli-help.log"
  });
  await runStep("cliSmoke", "npx", ["--no-install", "openvisi", "init"], {
    cwd: installSmokeDir,
    logName: "cli-init.log"
  });
  await runStep(
    "cliSmoke",
    "npx",
    [
      "--no-install",
      "openvisi",
      "scan",
      "--dry-run",
      "--provider",
      "mock",
      "--output",
      "openvisi-report"
    ],
    {
      cwd: installSmokeDir,
      logName: "cli-scan-dry-run.log"
    }
  );
  await runStep(
    "cliSmoke",
    "npx",
    [
      "--no-install",
      "openvisi",
      "artifacts",
      "inspect",
      "--output",
      "openvisi-report",
      "--stage",
      "dry-run"
    ],
    {
      cwd: installSmokeDir,
      logName: "cli-artifacts-inspect.log"
    }
  );
}

async function assertInstallSmokeArtifacts() {
  const dryRunOutput = path.join(installSmokeDir, "openvisi-report");
  await assertContains(installSmokeDir, ["openvisi.config.json"]);
  await assertContains(dryRunOutput, [
    "artifact-manifest.json",
    "scan-plan.json",
    "config.normalized.json",
    "prompt-pack.json",
    "warnings.json"
  ]);
  await assertMissingRecursive(installSmokeDir, [
    "metrics.json",
    "scan-result.json",
    "report.md",
    "report.html",
    "answers.json",
    "crawled-pages.json"
  ]);
}

async function assertContains(directory, fileNames) {
  for (const fileName of fileNames) {
    const filePath = path.join(directory, fileName);
    if (!existsSync(filePath)) {
      throw new Error(`Install smoke check failed: expected ${filePath}`);
    }
  }
}

async function assertMissingRecursive(directory, fileNames) {
  if (!existsSync(directory)) return;
  const entries = await readdir(directory);
  for (const entry of entries) {
    const filePath = path.join(directory, entry);
    const info = await stat(filePath);

    if (info.isDirectory()) {
      await assertMissingRecursive(filePath, fileNames);
      continue;
    }

    if (fileNames.includes(path.basename(filePath))) {
      throw new Error(`Install smoke check failed: unexpected ${filePath}`);
    }
  }
}

async function runStep(checkName, command, commandArgs, options) {
  await run(command, commandArgs, options);
  checks[checkName] = "passed";
}

async function run(command, commandArgs, options) {
  const cwd = options.cwd ?? repoRoot;
  const logPath = options.logName ? path.join(logsDir, options.logName) : null;
  const display = `$ ${[command, ...commandArgs].map(shellQuote).join(" ")}`;
  console.log(display);

  let output = `${display}\n`;
  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        NO_COLOR: "1"
      }
    });

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${command} ${commandArgs.join(" ")}`));
      }
    });
  });

  if (logPath) {
    await writeFile(logPath, output, "utf8");
  }
  return output;
}

function resolvePackedTarball(output, packageName) {
  const fileName = output
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .reverse()
    .find((line) => line.endsWith(".tgz"));

  if (!fileName) {
    throw new Error(`Could not determine tarball filename for ${packageName}.`);
  }

  const tarballPath = path.join(packsDir, fileName);
  if (!existsSync(tarballPath)) {
    throw new Error(`Expected packed tarball does not exist: ${tarballPath}`);
  }
  return tarballPath;
}

async function writeSummary(status, extra = {}) {
  await mkdir(workspace, { recursive: true });
  const summary = {
    status,
    generatedAt: new Date().toISOString(),
    releaseCandidate: "v0.1.0",
    checks,
    finalMetricsGenerated: false,
    finalAiVisibilityScoreGenerated: false,
    published: false,
    gitTagCreated: false,
    ...(status === "failed" && extra.error ? { error: extra.error } : {}),
    ...(extra.cliTarball ? { cliTarball: path.relative(repoRoot, extra.cliTarball) } : {}),
    ...(extra.publishablePackages
      ? {
          publishablePackages: extra.publishablePackages.map((workspacePackage) => ({
            name: workspacePackage.packageJson.name,
            path: workspacePackage.workspacePath
          }))
        }
      : {})
  };

  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

function printSummary() {
  console.log("");
  console.log("OpenVisi release rehearsal completed.");
  console.log(`Summary: ${path.relative(repoRoot, summaryPath)}`);
  console.log("Published: no");
  console.log("Git tag created: no");
  console.log("Final metrics generated: no");
  console.log("Final AI Visibility Score generated: no");
}

function safePackageName(packageName) {
  return packageName.replace(/^@/, "").replace(/[/@]/g, "-");
}

function shellQuote(value) {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}
