'use client';

import { useMemo } from 'react';
import { extractHeadings } from '@/features/viewer/renderer';
import { useT } from '@/components/useI18n';

interface Props {
  content: string | null;
  /** 스크롤 대상 컨테이너 (제목 요소를 찾아 스크롤). */
  containerRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function OutlinePanel({ content, containerRef, onClose }: Props) {
  const headings = useMemo(() => (content ? extractHeadings(content) : []), [content]);
  const t = useT();

  const goto = (id: string) => {
    const root = containerRef.current;
    if (!root) return;
    const el = root.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div className="toc-panel">
      <div className="toc-header">
        <span>{t('toc')}</span>
        <button className="toc-close" onClick={onClose} title={t('close')}>
          ×
        </button>
      </div>
      {headings.length === 0 ? (
        <div className="toc-empty">{t('tocEmpty')}</div>
      ) : (
        <ul className="toc-list">
          {headings.map((h, i) => (
            <li
              key={`${h.id}-${i}`}
              className="toc-item"
              style={{ paddingLeft: (h.level - 1) * 12 + 10 }}
              onClick={() => goto(h.id)}
            >
              {h.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
