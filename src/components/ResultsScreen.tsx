import { useMemo, useState } from "react";
import type { PreparedQuestion } from "../lib/quiz";
import type { Domain } from "../types";
import { DOMAIN_LABELS } from "../data/questions";

interface Props {
  prepared: PreparedQuestion[];
  answers: Record<string, number>;
  onRetry: () => void;
  onHome: () => void;
}

const PASS = 68;

export function ResultsScreen({ prepared, answers, onRetry, onHome }: Props) {
  const [showReview, setShowReview] = useState(false);

  const total = prepared.length;
  const correct = prepared.filter(
    (pq) => answers[pq.question.id] === pq.question.correctIndex,
  ).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= PASS;

  const byDomain = useMemo(() => {
    const map = new Map<Domain, { correct: number; total: number }>();
    for (const pq of prepared) {
      const d = pq.question.domain;
      const entry = map.get(d) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (answers[pq.question.id] === pq.question.correctIndex) entry.correct += 1;
      map.set(d, entry);
    }
    return Array.from(map.entries());
  }, [prepared, answers]);

  return (
    <div className="results">
      <header className="results-hero">
        <div className="results-badge">1Z0-1127-25 · Results</div>
        <div className={`results-ring ${passed ? "ring-pass" : "ring-fail"}`}>
          <span className="results-pct">{pct}%</span>
        </div>
        <h1>{passed ? "You passed" : "Not quite there yet"}</h1>
        <p className="results-sub">
          {passed
            ? "At or above the 68% passing threshold. Great work — keep sharpening your weak domains."
            : "Below the 68% passing threshold. Review the explanations below and retry."}
        </p>
        <div className="results-stats">
          <Stat label="Correct" value={`${correct} / ${total}`} />
          <Stat label="Incorrect" value={`${total - correct}`} />
          <Stat label="Pass mark" value={`${PASS}%`} />
        </div>
        <div className="results-actions">
          <button className="primary" onClick={onRetry}>
            Retake quiz
          </button>
          <button className="ghost" onClick={onHome}>
            Back to home
          </button>
          <button className="ghost" onClick={() => setShowReview((v) => !v)}>
            {showReview ? "Hide review" : "Review answers"}
          </button>
        </div>
      </header>

      {byDomain.length > 0 && (
        <section className="panel">
          <h2>Performance by domain</h2>
          <div className="domain-bars">
            {byDomain.map(([domain, s]) => {
              const p = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={domain} className="domain-bar-row">
                  <div className="domain-bar-label">
                    <span>{DOMAIN_LABELS[domain]}</span>
                    <span>
                      {s.correct}/{s.total}
                    </span>
                  </div>
                  <div className="domain-bar-track">
                    <div
                      className={`domain-bar-fill ${p >= PASS ? "bar-pass" : "bar-fail"}`}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showReview && (
        <section className="panel review">
          <h2>Answer review</h2>
          {prepared.map((pq, i) => {
            const sel = answers[pq.question.id];
            const ok = sel === pq.question.correctIndex;
            const skipped = sel === undefined;
            return (
              <div key={pq.question.id} className={`review-item ${ok ? "rev-ok" : "rev-bad"}`}>
                <div className="review-q">
                  <span className="review-num">
                    {i + 1}. {skipped ? "Skipped" : ok ? "Correct" : "Incorrect"}
                  </span>
                  <span className="review-domain">{DOMAIN_LABELS[pq.question.domain]}</span>
                  <p className="review-prompt">{pq.question.prompt}</p>
                </div>
                <ul className="review-options">
                  {pq.question.options.map((opt, oi) => {
                    const isCorrect = oi === pq.question.correctIndex;
                    const isSelected = sel === oi;
                    let cls = "";
                    if (isCorrect) cls = "review-opt-correct";
                    else if (isSelected) cls = "review-opt-wrong";
                    return (
                      <li key={oi} className={cls}>
                        {opt}
                        {isCorrect && " ✓"}
                        {isSelected && !isCorrect && " ✕ (your answer)"}
                      </li>
                    );
                  })}
                </ul>
                <p className="review-explain">{pq.question.explanation}</p>
              </div>
            );
          })}
        </section>
      )}

      <footer className="footer">
        Unofficial study aid — not affiliated with or endorsed by Oracle.
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
