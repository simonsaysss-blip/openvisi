import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { writeStarterConfig } from "./init.js";

describe("writeStarterConfig", () => {
  it("does not overwrite existing config without force", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-init-"));
    await writeStarterConfig(directory);

    await expect(writeStarterConfig(directory)).rejects.toThrow(
      "openvisi.config.json already exists"
    );
  });
});
