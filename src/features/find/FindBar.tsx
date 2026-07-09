'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  /** 렌더된 문서를 감싸는 스크롤 컨테이너. 내부의 .markdown-body에서 찾는다. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** 파일/내용이 바뀌면 재계산하기 위한 키. */
  contentKey: string | null;
  onClose: () => void;
}

/** 전체 텍스트에서 위치를 (텍스트노드, 오프셋)으로 되돌린다. */
function locate(pos: number, nodes: Text[], starts: number[]) {
  let i = 0;
  for (let k = 0; k < starts.length; k++) {
    if (starts[k] <= pos) i = k;
    else break;
  }
  return { node: nodes[i], offset: pos - starts[i] };
}

/** .markdown-body 안에서 query와 일치하는 모든 구간을 Range로 반환. */
function computeRanges(root: HTMLElement, query: string, caseSensitive: boolean): Range[] {
  const q = caseSensitive ? query : query.toLowerCase();
  if (!q) return [];

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  const starts: number[] = [];
  let full = '';
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    starts.push(full.length);
    nodes.push(t);
    full += t.data;
  }

  const hay = caseSensitive ? full : full.toLowerCase();
  const ranges: Range[] = [];
  let idx = 0;
  while ((idx = hay.indexOf(q, idx)) !== -1) {
    const s = locate(idx, nodes, starts);
    const e = locate(idx + q.length, nodes, starts);
    const range = document.createRange();
    try {
      range.setStart(s.node, s.offset);
      range.setEnd(e.node, e.offset);
      ranges.push(range);
    } catch {
      /* 경계 이슈는 무시 */
    }
    idx += q.length;
  }
  return ranges;
}

// CSS Custom Highlight API (타입 미보장 환경 대비 any 캐스팅)
/* eslint-disable @typescript-eslint/no-explicit-any */
function highlightRegistry(): any | null {
  const reg = (CSS as any)?.highlights;
  const H = (window as any)?.Highlight;
  return reg && H ? { reg, H } : null;
}

function clearHighlights() {
  const api = highlightRegistry();
  if (!api) return;
  api.reg.delete('find');
  api.reg.delete('find-current');
}

export function FindBar({ containerRef, contentKey, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const rangesRef = useRef<Range[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const applyCurrent = useCallback((cur: number) => {
    const api = highlightRegistry();
    if (!api) return;
    const ranges = rangesRef.current;
    api.reg.delete('find');
    api.reg.delete('find-current');
    if (!ranges.length) return;
    api.reg.set('find', new api.H(...ranges));
    const active = ranges[cur];
    if (active) {
      api.reg.set('find-current', new api.H(active));
      active.startContainer.parentElement?.scrollIntoView({
        block: 'center',
        inline: 'nearest',
      });
    }
  }, []);

  const recompute = useCallback(() => {
    const root = containerRef.current?.querySelector('.markdown-body') as HTMLElement | null;
    const ranges = root && query.trim() ? computeRanges(root, query, caseSensitive) : [];
    rangesRef.current = ranges;
    setCount(ranges.length);
    setCurrent(0);
    applyCurrent(0);
  }, [containerRef, query, caseSensitive, applyCurrent]);

  // 쿼리/문서 변경 시 재계산.
  useEffect(() => {
    recompute();
  }, [recompute, contentKey]);

  // 마운트 시 포커스, 언마운트 시 하이라이트 제거.
  useEffect(() => {
    inputRef.current?.focus();
    return () => clearHighlights();
  }, []);

  const go = (delta: number) => {
    const n = rangesRef.current.length;
    if (!n) return;
    const next = (current + delta + n) % n;
    setCurrent(next);
    applyCurrent(next);
  };

  return (
    <div className="find-bar">
      <input
        ref={inputRef}
        className="find-input"
        placeholder="문서 내 찾기"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            go(e.shiftKey ? -1 : 1);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <span className="find-count">
        {query.trim() ? `${count ? current + 1 : 0}/${count}` : ''}
      </span>
      <button
        className={`find-nav find-toggle${caseSensitive ? ' active' : ''}`}
        onClick={() => setCaseSensitive((v) => !v)}
        title="대소문자 구분"
        aria-pressed={caseSensitive}
      >
        Aa
      </button>
      <button className="find-nav" onClick={() => go(-1)} disabled={!count} title="이전(Shift+Enter)">
        ↑
      </button>
      <button className="find-nav" onClick={() => go(1)} disabled={!count} title="다음(Enter)">
        ↓
      </button>
      <button className="find-nav" onClick={onClose} title="닫기(Esc)">
        ×
      </button>
    </div>
  );
}
