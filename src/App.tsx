import { useState } from "react";
import type { QuizConfig } from "./types";
import type { PreparedQuestion } from "./lib/quiz";
import { buildQuiz } from "./lib/quiz";
import { HomeScreen } from "./components/HomeScreen";
import { QuizScreen } from "./components/QuizScreen";
import { ResultsScreen } from "./components/ResultsScreen";

type Screen = "home" | "quiz" | "results";

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [mode, setMode] = useState<"study" | "exam">("study");
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [prepared, setPrepared] = useState<PreparedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [sessionKey, setSessionKey] = useState(0);

  const startQuiz = (cfg: QuizConfig, practiceMode: "study" | "exam") => {
    setMode(practiceMode);
    setConfig(cfg);
    setPrepared(buildQuiz(cfg));
    setAnswers({});
    setSessionKey((k) => k + 1);
    setScreen("quiz");
  };

  const finishQuiz = (finalAnswers: Record<string, number>) => {
    setAnswers(finalAnswers);
    setScreen("results");
  };

  const retake = () => {
    if (config) setPrepared(buildQuiz(config));
    setAnswers({});
    setSessionKey((k) => k + 1);
    setScreen("quiz");
  };

  const goHome = () => setScreen("home");

  return (
    <div className="app">
      {screen === "home" && <HomeScreen onStart={startQuiz} />}
      {screen === "quiz" && (
        <QuizScreen
          key={sessionKey}
          prepared={prepared}
          mode={mode}
          onFinish={finishQuiz}
          onExit={goHome}
        />
      )}
      {screen === "results" && (
        <ResultsScreen
          prepared={prepared}
          answers={answers}
          onRetry={retake}
          onHome={goHome}
        />
      )}
    </div>
  );
}
