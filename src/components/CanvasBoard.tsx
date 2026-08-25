import { useEffect, useRef, useState, type PointerEvent } from "react";
import { curvePath, NODE_H, NODE_W } from "../lib/layout";
import type { Project, Thought, Viewport } from "../types";
import { IconMinus, IconPlus } from "../icons";

export function CanvasBoard({
  project,
  selectedIds,
  query,
  generating,
  onSelect,
  onMove,
  onEdit,
  onViewport,
}: {
  project: Project;
  selectedIds: string[];
  query: string;
  generating: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onMove: (id: string, x: number, y: number) => void;
  onEdit: (id: string) => void;
  onViewport: (viewport: Viewport) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Map<string, HTMLButtonElement>>(new Map());
  const viewportRef = useRef(project.viewport);
  const onViewportRef = useRef(onViewport);
  viewportRef.current = project.viewport;
  onViewportRef.current = onViewport;
  const [sizes, setSizes] = useState<Record<string, { w: number; h: number }>>({});
  const drag = useRef<{
    id: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const pan = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const vp = project.viewport;

  useEffect(() => {
    const next: Record<string, { w: number; h: number }> = {};
    for (const [id, el] of nodeEls.current) {
      next[id] = { w: el.offsetWidth, h: el.offsetHeight };
    }
    setSizes(next);
  }, [project.thoughts]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handle = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      const rect = el.getBoundingClientRect();
      const nextZoom = Math.min(2.4, Math.max(0.35, vp.zoom * factor));
      const wx = (e.clientX - rect.left - vp.panX) / vp.zoom;
      const wy = (e.clientY - rect.top - vp.panY) / vp.zoom;
      onViewport({
        zoom: nextZoom,
        panX: e.clientX - rect.left - wx * nextZoom,
        panY: e.clientY - rect.top - wy * nextZoom,
      });
    };
    el.addEventListener("wheel", handle, { passive: false });
    return () => el.removeEventListener("wheel", handle);
  }, [vp, onViewport]);

  function clientToWorld(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - vp.panX) / vp.zoom,
      y: (clientY - rect.top - vp.panY) / vp.zoom,
    };
  }

  function onNodePointerDown(e: PointerEvent<HTMLButtonElement>, thought: Thought) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(thought.id, e.shiftKey || e.metaKey || e.ctrlKey);
    drag.current = { id: thought.id, sx: e.clientX, sy: e.clientY, ox: thought.x, oy: thought.y };
  }

  function onNodePointerMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.id !== e.currentTarget.dataset.id) return;
    const x = d.ox + (e.clientX - d.sx) / vp.zoom;
    const y = d.oy + (e.clientY - d.sy) / vp.zoom;
    onMove(d.id, x, y);
  }

  function onNodePointerUp() {
    drag.current = null;
  }

  function onCanvasPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.button !== 1) return;
    if ((e.target as HTMLElement).closest(".node")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pan.current = { sx: e.clientX, sy: e.clientY, ox: vp.panX, oy: vp.panY };
    setPanning(true);
    onSelect("", false);
  }

  function onCanvasPointerMove(e: PointerEvent<HTMLDivElement>) {
    const p = pan.current;
    if (!p) return;
    onViewport({
      ...vp,
      panX: p.ox + (e.clientX - p.sx),
      panY: p.oy + (e.clientY - p.sy),
    });
  }

  function onCanvasPointerUp() {
    pan.current = null;
    setPanning(false);
  }

  function zoomAt(nextZoom: number, cx: number, cy: number) {
    const z = Math.min(2.4, Math.max(0.35, nextZoom));
    const world = clientToWorld(cx, cy);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    onViewport({
      zoom: z,
      panX: cx - rect.left - world.x * z,
      panY: cy - rect.top - world.y * z,
    });
  }



  const q = query.trim().toLowerCase();
  const match = (t: Thought) =>
    !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q) || t.kind.includes(q);

  const centers = new Map<string, { x: number; y: number }>();
  for (const t of project.thoughts) {
    const s = sizes[t.id];
    centers.set(t.id, {
      x: t.x + (s?.w ?? NODE_W) / 2,
      y: t.y + (s?.h ?? NODE_H) / 2,
    });
  }

  return (
    <div
      ref={canvasRef}
      className={`canvas ${panning ? "panning" : ""}`}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onPointerCancel={onCanvasPointerUp}
    >
      <div
        className="world"
        style={{ transform: `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.zoom})` }}
      >
        <svg className="connectors" width="1" height="1">
          {project.thoughts.flatMap((t) =>
            t.parentIds.map((pid) => {
              const a = centers.get(pid);
              const b = centers.get(t.id);
              if (!a || !b) return null;
              const parent = project.thoughts.find((x) => x.id === pid);
              const dim = Boolean(q && parent && !(match(parent) && match(t)));
              return (
                <path
                  key={`${pid}-${t.id}`}
                  d={curvePath(a.x, a.y, b.x, b.y)}
                  className={`${dim ? "dim" : ""} ${t.kind === "merge" || t.kind === "brief" ? "merge" : ""}`}
                />
              );
            }),
          )}
        </svg>

        {project.thoughts.map((t) => (
          <button
            key={t.id}
            type="button"
            data-id={t.id}
            ref={(el) => {
              if (el) nodeEls.current.set(t.id, el);
              else nodeEls.current.delete(t.id);
            }}
            className={[
              "node",
              t.kind,
              t.source === "demo" ? "demo" : "",
              selectedIds.includes(t.id) ? "selected" : "",
              q && !match(t) ? "dim" : "",
              drag.current?.id === t.id ? "dragging" : "",
            ].join(" ")}
            style={{ left: t.x, top: t.y }}
            onPointerDown={(e) => onNodePointerDown(e, t)}
            onPointerMove={onNodePointerMove}
            onPointerUp={onNodePointerUp}
            onDoubleClick={() => onEdit(t.id)}
          >
            <header>
              <span className="chip">{t.kind}</span>
              {t.source === "demo" && <span className="chip">Demo</span>}
            </header>
            <h3>{t.title}</h3>
            <p>{t.body}</p>
          </button>
        ))}
      </div>

      <div className="zoom-hud" aria-label="Zoom">
        <button type="button" title="Zoom out" onClick={() => zoomAt(vp.zoom * 0.9, window.innerWidth / 2, window.innerHeight / 2)}>
          <IconMinus />
        </button>
        <button type="button" title="Reset zoom" onClick={() => onViewport({ ...vp, zoom: 1 })}>
          {Math.round(vp.zoom * 100)}%
        </button>
        <button type="button" title="Zoom in" onClick={() => zoomAt(vp.zoom * 1.1, window.innerWidth / 2, window.innerHeight / 2)}>
          <IconPlus />
        </button>
      </div>
      <div className="hint">
        {generating ? "Forging…" : q ? "Filtered view — unmatched cards are faded" : "Drag cards · drag canvas to pan · scroll to zoom"}
      </div>
    </div>
  );
}
