import { useMemo, useState } from "react";
import { testConnection } from "../lib/ai";
import { getProvider, PROVIDERS } from "../lib/providers";
import type { AppSettings, ProviderId } from "../types";
import { IconSpark } from "../icons";

export function WelcomeScreen({
  settings,
  apiKey,
  onSettings,
  onKey,
  onReady,
}: {
  settings: AppSettings;
  apiKey: string;
  onSettings: (patch: Partial<AppSettings>) => void;
  onKey: (key: string) => void;
  onReady: () => void;
}) {
  const [status, setStatus] = useState<{ tone: "ok" | "err" | ""; text: string }>({ tone: "", text: "" });
  const [busy, setBusy] = useState(false);
  const provider = useMemo(() => getProvider(settings.provider), [settings.provider]);

  function selectProvider(id: ProviderId) {
    const next = getProvider(id);
    onSettings({
      provider: id,
      model: next.models.some((m) => m.id === settings.model) ? settings.model : next.defaultModel,
    });
    setStatus({ tone: "", text: "" });
  }

  async function test() {
    if (!apiKey.trim()) {
      setStatus({ tone: "err", text: "Paste an API key first." });
      return;
    }
    setBusy(true);
    setStatus({ tone: "", text: "Testing connection…" });
    try {
      await testConnection(settings, apiKey.trim());
      setStatus({ tone: "ok", text: `Connected to ${provider.name}.` });
    } catch (err) {
      setStatus({ tone: "err", text: err instanceof Error ? err.message : "Connection failed." });
    } finally {
      setBusy(false);
    }
  }

  function continueIn() {
    if (!apiKey.trim()) {
      setStatus({ tone: "err", text: "An API key is required to talk to a model." });
      return;
    }
    onReady();
  }

  return (
    <div className="welcome">
      <div className="welcome-card">
        <div className="mark" aria-hidden>
          <IconSpark width={36} height={36} />
        </div>
        <div className="eyebrow">Private by design</div>
        <h1>Thoughtforge</h1>
        <p className="lede">
          A local brainstorming canvas. Your key stays in this browser, thoughts live in local storage,
          and nothing is uploaded to us — there is no server.
        </p>

        <div className="providers">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`provider ${settings.provider === p.id ? "active" : ""}`}
              onClick={() => selectProvider(p.id)}
            >
              <strong>{p.name}</strong>
              <span>{p.hint}</span>
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="api-key">{provider.name} API key</label>
          <input
            id="api-key"
            type="password"
            autoComplete="off"
            placeholder={provider.keyPlaceholder}
            value={apiKey}
            onChange={(e) => onKey(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="model">Model</label>
          <select
            id="model"
            value={settings.model}
            onChange={(e) => onSettings({ model: e.target.value })}
          >
            {provider.models.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.rememberKey}
            onChange={(e) => onSettings({ rememberKey: e.target.checked })}
          />
          Remember this key on this device
        </label>

        <p className="privacy">
          Keys are stored in <code>localStorage</code> only if you opt in. Anyone with access to this
          browser profile can read them. Prefer OpenRouter if other providers block browser requests (CORS).
          {" "}
          <a href={provider.docs} target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>
            Get a {provider.name} key
          </a>
        </p>

        <div className="row">
          <button type="button" className="btn ghost" disabled={busy} onClick={test}>
            Test connection
          </button>
          <button type="button" className="btn copper" disabled={busy} onClick={continueIn}>
            Open the forge
          </button>
          <span className={`status ${status.tone}`}>{status.text}</span>
        </div>
      </div>
    </div>
  );
}
