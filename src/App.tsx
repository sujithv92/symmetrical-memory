import { useEffect, useState } from "react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { Workspace } from "./components/Workspace";
import {
  forgetKey,
  loadActiveProjectId,
  loadKey,
  loadProjects,
  loadSettings,
  saveActiveProjectId,
  saveKey,
  saveProjects,
  saveSettings,
} from "./lib/storage";
import type { AppSettings, Project } from "./types";

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [apiKey, setApiKey] = useState(() => loadKey());
  const [ready, setReady] = useState(() => Boolean(loadKey()));
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const saved = loadActiveProjectId();
    const all = loadProjects();
    if (saved && all.some((p) => p.id === saved)) return saved;
    return all[0]?.id ?? null;
  });

  useEffect(() => {
    saveSettings(settings);
    saveKey(apiKey, settings.rememberKey);
  }, [settings, apiKey]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveActiveProjectId(activeId);
  }, [activeId]);

  function patchSettings(patch: Partial<AppSettings>) {
    setSettings((s) => ({ ...s, ...patch }));
  }

  if (!ready) {
    return (
      <WelcomeScreen
        settings={settings}
        apiKey={apiKey}
        onSettings={patchSettings}
        onKey={setApiKey}
        onReady={() => setReady(true)}
      />
    );
  }

  return (
    <Workspace
      settings={settings}
      apiKey={apiKey}
      projects={projects}
      activeId={activeId}
      onSettings={patchSettings}
      onKey={setApiKey}
      onForget={() => {
        forgetKey();
        setApiKey("");
        patchSettings({ rememberKey: false });
        setReady(false);
      }}
      onProjects={setProjects}
      onActive={setActiveId}
      onLock={() => setReady(false)}
    />
  );
}
