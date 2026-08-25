export type Domain =
  | "llm-fundamentals"
  | "oci-service"
  | "langchain"
  | "rag"
  | "agents";

export type QuestionSource = "github-harshit" | "github-patrickwiloak" | "online";

export interface Question {
  id: string;
  domain: Domain;
  source: QuestionSource;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type QuizMode = "full" | "domain" | "quick";

export interface QuizConfig {
  mode: QuizMode;
  domain: Domain | "all";
  count: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}
