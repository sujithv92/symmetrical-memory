import type { Thought } from "../types";

export const NODE_W = 252;
export const NODE_H = 148;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function defaultViewport(canvasW = 960, canvasH = 640) {
  return {
    zoom: 1,
    panX: canvasW / 2 - NODE_W / 2,
    panY: canvasH / 2 - 80,
  };
}

export function placeAround(
  parent: Thought,
  index: number,
  total: number,
  existing: Thought[],
): { x: number; y: number } {
  const radius = 280 + Math.floor(index / 4) * 40;
  const spread = Math.max(total, 3);
  const start = -Math.PI / 2.6;
  const step = (Math.PI * 1.15) / Math.max(spread - 1, 1);
  const angle = start + index * step;
  let x = parent.x + Math.cos(angle) * radius;
  let y = parent.y + Math.sin(angle) * radius + 40;

  for (let i = 0; i < 8; i++) {
    const hit = existing.some(
      (t) => Math.hypot(t.x - x, t.y - y) < 170,
    );
    if (!hit) break;
    x += 36;
    y += 48;
  }
  return { x, y };
}

export function curvePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const lift = Math.min(80, dist * 0.28);
  const c1x = x1 + dx * 0.35;
  const c1y = y1 + dy * 0.05 - lift;
  const c2x = x1 + dx * 0.65;
  const c2y = y2 - dy * 0.05 - lift * 0.35;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

export function nodeCenter(t: Thought, w = NODE_W, h = NODE_H) {
  return { x: t.x + w / 2, y: t.y + h / 2 };
}
