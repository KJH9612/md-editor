'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/storage';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { useT } from '@/components/useI18n';

function base(n: string): string {
  return n.replace(/\.(md|markdown)$/i, '').toLowerCase();
}

interface Props {
  fileId: string | null;
  name: string | null;
  onClose: () => void;
}

export function BacklinksPanel({ fileId, name, onClose }: Props) {
  const [links, setLinks] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const openFile = useTreeStore((s) => s.openFile);
  const nodes = useTreeStore((s) => s.nodes);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const target = base(name ?? '');
      const files = (await storage.listNodes()).filter((n) => n.type === 'file' && n.id !== fileId);
      const found: { id: string; name: string }[] = [];
      for (const f of files) {
        const content = await storage.readFile(f.id);
        const re = /\[\[([^\]]+)\]\]/g;
        let m: RegExpExecArray | null;
        let hit = false;
        while ((m = re.exec(content))) {
          if (base(m[1].split('|')[0].trim()) === target) {
            hit = true;
            break;
          }
        }
        if (hit) found.push({ id: f.id, name: f.name });
      }
      if (!cancelled) {
        setLinks(found);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId, name]);

  return (
    <div className="toc-panel">
      <div className="toc-header">
        <span>{t('backlinks')}</span>
        <button className="toc-close" onClick={onClose} title={t('close')}>
          ×
        </button>
      </div>
      {loading ? (
        <div className="toc-empty">{t('loading')}</div>
      ) : links.length === 0 ? (
        <div className="toc-empty">{t('backlinksEmpty')}</div>
      ) : (
        <ul className="toc-list">
          {links.map((l) => (
            <li
              key={l.id}
              className="toc-item"
              onClick={() => {
                const n = nodes.find((x) => x.id === l.id);
                if (n) void openFile(n);
              }}
            >
              📄 {l.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
