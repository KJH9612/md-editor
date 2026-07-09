'use client';

import { useSearchStore } from './useSearchStore';
import { useT } from '@/components/useI18n';

export function SearchBox() {
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const caseSensitive = useSearchStore((s) => s.caseSensitive);
  const toggleCase = useSearchStore((s) => s.toggleCase);
  const t = useT();

  return (
    <div className="search-box">
      <div className="search-field">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')} title="×">
            ×
          </button>
        )}
      </div>
      <button
        className={`search-case${caseSensitive ? ' active' : ''}`}
        onClick={toggleCase}
        title={t('caseSensitive')}
        aria-pressed={caseSensitive}
      >
        Aa
      </button>
    </div>
  );
}
