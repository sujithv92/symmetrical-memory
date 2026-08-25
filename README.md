# Thoughtforge

A private, client-only AI brainstorming canvas. Thoughts live in your browser. There is no account, no database, and no backend of ours.

## What it does

- Drop a seed idea onto an infinite canvas
- Branch, challenge, merge, and compose with your own model key
- Drag cards, pan the board, and zoom
- Keep multiple projects, plus per-project notes
- Opt in before a key is written to `localStorage`

## Run locally

```bash
npm install
npm run dev
```

The Vite dev server binds to `0.0.0.0` so it works in preview environments.

```bash
npm run build
npm run preview
```

Static output is written to `dist/`. Any static host is enough.

## Providers

| Provider   | Notes |
|------------|--------|
| OpenRouter | Most reliable from the browser. Sends `HTTP-Referer` and `X-Title`. |
| OpenAI     | Direct chat completions. Some browsers block this with CORS. |
| Gemini     | Native `generateContent` endpoint. |
| Mistral    | Chat completions. CORS may apply. |

You can also set a custom OpenAI-compatible endpoint in Settings.

## Privacy

- API keys stay in memory unless you tick **Remember this key on this device**
- Projects are stored under `thoughtforge-projects`
- Settings live under `thoughtforge-settings`
- Use **Forget key** to wipe the stored secret

This is convenient, not a vault. Anyone with this browser profile can read `localStorage`.

## Keyboard

| Key | Action |
|-----|--------|
| `N` | Focus the prompt |
| `E` | Branch selected |
| `Q` | Challenge selected |
| `M` | Merge selected |
| `⌫` | Delete selected |
| `Esc` | Clear selection |
| `⌘/Ctrl + Enter` | Send prompt |
| `+` / `-` / `0` | Zoom |
| `?` | Help |

## Offline

The UI uses system fonts and does not load Google Fonts. Model calls still need the network.
