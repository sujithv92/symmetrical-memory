import type { Domain, Question, QuizConfig } from "../types";
import { QUESTIONS } from "../data/questions";

export interface PreparedQuestion {
  question: Question;
  /** Order of option indices after shuffling */
  optionOrder: number[];
}

export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function prepareQuestions(questions: Question[]): PreparedQuestion[] {
  return questions.map((question) => ({
    question,
    optionOrder: shuffle(question.options.map((_, i) => i)),
  }));
}

export function buildQuiz(config: QuizConfig): PreparedQuestion[] {
  let pool = QUESTIONS;

  if (config.mode === "domain" && config.domain !== "all") {
    pool = pool.filter((q) => q.domain === config.domain);
  }

  const shuffledPool = shuffle(pool);

  if (config.mode === "quick") {
    return prepareQuestions(shuffledPool.slice(0, config.count));
  }

  return prepareQuestions(shuffledPool);
}

export function domainCounts(): Record<Domain, number> {
  const counts = {
    "llm-fundamentals": 0,
    "oci-service": 0,
    langchain: 0,
    rag: 0,
    agents: 0,
  } as Record<Domain, number>;
  for (const q of QUESTIONS) counts[q.domain] += 1;
  return counts;
}
