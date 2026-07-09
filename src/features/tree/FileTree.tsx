'use client';

import { useMemo } from 'react';
import { useTreeStore } from './useTreeStore';
import { buildTree } from './treeUtils';
import { TreeNode } from './TreeNode';
import { useT } from '@/components/useI18n';

export function FileTree() {
  const nodes = useTreeStore((s) => s.nodes);
  const loading = useTreeStore((s) => s.loading);
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const t = useT();

  if (loading) return <div className="tree-empty">{t('loading')}</div>;
  if (tree.length === 0)
    return (
      <div className="tree-empty">
        {t('treeEmpty1')}
        <br />
        {t('treeEmpty2')}
      </div>
    );

  return (
    <ul className="tree-root">
      {tree.map((item) => (
        <TreeNode key={item.id} item={item} depth={0} />
      ))}
    </ul>
  );
}
