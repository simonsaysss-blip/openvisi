import { describe, expect, it } from "vitest";
import {
  computeAiVisibilityScoreV01,
  metricDefinitions,
  metricLayerMap,
  validateMetrics
} from "./metrics.js";

describe("OpenVisi canonical metrics schema", () => {
  it("marks experimental metrics explicitly", () => {
    for (const metricName of metricLayerMap.experimental) {
      expect(metricDefinitions[metricName].experimental).toBe(true);
      expect(metricDefinitions[metricName].layer).toBe("experimental");
    }
  });

  it("validates metric ranges by scale", () => {
    expect(validateMetrics({ entityClarity: 0.8, aiVisibilityScore: 82 })).toEqual([]);
    expect(validateMetrics({ entityClarity: 1.2, aiVisibilityScore: 101 })).toEqual([
      "entityClarity must be between 0 and 1.",
      "aiVisibilityScore must be between 0 and 100."
    ]);
  });

  it("computes a v0.1 score only when required layers are present", () => {
    expect(
      computeAiVisibilityScoreV01({
        answerPresence: 0.8,
        entityClarity: 0.7,
        citationCoverage: 0.6,
        categoryShare: 0.5,
        aiReadableStructure: 0.9
      })
    ).toBe(70.5);

    expect(
      computeAiVisibilityScoreV01({
        answerPresence: 0.8,
        entityClarity: 0.7,
        citationCoverage: 0.6,
        aiReadableStructure: 0.9
      })
    ).toBeNull();
  });
});
