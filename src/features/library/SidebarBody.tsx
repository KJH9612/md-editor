'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchStore } from '@/features/search/useSearchStore';
import { SearchResults } from '@/features/search/SearchResults';
import { FileTree } from '@/features/tree/FileTree';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { useFavorites } from './useFavorites';
import { collectTags } from './tags';
import { useT } from '@/components/useI18n';

type View = 'tree' | 'favorites' | 'tags';

export function SidebarBody() {
  const searchActive = useSearchStore((s) => s.query.trim().length > 0);
  const nodes = useTreeStore((s) => s.nodes);
  const openFile = useTreeStore((s) => s.openFile);
  const favorites = useFavorites((s) => s.favorites);
  const [view, setView] = useState<View>('tree');
  const [tagMap, setTagMap] = useState<Map<string, string[]>>(new Map());
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    if (view !== 'tags') return;
    let cancelled = false;
    collectTags().then((m) => {
      if (!cancelled) setTagMap(m);
    });
    return () => {
      cancelled = true;
    };
  }, [view, nodes]);

  const fileById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const openById = (id: string) => {
    const n = fileById.get(id);
    if (n) void openFile(n);
  };

  if (searchActive) return <SearchResults />;

  const favFiles = [...favorites]
    .map((id) => fileById.get(id))
    .filter((n) => n && n.type === 'file');

  return (
    <>
      <div className="lib-toggle">
        <button
          className={view === 'favorites' ? 'active' : ''}
          onClick={() => {
            setView((v) => (v === 'favorites' ? 'tree' : 'favorites'));
            setTagFilter(null);
          }}
        >
          {t('favorites')}
        </button>
        <button
          className={view === 'tags' ? 'active' : ''}
          onClick={() => {
            setView((v) => (v === 'tags' ? 'tree' : 'tags'));
            setTagFilter(null);
          }}
        >
          {t('tags')}
        </button>
      </div>

      {view === 'tree' && <FileTree />}

      {view === 'favorites' &&
        (favFiles.length === 0 ? (
          <div className="tree-empty">
            {t('favEmpty1')}
            <br />
            {t('favEmpty2')}
          </div>
        ) : (
          <ul className="lib-list">
            {favFiles.map((n) => (
              <li key={n!.id} className="lib-item" onClick={() => openById(n!.id)}>
                ⭐ {n!.name}
              </li>
            ))}
          </ul>
        ))}

      {view === 'tags' && !tagFilter && (
        <ul className="lib-list">
          {tagMap.size === 0 && <li className="tree-empty">{t('tagEmpty')}</li>}
          {[...tagMap.keys()].sort().map((tag) => (
            <li key={tag} className="lib-item" onClick={() => setTagFilter(tag)}>
              # {tag} <span className="lib-count">{tagMap.get(tag)!.length}</span>
            </li>
          ))}
        </ul>
      )}

      {view === 'tags' && tagFilter && (
        <>
          <div className="lib-filter">
            <span># {tagFilter}</span>
            <button onClick={() => setTagFilter(null)}>{t('clear')}</button>
          </div>
          <ul className="lib-list">
            {(tagMap.get(tagFilter) ?? [])
              .map((id) => fileById.get(id))
              .filter(Boolean)
              .map((n) => (
                <li key={n!.id} className="lib-item" onClick={() => openById(n!.id)}>
                  📄 {n!.name}
                </li>
              ))}
          </ul>
        </>
      )}
    </>
  );
}
