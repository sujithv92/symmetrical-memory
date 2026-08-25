import { useEffect, useMemo, useRef, useState } from "react";
import {
  challengeThought,
  composeProject,
  demoDrafts,
  expandThought,
  mergeThoughts,
  promptThoughts,
} from "../lib/ai";
import { uid } from "../lib/ids";
import { defaultViewport, placeAround } from "../lib/layout";
import { AiError, type AppSettings, type PendingAiAction, type Project, type Thought, type ThoughtDraft, type Toast } from "../types";
import { IconCanvas, IconGear, IconHelp, IconNotes, IconSearch, IconSend, IconSpark } from "../icons";
import { CanvasBoard } from "./CanvasBoard";
import { ErrorBanner, HelpModal, NotesModal, ProjectsModal, SeedModal, SettingsModal } from "./Modals";

type Modal = "settings" | "projects" | "help" | "seed" | "notes" | null;
type PromptMode = "branch" | "ask" | "free";

function selectedThoughts(project: Project, ids: string[]): Thought[] {
  return project.thoughts.filter((t) => ids.includes(t.id));
}

export function Workspace({
  settings,
  apiKey,
  projects,
  activeId,
  onSettings,
  onKey,
  onForget,
  onProjects,
  onActive,
  onLock,
}: {
  settings: AppSettings;
  apiKey: string;
  projects: Project[];
  activeId: string | null;
  onSettings: (patch: Partial<AppSettings>) => void;
  onKey: (key: string) => void;
  onForget: () => void;
  onProjects: (projects: Project[]) => void;
  onActive: (id: string | null) => void;
  onLock: () => void;
}) {
  const project = projects.find((p) => p.id === activeId) ?? null;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Modal>(project ? null : "seed");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<PromptMode>("free");
  const [generating, setGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<{ error: AiError; action: PendingAiAction } | null>(null);
  const [mobileInspect, setMobileInspect] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!project) setModal((m) => (m ? m : "seed"));
  }, [project]);

  function toast(message: string, tone: Toast["tone"] = "info") {
    const id = uid("toast");
    setToasts((prev) => [...prev.slice(-3), { id, tone, message }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }

  function patchProject(id: string, updater: (p: Project) => Project) {
    onProjects(
      projects.map((p) => (p.id === id ? { ...updater(p), updatedAt: Date.now() } : p)),
    );
  }

  function updateActive(updater: (p: Project) => Project) {
    if (!project) return;
    patchProject(project.id, updater);
  }

  function createProject(name: string, seed: string) {
    const id = uid("proj");
    const thought: Thought = {
      id: uid("th"),
      kind: "seed",
      title: seed ? seed.split(/[.!?]/)[0]!.slice(0, 60) || "Seed" : "New seed",
      body: seed || "Double-click to write the idea you want to explore.",
      x: 0,
      y: 0,
      parentIds: [],
      createdAt: Date.now(),
      source: "user",
    };
    const next: Project = {
      id,
      name,
      notes: "",
      thoughts: [thought],
      viewport: defaultViewport(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onProjects([next, ...projects]);
    onActive(id);
    setSelectedIds([thought.id]);
    setModal(null);
  }

  function duplicateProject(id: string) {
    const src = projects.find((p) => p.id === id);
    if (!src) return;
    const copy: Project = {
      ...src,
      id: uid("proj"),
      name: `${src.name} copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onProjects([copy, ...projects]);
    toast("Duplicated project", "ok");
  }

  function deleteProject(id: string) {
    const next = projects.filter((p) => p.id !== id);
    onProjects(next);
    if (activeId === id) {
      onActive(next[0]?.id ?? null);
      setSelectedIds([]);
    }
  }

  function onSelect(id: string, additive: boolean) {
    if (!id) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((prev) => {
      if (additive) {
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return [id];
    });
  }

  function addDrafts(drafts: ThoughtDraft[], parents: Thought[], source: Thought["source"]) {
    if (!project) return;
    const created: Thought[] = [];
    const existing = [...project.thoughts];
    drafts.forEach((d, i) => {
      const origin = parents[0] ?? { x: 40, y: 40, id: "" } as Thought;
      const pos = parents[0]
        ? placeAround(origin, i, drafts.length, [...existing, ...created])
        : { x: origin.x + i * 280, y: origin.y + 200 };
      created.push({
        id: uid("th"),
        kind: d.kind,
        title: d.title,
        body: d.body,
        x: pos.x,
        y: pos.y,
        parentIds: parents.map((p) => p.id),
        createdAt: Date.now(),
        source,
      });
    });
    updateActive((p) => ({ ...p, thoughts: [...p.thoughts, ...created] }));
    setSelectedIds(created.map((c) => c.id));
  }

  async function runAction(action: PendingAiAction, useDemo = false) {
    if (!project) return;
    if (generating) return;
    const parents = selectedThoughts(project, action.thoughtIds.length ? action.thoughtIds : selectedIds);
    const key = apiKey.trim();
    if (!useDemo && !key) {
      toast("Add an API key in Settings first.", "warn");
      setModal("settings");
      return;
    }
    setGenerating(true);
    setPending(null);
    try {
      if (useDemo) {
        const kind =
          action.kind === "challenge" ? "question" :
          action.kind === "merge" ? "merge" :
          action.kind === "compose" ? "brief" : "idea";
        addDrafts(demoDrafts(kind, parents[0]?.title || project.name), parents, "demo");
        toast("Added a demo thought. It is marked so you can tell it apart.", "warn");
        return;
      }
      let drafts: ThoughtDraft[] = [];
      if (action.kind === "expand") {
        if (!parents[0]) throw new AiError("Select a thought to branch from.", "unknown");
        drafts = await expandThought(settings, key, parents[0], action.prompt);
      } else if (action.kind === "challenge") {
        if (!parents[0]) throw new AiError("Select a thought to challenge.", "unknown");
        drafts = await challengeThought(settings, key, parents[0], action.prompt);
      } else if (action.kind === "merge") {
        if (parents.length < 2) throw new AiError("Select at least two thoughts to merge.", "unknown");
        drafts = [await mergeThoughts(settings, key, parents)];
      } else if (action.kind === "compose") {
        if (!project.thoughts.length) throw new AiError("The canvas is empty.", "unknown");
        drafts = [await composeProject(settings, key, project.thoughts, project.name)];
      } else {
        drafts = await promptThoughts(settings, key, action.prompt, parents);
      }
      addDrafts(drafts, parents, "ai");
      toast(`Added ${drafts.length} thought${drafts.length === 1 ? "" : "s"}.`, "ok");
    } catch (err) {
      const error = err instanceof AiError ? err : new AiError(err instanceof Error ? err.message : "Unknown error", "unknown");
      setPending({ error, action });
    } finally {
      setGenerating(false);
    }
  }

  function deleteSelected() {
    if (!project || !selectedIds.length) return;
    updateActive((p) => ({
      ...p,
      thoughts: p.thoughts
        .filter((t) => !selectedIds.includes(t.id))
        .map((t) => ({ ...t, parentIds: t.parentIds.filter((id) => !selectedIds.includes(id)) })),
    }));
    setSelectedIds([]);
  }

  function duplicateSelected() {
    if (!project) return;
    const copies = selectedThoughts(project, selectedIds).map((t) => ({
      ...t,
      id: uid("th"),
      x: t.x + 28,
      y: t.y + 28,
      createdAt: Date.now(),
      source: "user" as const,
    }));
    updateActive((p) => ({ ...p, thoughts: [...p.thoughts, ...copies] }));
    setSelectedIds(copies.map((c) => c.id));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement)?.tagName || "");
      if (e.key === "?" && !typing) {
        e.preventDefault();
        setModal("help");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submitPrompt();
        return;
      }
      if (typing) return;
      if (e.key === "n" || e.key === "N") {
        promptRef.current?.focus();
      } else if (e.key === "e" || e.key === "E") {
        void runAction({ kind: "expand", prompt: "", thoughtIds: selectedIds });
      } else if (e.key === "q" || e.key === "Q") {
        void runAction({ kind: "challenge", prompt: "", thoughtIds: selectedIds });
      } else if (e.key === "m" || e.key === "M") {
        void runAction({ kind: "merge", prompt: "", thoughtIds: selectedIds });
      } else if (e.key === "Escape") {
        setSelectedIds([]);
        setModal(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      } else if (e.key === "+" || e.key === "=") {
        if (project) updateActive((p) => ({ ...p, viewport: { ...p.viewport, zoom: Math.min(2.4, p.viewport.zoom * 1.1) } }));
      } else if (e.key === "-" || e.key === "_") {
        if (project) updateActive((p) => ({ ...p, viewport: { ...p.viewport, zoom: Math.max(0.35, p.viewport.zoom * 0.9) } }));
      } else if (e.key === "0") {
        if (project) updateActive((p) => ({ ...p, viewport: { ...p.viewport, zoom: 1 } }));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function submitPrompt() {
    const text = prompt.trim();
    if (!text && mode === "free") {
      toast("Write a prompt, or use Branch / Ask on a selected card.", "warn");
      return;
    }
    const kind = mode === "branch" ? "expand" : mode === "ask" ? "challenge" : "prompt";
    void runAction({ kind, prompt: text, thoughtIds: selectedIds });
    setPrompt("");
  }

  const selected = useMemo(
    () => (project ? selectedThoughts(project, selectedIds) : []),
    [project, selectedIds],
  );

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="brand" onClick={onLock} title="Lock and return to the welcome screen">
          <IconSpark />
          <b>Thoughtforge</b>
        </button>
        <div className="crumb">
          <button type="button" onClick={() => setModal("projects")}>Projects</button>
          <span className="sep">→</span>
          <button type="button" onClick={() => setModal("projects")}>
            {project?.name ?? "New project"}
          </button>
        </div>
        <div className="search-wrap">
          <IconSearch />
          <input
            className="search"
            placeholder="Filter thoughts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="top-actions">
          <button type="button" className="btn tiny ghost" onClick={() => setModal("seed")} disabled={generating}>
            New canvas
          </button>
          <button type="button" className="btn icon ghost" title="Settings" onClick={() => setModal("settings")}>
            <IconGear />
          </button>
        </div>
      </header>

      <div className="shell">
        <nav className="rail" aria-label="Workspace">
          <button type="button" className="active" title="Canvas">
            <IconCanvas />
            <small>Canvas</small>
          </button>
          <button type="button" title="Notes for this project" onClick={() => setModal("notes")}>
            <IconNotes />
            <small>Notes</small>
          </button>
          <button type="button" title="Help and shortcuts" onClick={() => setModal("help")}>
            <IconHelp />
            <small>Help</small>
          </button>
        </nav>

        <section className="stage">
          {project ? (
            <CanvasBoard
              project={project}
              selectedIds={selectedIds}
              query={query}
              generating={generating}
              onSelect={onSelect}
              onMove={(id, x, y) =>
                updateActive((p) => ({
                  ...p,
                  thoughts: p.thoughts.map((t) => (t.id === id ? { ...t, x, y } : t)),
                }))
              }
              onEdit={(id) => {
                setSelectedIds([id]);
                setMobileInspect(true);
              }}
              onViewport={(viewport) => updateActive((p) => ({ ...p, viewport }))}
            />
          ) : (
            <div className="canvas" />
          )}

          {pending && (
            <ErrorBanner
              error={pending.error}
              busy={generating}
              onRetry={() => void runAction(pending.action)}
              onDemo={() => void runAction(pending.action, true)}
              onSettings={() => setModal("settings")}
              onDismiss={() => setPending(null)}
            />
          )}

          <div className="dock">
            <textarea
              ref={promptRef}
              className="prompt"
              placeholder={
                mode === "branch"
                  ? "Optional direction for branching the selected thought…"
                  : mode === "ask"
                    ? "Optional angle for the challenge…"
                    : "Ask the canvas…  (⌘/Ctrl + Enter)"
              }
              value={prompt}
              disabled={generating}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="dock-actions">
              <div className="mode" role="tablist" aria-label="Prompt mode">
                <button type="button" className={mode === "branch" ? "on" : ""} onClick={() => setMode("branch")} title="Branch from selected thought">
                  Branch
                </button>
                <button type="button" className={mode === "ask" ? "on" : ""} onClick={() => setMode("ask")} title="Ask a question about the selected thought">
                  Ask
                </button>
                <button type="button" className={mode === "free" ? "on" : ""} onClick={() => setMode("free")} title="Free prompt">
                  Prompt
                </button>
              </div>
              <button
                type="button"
                className="btn icon copper"
                title="Send to the model"
                disabled={generating}
                onClick={submitPrompt}
              >
                {generating ? <span className="spinner" /> : <IconSend />}
              </button>
            </div>
          </div>
        </section>

        <aside className={`inspector ${mobileInspect ? "open-mobile" : ""}`}>
          <header>
            <h2>Thoughts</h2>
            <button type="button" className="btn tiny ghost" onClick={() => setMobileInspect(false)}>
              {selected.length ? `${selected.length} selected` : `${project?.thoughts.length ?? 0}`}
            </button>
          </header>
          {project && selected.length === 1 && (
            <div className="edit-block">
              <input
                value={selected[0].title}
                onChange={(e) =>
                  updateActive((p) => ({
                    ...p,
                    thoughts: p.thoughts.map((t) => (t.id === selected[0].id ? { ...t, title: e.target.value } : t)),
                  }))
                }
              />
              <textarea
                value={selected[0].body}
                onChange={(e) =>
                  updateActive((p) => ({
                    ...p,
                    thoughts: p.thoughts.map((t) => (t.id === selected[0].id ? { ...t, body: e.target.value } : t)),
                  }))
                }
              />
            </div>
          )}
          <div className="thought-list">
            {project?.thoughts.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`thought-row ${selectedIds.includes(t.id) ? "on" : ""}`}
                onClick={(e) => onSelect(t.id, e.shiftKey)}
              >
                <b>{t.title}</b>
                <span>{t.kind}{t.source === "demo" ? " · demo" : ""}</span>
              </button>
            ))}
            {!project?.thoughts.length && <div className="empty">No thoughts yet. Create a seed to begin.</div>}
          </div>
          <div className="inspector-actions">
            <button
              type="button"
              className="btn tiny copper"
              disabled={generating || selected.length !== 1}
              title="Branch from selected thought"
              onClick={() => void runAction({ kind: "expand", prompt: "", thoughtIds: selectedIds })}
            >
              Branch
            </button>
            <button
              type="button"
              className="btn tiny ghost"
              disabled={generating || selected.length !== 1}
              title="Ask a question about the selected thought"
              onClick={() => void runAction({ kind: "challenge", prompt: "", thoughtIds: selectedIds })}
            >
              Ask
            </button>
            <button
              type="button"
              className="btn tiny ghost"
              disabled={generating || selected.length < 2}
              title="Merge selected thoughts"
              onClick={() => void runAction({ kind: "merge", prompt: "", thoughtIds: selectedIds })}
            >
              Merge
            </button>
            <button
              type="button"
              className="btn tiny ghost"
              disabled={generating || !project?.thoughts.length}
              title="Compose a project brief"
              onClick={() => void runAction({ kind: "compose", prompt: "", thoughtIds: [] })}
            >
              Brief
            </button>
            <button type="button" className="btn tiny ghost" disabled={!selected.length} onClick={duplicateSelected}>
              Duplicate
            </button>
            <button type="button" className="btn tiny danger" disabled={!selected.length} onClick={deleteSelected}>
              Delete
            </button>
          </div>
        </aside>
      </div>

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>{t.message}</div>
        ))}
      </div>

      {modal === "settings" && (
        <SettingsModal
          settings={settings}
          apiKey={apiKey}
          onSettings={onSettings}
          onKey={onKey}
          onForget={() => {
            onForget();
            toast("Key forgotten on this device.", "ok");
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "projects" && (
        <ProjectsModal
          projects={projects}
          activeId={activeId}
          onOpen={(id) => {
            onActive(id);
            setSelectedIds([]);
            setModal(null);
          }}
          onCreate={() => setModal("seed")}
          onRename={(id, name) => patchProject(id, (p) => ({ ...p, name }))}
          onDuplicate={duplicateProject}
          onDelete={deleteProject}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "seed" && (
        <SeedModal
          title={project ? "New canvas" : "Name this canvas"}
          onCancel={() => {
            if (project) setModal(null);
          }}
          onCreate={createProject}
        />
      )}
      {modal === "help" && <HelpModal onClose={() => setModal(null)} />}
      {modal === "notes" && project && (
        <NotesModal
          notes={project.notes}
          onChange={(notes) => updateActive((p) => ({ ...p, notes }))}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
