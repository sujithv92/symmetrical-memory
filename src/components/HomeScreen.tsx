import { useState } from "react";
import type { Domain, QuizConfig, QuizMode } from "../types";
import { DOMAIN_LABELS, QUESTIONS } from "../data/questions";
import { domainCounts } from "../lib/quiz";

interface Props {
  onStart: (config: QuizConfig, mode: "study" | "exam") => void;
}

const DOMAIN_ORDER: Domain[] = [
  "llm-fundamentals",
  "oci-service",
  "langchain",
  "rag",
  "agents",
];

export function HomeScreen({ onStart }: Props) {
  const [mode, setMode] = useState<QuizMode>("full");
  const [domain, setDomain] = useState<Domain>("rag");
  const [practiceMode, setPracticeMode] = useState<"study" | "exam">("study");

  const counts = domainCounts();

  const start = () => {
    const config: QuizConfig =
      mode === "domain"
        ? { mode, domain, count: 0 }
        : mode === "quick"
          ? { mode, domain: "all", count: 10 }
          : { mode, domain: "all", count: 0 };
    onStart(config, practiceMode);
  };

  return (
    <div className="home">
      <header className="hero">
        <div className="hero-badge">Oracle Cloud Infrastructure · 1Z0-1127-25</div>
        <h1>Generative AI Professional</h1>
        <p className="hero-sub">
          Practice quiz for the Oracle Cloud Infrastructure 2025 Generative AI
          Professional certification. {QUESTIONS.length} questions drawn from the
          official exam topics — LLM fundamentals, the OCI Generative AI service,
          LangChain, RAG &amp; vector search, and Generative AI Agents.
        </p>
        <div className="exam-facts">
          <Fact label="Questions (real exam)" value="60" />
          <Fact label="Duration" value="90 min" />
          <Fact label="Passing score" value="68%" />
          <Fact label="Question bank" value={`${QUESTIONS.length}`} />
        </div>
      </header>

      <section className="panel">
        <h2>Choose a session</h2>

        <div className="mode-grid">
          <ModeCard
            active={mode === "full"}
            title="Full practice exam"
            description={`All ${QUESTIONS.length} questions, shuffled, across every exam domain.`}
            onClick={() => setMode("full")}
          />
          <ModeCard
            active={mode === "domain"}
            title="Domain practice"
            description="Focus on a single exam domain at your own pace."
            onClick={() => setMode("domain")}
          />
          <ModeCard
            active={mode === "quick"}
            title="Quick quiz"
            description="10 random questions for a fast knowledge check."
            onClick={() => setMode("quick")}
          />
        </div>

        {mode === "domain" && (
          <div className="domain-picker">
            <span className="domain-picker-label">Pick a domain:</span>
            <div className="domain-chips">
              {DOMAIN_ORDER.map((d) => (
                <button
                  key={d}
                  className={`chip ${domain === d ? "chip-active" : ""}`}
                  onClick={() => setDomain(d)}
                >
                  {DOMAIN_LABELS[d]}
                  <span className="chip-count">{counts[d]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mode-switch">
          <span className="mode-switch-label">Answer feedback:</span>
          <div className="seg">
            <button
              className={`seg-btn ${practiceMode === "study" ? "seg-active" : ""}`}
              onClick={() => setPracticeMode("study")}
            >
              Study — explain each answer
            </button>
            <button
              className={`seg-btn ${practiceMode === "exam" ? "seg-active" : ""}`}
              onClick={() => setPracticeMode("exam")}
            >
              Exam — score at the end
            </button>
          </div>
        </div>

        <button className="primary" onClick={start}>
          Start quiz
        </button>
      </section>

      <section className="panel sources">
        <h2>About the questions</h2>
        <p>
          The question bank is built from practice material published on GitHub
          for the <strong>1Z0-1127-25</strong> exam only, supplemented with
          publicly available sample questions. Answers were cross-checked against
          Oracle's official Generative AI documentation.
        </p>
        <ul>
          <li>
            <a
              href="https://github.com/harshit01010/Oracle_Certifications"
              target="_blank"
              rel="noreferrer"
            >
              harshit01010/Oracle_Certifications
            </a>{" "}
            — 1Z0-1127-25 practice exam &amp; skill checks
          </li>
          <li>
            <a
              href="https://github.com/PatrickWiloak/cloud-data-ai-security-zero-to-hero"
              target="_blank"
              rel="noreferrer"
            >
              PatrickWiloak/cloud-data-ai-security-zero-to-hero
            </a>{" "}
            — OCI Generative AI Professional question bank
          </li>
          <li>
            Public sample questions from{" "}
            <a
              href="https://certificationpractice.com/practice-exams/oracle-cloud-infrastructure-generative-ai-professional"
              target="_blank"
              rel="noreferrer"
            >
              certificationpractice.com
            </a>{" "}
            and a LinkedIn 1Z0-1127-25 cheatsheet
          </li>
        </ul>
      </section>

      <footer className="footer">
        Unofficial study aid — not affiliated with or endorsed by Oracle.
      </footer>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="fact">
      <div className="fact-value">{value}</div>
      <div className="fact-label">{label}</div>
    </div>
  );
}

function ModeCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button className={`mode-card ${active ? "mode-active" : ""}`} onClick={onClick}>
      <div className="mode-title">{title}</div>
      <div className="mode-desc">{description}</div>
    </button>
  );
}
