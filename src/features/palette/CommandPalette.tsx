'use client';

import { useMemo, useState } from 'react';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { useRecent } from '@/features/library/useRecent';
import { useT } from '@/components/useI18n';
import type { FsNode } from '@/types/models';

interface Props {
  onClose: () => void;
}

/** 파일의 부모 폴더 경로 문자열. */
function pathOf(node: FsNode, byId: Map<string, FsNode>): string {
  const parts: string[] = [];
  let cur = node.parentId;
  while (cur) {
    const p = byId.get(cur);
    if (!p) break;
    parts.unshift(p.name);
    cur = p.parentId;
  }
  return parts.join(' / ');
}

export function CommandPalette({ onClose }: Props) {
  const nodes = useTreeStore((s) => s.nodes);
  const openFile = useTreeStore((s) => s.openFile);
  const recent = useRecent((s) => s.recent);
  const t = useT();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const files = nodes.filter((n) => n.type === 'file');
    if (!q) {
      // 검색어 없으면 최근 연 순으로 우선 정렬.
      const rank = new Map(recent.map((id, i) => [id, i]));
      return [...files]
        .sort((a, b) => {
          const ra = rank.has(a.id) ? rank.get(a.id)! : Infinity;
          const rb = rank.has(b.id) ? rank.get(b.id)! : Infinity;
          return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
        })
        .slice(0, 50);
    }
    return files
      .filter((f) => f.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 50);
  }, [nodes, query, recent]);

  const choose = (node: FsNode | undefined) => {
    if (!node) return;
    void openFile(node);
    onClose();
  };

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          className="palette-input"
          placeholder={t('palettePlaceholder')}
          value={query}
          autoFocus
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              choose(results[active]);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        />
        <ul className="palette-list">
          {results.length === 0 && <li className="palette-empty">{t('paletteEmpty')}</li>}
          {results.map((node, i) => {
            const path = pathOf(node, byId);
            return (
              <li
                key={node.id}
                className={`palette-item${i === active ? ' active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(node)}
              >
                <span className="palette-name">📄 {node.name}</span>
                {path && <span className="palette-path">{path}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
