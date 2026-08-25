import { useState } from "react";
import { getProvider, PROVIDERS } from "../lib/providers";
import { testConnection } from "../lib/ai";
import type { AiError, AppSettings, Project } from "../types";

export function SettingsModal({
  settings,
  apiKey,
  onSettings,
  onKey,
  onForget,
  onClose,
}: {
  settings: AppSettings;
  apiKey: string;
  onSettings: (patch: Partial<AppSettings>) => void;
  onKey: (key: string) => void;
  onForget: () => void;
  onClose: () => void;
}) {
  const provider = getProvider(settings.provider);
  const [status, setStatus] = useState("");
  const [tone, setTone] = useState<"ok" | "err" | "">("");
  const [busy, setBusy] = useState(false);

  async function test() {
    setBusy(true);
    setStatus("Testing…");
    setTone("");
    try {
      await testConnection(settings, apiKey.trim());
      setTone("ok");
      setStatus("Connection works.");
    } catch (err) {
      setTone("err");
      setStatus(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <p className="sub">Provider, model, and how this browser remembers your key.</p>

        <div className="providers">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`provider ${settings.provider === p.id ? "active" : ""}`}
              onClick={() => onSettings({
                provider: p.id,
                model: p.defaultModel,
              })}
            >
              <strong>{p.name}</strong>
              <span>{p.hint}</span>
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="set-key">API key</label>
          <input id="set-key" type="password" value={apiKey} onChange={(e) => onKey(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="set-model">Model</label>
          <select id="set-model" value={settings.model} onChange={(e) => onSettings({ model: e.target.value })}>
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="endpoint">Custom OpenAI-compatible endpoint (optional)</label>
          <input
            id="endpoint"
            placeholder="https://…"
            value={settings.customEndpoint}
            onChange={(e) => onSettings({ customEndpoint: e.target.value })}
          />
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={settings.rememberKey}
            onChange={(e) => onSettings({ rememberKey: e.target.checked })}
          />
          Remember key on this device
        </label>
        <p className="privacy">
          Leaving this unchecked keeps the key in memory only for this tab session.
        </p>
        <div className="row">
          <button type="button" className="btn copper" disabled={busy} onClick={test}>Test connection</button>
          <button type="button" className="btn danger" onClick={onForget}>Forget key</button>
          <button type="button" className="btn ghost" onClick={onClose}>Close</button>
          <span className={`status ${tone}`}>{status}</span>
        </div>
      </div>
    </div>
  );
}

export function ProjectsModal({
  projects,
  activeId,
  onOpen,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: {
  projects: Project[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Projects</h2>
        <p className="sub">Every canvas is stored locally in this browser.</p>
        <div className="project-list">
          {projects.length === 0 && <div className="empty">No projects yet.</div>}
          {projects.map((p) => (
            <div key={p.id} className={`project-row ${p.id === activeId ? "active" : ""}`}>
              <div>
                <input
                  className="inline-input"
                  value={p.name}
                  onChange={(e) => onRename(p.id, e.target.value)}
                />
                <div style={{ fontSize: 11, color: "var(--mist)", marginTop: 4 }}>
                  {p.thoughts.length} thoughts · updated {new Date(p.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="row">
                <button type="button" className="btn tiny" onClick={() => onOpen(p.id)}>Open</button>
                <button type="button" className="btn tiny ghost" onClick={() => onDuplicate(p.id)}>Duplicate</button>
                <button type="button" className="btn tiny danger" onClick={() => onDelete(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn copper" onClick={onCreate}>New canvas</button>
          <button type="button" className="btn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function SeedModal({
  title,
  onCancel,
  onCreate,
}: {
  title: string;
  onCancel: () => void;
  onCreate: (name: string, seed: string) => void;
}) {
  const [name, setName] = useState("Untitled project");
  const [seed, setSeed] = useState("");
  return (
    <div className="overlay">
      <div className="modal">
        <h2>{title}</h2>
        <p className="sub">Start from a seed idea. You can branch, challenge, and merge from there.</p>
        <div className="field">
          <label htmlFor="proj-name">Project name</label>
          <input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="seed">Seed idea</label>
          <textarea
            id="seed"
            rows={4}
            value={seed}
            placeholder="A neighborhood tool library that runs on group chats…"
            onChange={(e) => setSeed(e.target.value)}
          />
        </div>
        <div className="row">
          <button
            type="button"
            className="btn copper"
            onClick={() => onCreate(name.trim() || "Untitled project", seed.trim())}
          >
            Create canvas
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>How to forge</h2>
        <p className="sub">
          Select a card, then branch it, challenge it, or type a prompt. Merge two or more cards into a synthesis.
          Compose turns the whole canvas into a brief.
        </p>
        <div className="help-grid">
          <div><code>N</code> Focus the prompt</div>
          <div><code>E</code> Branch selected</div>
          <div><code>Q</code> Challenge selected</div>
          <div><code>M</code> Merge selected</div>
          <div><code>⌫</code> Delete selected</div>
          <div><code>Esc</code> Clear selection</div>
          <div><code>⌘/Ctrl + Enter</code> Send prompt</div>
          <div><code>+</code> / <code>-</code> Zoom</div>
          <div><code>0</code> Reset zoom</div>
          <div><code>?</code> This help</div>
          <div>Shift-click</div>
          <div>Add to selection</div>
          <div>Double-click card</div>
          <div>Edit in the side panel</div>
        </div>
        <div className="row" style={{ marginTop: 18 }}>
          <button type="button" className="btn" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export function NotesModal({
  notes,
  onChange,
  onClose,
}: {
  notes: string;
  onChange: (notes: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Notes</h2>
        <p className="sub">Scratch space for this project. Saved with the canvas.</p>
        <textarea className="notes-area" value={notes} onChange={(e) => onChange(e.target.value)} />
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

export function ErrorBanner({
  error,
  busy,
  onRetry,
  onDemo,
  onSettings,
  onDismiss,
}: {
  error: AiError;
  busy: boolean;
  onRetry: () => void;
  onDemo: () => void;
  onSettings: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      <h3>The model didn’t answer</h3>
      <p>{error.message}</p>
      <div className="row">
        <button type="button" className="btn copper" disabled={busy} onClick={onRetry}>Retry</button>
        <button type="button" className="btn ghost" disabled={busy} onClick={onDemo}>Use demo thought</button>
        <button type="button" className="btn ghost" onClick={onSettings}>Open settings</button>
        <button type="button" className="btn tiny ghost" onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  );
}
