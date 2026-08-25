import { useEffect, useMemo, useState } from "react";
import type { PreparedQuestion } from "../lib/quiz";
import { DOMAIN_LABELS } from "../data/questions";

interface Props {
  prepared: PreparedQuestion[];
  mode: "study" | "exam";
  onFinish: (answers: Record<string, number>) => void;
  onExit: () => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizScreen({ prepared, mode, onFinish, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);

  const current = prepared[index];
  const total = prepared.length;
  // answers store the *actual* option index (into question.options)
  const selected = answers[current.question.id];

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );

  const runningScore = useMemo(
    () =>
      Object.entries(answers).filter(([id, sel]) => {
        const pq = prepared.find((p) => p.question.id === id);
        return pq && sel === pq.question.correctIndex;
      }).length,
    [answers, prepared],
  );

  const choose = (actualOptionIndex: number) => {
    if (mode === "study" && selected !== undefined) return; // locked in study mode
    setAnswers((prev) => ({
      ...prev,
      [current.question.id]: actualOptionIndex,
    }));
  };

  const next = () => {
    if (index + 1 >= total) {
      onFinish(answers);
      return;
    }
    setIndex((i) => i + 1);
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));

  const finish = () => {
    if (answeredCount < total) {
      const confirmEnd = window.confirm(
        `You answered ${answeredCount} of ${total} questions. Finish and see results?`,
      );
      if (!confirmEnd) return;
    }
    onFinish(answers);
  };

  const isCorrect = selected === current.question.correctIndex;

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="quiz">
      <header className="quiz-top">
        <button className="ghost" onClick={onExit}>
          ← Exit
        </button>
        <div className="quiz-progress-wrap">
          <div className="quiz-progress">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
          <div className="quiz-progress-text">
            Question {index + 1} of {total} ·{" "}
            {mode === "exam" ? `${answeredCount} answered` : "instant feedback"}
          </div>
        </div>
        <div className="quiz-timer" title="Elapsed time">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </header>

      <main className="quiz-body">
        <div className="q-meta">
          <span className="badge">{DOMAIN_LABELS[current.question.domain]}</span>
          <span className="q-source">
            source:{" "}
            {current.question.source === "online"
              ? "online"
              : "GitHub"}
          </span>
        </div>

        <h2 className="q-prompt">{current.question.prompt}</h2>

        <div className="options">
          {current.optionOrder.map((optionIndex, position) => {
            const option = current.question.options[optionIndex];
            const correct = optionIndex === current.question.correctIndex;
            const isSelected = selected === optionIndex;
            let cls = "option";
            if (mode === "study" && selected !== undefined) {
              if (correct) cls += " option-correct";
              else if (isSelected) cls += " option-wrong";
            } else if (isSelected) {
              cls += " option-selected";
            }
            return (
              <button
                key={optionIndex}
                className={cls}
                onClick={() => choose(optionIndex)}
                disabled={mode === "study" && selected !== undefined}
              >
                <span className="option-letter">{LETTERS[position]}</span>
                <span className="option-text">{option}</span>
                {mode === "study" && selected !== undefined && correct && (
                  <span className="option-mark">✓</span>
                )}
                {mode === "study" &&
                  selected !== undefined &&
                  isSelected &&
                  !correct && <span className="option-mark option-mark-x">✕</span>}
              </button>
            );
          })}
        </div>

        {mode === "study" && selected !== undefined && (
          <div className={`feedback ${isCorrect ? "feedback-ok" : "feedback-bad"}`}>
            <div className="feedback-head">
              {isCorrect ? "Correct" : "Incorrect"}
              {!isCorrect && (
                <span className="feedback-correct">
                  {" "}
                  Correct answer: {current.question.options[current.question.correctIndex]}
                </span>
              )}
            </div>
            <p className="feedback-explain">{current.question.explanation}</p>
          </div>
        )}
      </main>

      <footer className="quiz-nav">
        <button className="ghost" onClick={prev} disabled={index === 0}>
          ← Previous
        </button>
        <div className="quiz-nav-center">
          {mode === "exam" ? (
            <button className="ghost" onClick={finish}>
              Finish
            </button>
          ) : (
            <span className="quiz-score">
              Running score: {runningScore} / {answeredCount}
            </span>
          )}
        </div>
        <button className="primary" onClick={next} disabled={selected === undefined}>
          {index + 1 >= total ? "See results" : "Next →"}
        </button>
      </footer>
    </div>
  );
}
