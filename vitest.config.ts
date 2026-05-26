import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@openvisi/analyzer": path.resolve(__dirname, "packages/analyzer/src/index.ts"),
      "@openvisi/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@openvisi/crawler": path.resolve(__dirname, "packages/crawler/src/index.ts"),
      "@openvisi/evaluator": path.resolve(__dirname, "packages/evaluator/src/index.ts"),
      "@openvisi/providers": path.resolve(__dirname, "packages/providers/src/index.ts"),
      "@openvisi/report": path.resolve(__dirname, "packages/report/src/index.ts")
    }
  }
});
