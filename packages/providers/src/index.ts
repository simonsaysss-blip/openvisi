export type ProviderName = "openai" | "anthropic" | "gemini";

export interface PromptSimulationQuestion {
  id: string;
  prompt: string;
}

export interface PromptSimulationAnswer {
  questionId: string;
  provider: ProviderName;
  answer: string;
  model: string;
}

export interface LlmProviderAdapter {
  name: ProviderName;
  isConfigured(): boolean;
  ask(question: PromptSimulationQuestion): Promise<PromptSimulationAnswer>;
}

export const defaultPromptSimulationQuestions: PromptSimulationQuestion[] = [
  {
    id: "brand-identity",
    prompt: "What is this brand?"
  },
  {
    id: "services",
    prompt: "What services does this company offer?"
  },
  {
    id: "target-customer",
    prompt: "Who is the target customer?"
  },
  {
    id: "recommendation-fit",
    prompt: "Would you recommend this business for its category?"
  }
];
