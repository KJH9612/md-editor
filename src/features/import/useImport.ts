'use client';

import { useCallback } from 'react';
import { storage } from '@/storage';
import { useTreeStore } from '@/features/tree/useTreeStore';

/** 현재 선택 상태를 기준으로 import 대상 폴더 id를 계산. */
function resolveTargetParent(): string | null {
  const { nodes, selectedNodeId } = useTreeStore.getState();
  if (!selectedNodeId) return null;
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;
  return node.type === 'folder' ? node.id : node.parentId;
}

export function useImport() {
  const refresh = useTreeStore((s) => s.refresh);

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => /\.(md|markdown)$/i.test(f.name));
      if (list.length === 0) return;
      const parentId = resolveTargetParent();
      for (const file of list) {
        const content = await file.text();
        await storage.importFile(parentId, file.name, content);
      }
      await refresh();
    },
    [refresh]
  );

  return { importFiles };
}
