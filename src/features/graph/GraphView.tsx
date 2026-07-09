'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { useT } from '@/components/useI18n';
import { buildGraph, type GraphNode, type GraphEdge } from './graphData';

const W = 1000;
const H = 640;

interface Pos {
  x: number;
  y: number;
}

/** 간단한 force-directed 레이아웃 (Fruchterman–Reingold 근사). */
function layout(nodes: GraphNode[], edges: GraphEdge[]): Pos[] {
  const n = nodes.length;
  if (n === 0) return [];
  const R = Math.min(W, H) * 0.35;
  const pos: Pos[] = nodes.map((_, i) => ({
    x: W / 2 + Math.cos((2 * Math.PI * i) / n) * R,
    y: H / 2 + Math.sin((2 * Math.PI * i) / n) * R,
  }));
  const idx = new Map(nodes.map((nd, i) => [nd.id, i]));
  const k = Math.sqrt((W * H) / n) * 0.5;
  const iters = 300;
  for (let it = 0; it < iters; it++) {
    const disp = pos.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        const d = Math.hypot(dx, dy) || 0.01;
        const rep = (k * k) / d;
        dx /= d;
        dy /= d;
        disp[i].x += dx * rep;
        disp[i].y += dy * rep;
        disp[j].x -= dx * rep;
        disp[j].y -= dy * rep;
      }
    }
    for (const e of edges) {
      const a = idx.get(e.source);
      const b = idx.get(e.target);
      if (a == null || b == null) continue;
      let dx = pos[a].x - pos[b].x;
      let dy = pos[a].y - pos[b].y;
      const d = Math.hypot(dx, dy) || 0.01;
      const att = (d * d) / k;
      dx /= d;
      dy /= d;
      disp[a].x -= dx * att;
      disp[a].y -= dy * att;
      disp[b].x += dx * att;
      disp[b].y += dy * att;
    }
    const t = 1 - it / iters;
    for (let i = 0; i < n; i++) {
      disp[i].x += (W / 2 - pos[i].x) * 0.03;
      disp[i].y += (H / 2 - pos[i].y) * 0.03;
      const dl = Math.hypot(disp[i].x, disp[i].y) || 0.01;
      const step = Math.min(dl, 18 * t + 1);
      pos[i].x = Math.max(30, Math.min(W - 30, pos[i].x + (disp[i].x / dl) * step));
      pos[i].y = Math.max(30, Math.min(H - 30, pos[i].y + (disp[i].y / dl) * step));
    }
  }
  return pos;
}

export function GraphView({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const openFile = useTreeStore((s) => s.openFile);
  const nodes = useTreeStore((s) => s.nodes);
  const t = useT();

  useEffect(() => {
    let c = false;
    buildGraph().then((g) => {
      if (!c) setData(g);
    });
    return () => {
      c = true;
    };
  }, []);

  const pos = useMemo(() => (data ? layout(data.nodes, data.edges) : []), [data]);

  const open = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (node) {
      void openFile(node);
      onClose();
    }
  };

  return (
    <div className="graph-overlay">
      <div className="graph-header">
        <span>
          {t('graph')}{' '}
          {data && `· ${t('graphDocs')} ${data.nodes.length} · ${t('graphEdges')} ${data.edges.length}`}
        </span>
        <button className="toc-close" onClick={onClose} title={t('close')}>
          ×
        </button>
      </div>
      <div className="graph-body">
        {!data ? (
          <div className="graph-empty">{t('loading')}</div>
        ) : data.nodes.length === 0 ? (
          <div className="graph-empty">{t('graphNone')}</div>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} className="graph-svg" preserveAspectRatio="xMidYMid meet">
            {data.edges.map((e, i) => {
              const a = data.nodes.findIndex((n) => n.id === e.source);
              const b = data.nodes.findIndex((n) => n.id === e.target);
              if (a < 0 || b < 0) return null;
              return (
                <line
                  key={i}
                  x1={pos[a].x}
                  y1={pos[a].y}
                  x2={pos[b].x}
                  y2={pos[b].y}
                  className="graph-edge"
                />
              );
            })}
            {data.nodes.map((nd, i) => (
              <g key={nd.id} className="graph-node" onClick={() => open(nd.id)}>
                <circle cx={pos[i].x} cy={pos[i].y} r={7} />
                <text x={pos[i].x} y={pos[i].y - 11} textAnchor="middle">
                  {nd.name.replace(/\.(md|markdown)$/i, '')}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
