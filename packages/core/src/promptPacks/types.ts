import type { CompetitorSpec, PromptIntent, PromptSpec } from "../schema/scan.js";

export type PromptPackCategory = PromptIntent;

export interface PromptPackInput {
  brandName: string;
  category: string;
  domain: string;
  competitors: CompetitorSpec[];
  audience?: string;
  problems?: string[];
  integrations?: string[];
}

export interface PromptTemplate {
  id: string;
  intent: PromptPackCategory;
  category: string;
  template: string;
  build(input: PromptPackInput): PromptSpec[];
}
