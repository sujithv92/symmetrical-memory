import { DEFAULT_SETTINGS } from "./providers";
import type { AppSettings, Project } from "../types";

const SETTINGS_KEY = "thoughtforge-settings";
const PROJECTS_KEY = "thoughtforge-projects";
const ACTIVE_KEY = "thoughtforge-active-project";
const KEY_STORE = "thoughtforge-key";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadKey(): string {
  return localStorage.getItem(KEY_STORE) ?? "";
}

export function saveKey(key: string, remember: boolean): void {
  if (remember && key.trim()) {
    localStorage.setItem(KEY_STORE, key.trim());
  } else {
    localStorage.removeItem(KEY_STORE);
  }
}

export function forgetKey(): void {
  localStorage.removeItem(KEY_STORE);
}

export function loadProjects(): Project[] {
  const projects = readJson<Project[]>(PROJECTS_KEY, []);
  return Array.isArray(projects) ? projects : [];
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveProjectId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}
