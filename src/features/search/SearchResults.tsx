'use client';

import { useSearchStore } from './useSearchStore';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { Highlight } from './Highlight';
import { useT } from '@/components/useI18n';

export function SearchResults() {
  const query = useSearchStore((s) => s.query);
  const caseSensitive = useSearchStore((s) => s.caseSensitive);
  const results = useSearchStore((s) => s.results);
  const nodes = useTreeStore((s) => s.nodes);
  const openFile = useTreeStore((s) => s.openFile);
  const selectedFileId = useTreeStore((s) => s.selectedFileId);
  const t = useT();

  if (results.length === 0) {
    return <div className="tree-empty">{t('searchNoResult').replace('{q}', query)}</div>;
  }

  return (
    <ul className="search-results">
      {results.map((hit) => (
        <li
          key={hit.nodeId}
          className={`search-hit${selectedFileId === hit.nodeId ? ' selected' : ''}`}
          onClick={() => {
            const node = nodes.find((n) => n.id === hit.nodeId);
            if (node) void openFile(node);
          }}
        >
          <div className="search-hit-name">
            📄 <Highlight text={hit.name} query={query} caseSensitive={caseSensitive} />
          </div>
          {hit.snippet && (
            <div className="search-hit-snippet">
              <Highlight text={hit.snippet} query={query} caseSensitive={caseSensitive} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
