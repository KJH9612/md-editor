'use client';

import { useEffect, useMemo, useRef } from 'react';
import { render } from './renderer';
import { storage } from '@/storage';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { useTheme } from '@/components/useTheme';
import { useT } from '@/components/useI18n';

interface Props {
  content: string | null;
  title: string | null;
}

function baseName(name: string): string {
  return name.replace(/\.(md|markdown)$/i, '').toLowerCase();
}

let mermaidSeq = 0;

export function MarkdownViewer({ content, title }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const theme = useTheme((s) => s.theme);
  const t = useT();
  const html = useMemo(() => (content == null ? '' : render(content)), [content]);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    const created: string[] = [];
    let cancelled = false;

    // 위키링크: 존재하지 않는 대상은 broken 표시.
    const nodes = useTreeStore.getState().nodes;
    const fileByName = new Map(
      nodes.filter((n) => n.type === 'file').map((n) => [baseName(n.name), n])
    );
    root.querySelectorAll('a.wikilink').forEach((a) => {
      const target = (a.getAttribute('data-target') ?? '').replace(/\.(md|markdown)$/i, '').toLowerCase();
      if (!fileByName.has(target)) a.classList.add('broken');
    });

    // 위키링크 클릭 → 해당 파일 열기.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a.wikilink');
      if (!a) return;
      e.preventDefault();
      const target = (a.getAttribute('data-target') ?? '').replace(/\.(md|markdown)$/i, '').toLowerCase();
      const node = useTreeStore.getState().nodes.find(
        (n) => n.type === 'file' && baseName(n.name) === target
      );
      if (node) void useTreeStore.getState().openFile(node);
    };
    root.addEventListener('click', onClick);

    (async () => {
      // asset 이미지 → objectURL
      for (const img of Array.from(root.querySelectorAll<HTMLImageElement>('img[data-asset-id]'))) {
        const id = img.getAttribute('data-asset-id');
        if (!id) continue;
        const asset = await storage.readAsset(id);
        if (cancelled) return;
        if (asset) {
          const url = URL.createObjectURL(asset.blob);
          created.push(url);
          img.src = url;
        } else {
          img.alt = '(이미지 없음)';
        }
      }

      // Mermaid 다이어그램
      const blocks = Array.from(root.querySelectorAll<HTMLElement>('.mermaid-block'));
      if (blocks.length) {
        try {
          const mermaid = (await import('mermaid')).default;
          if (cancelled) return;
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            theme: theme === 'dark' ? 'dark' : 'default',
          });
          for (const el of blocks) {
            // 원본 소스를 JS 속성에 보관(첫 처리 시 textContent에서). 테마 재렌더에도 유지.
            const holder = el as HTMLElement & { __mmdSrc?: string };
            if (holder.__mmdSrc === undefined) holder.__mmdSrc = el.textContent ?? '';
            const src = holder.__mmdSrc;
            try {
              const { svg } = await mermaid.render(`mmd-${mermaidSeq++}`, src);
              if (cancelled) return;
              el.innerHTML = svg;
            } catch (err) {
              el.innerHTML = `<pre class="mermaid-error">Mermaid 오류: ${String(err)}</pre>`;
            }
          }
        } catch {
          /* mermaid 로드 실패 무시 */
        }
      }
    })();

    return () => {
      cancelled = true;
      root.removeEventListener('click', onClick);
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [html, theme]);

  if (content == null) {
    return (
      <div className="viewer-empty">
        <p>{t('viewerEmpty')}</p>
      </div>
    );
  }

  return (
    <article className="viewer">
      {title && <div className="viewer-title">{title}</div>}
      <div className="markdown-body" ref={bodyRef} dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
