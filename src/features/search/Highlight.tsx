import { Fragment } from 'react';

/** text에서 query와 일치하는 부분을 <mark>로 강조. */
export function Highlight({
  text,
  query,
  caseSensitive = false,
}: {
  text: string;
  query: string;
  caseSensitive?: boolean;
}) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const hay = caseSensitive ? text : text.toLowerCase();
  const ql = caseSensitive ? q : q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  for (;;) {
    const idx = hay.indexOf(ql, i);
    if (idx < 0) {
      parts.push(<Fragment key={key++}>{text.slice(i)}</Fragment>);
      break;
    }
    if (idx > i) parts.push(<Fragment key={key++}>{text.slice(i, idx)}</Fragment>);
    parts.push(<mark key={key++}>{text.slice(idx, idx + q.length)}</mark>);
    i = idx + q.length;
  }
  return <>{parts}</>;
}
