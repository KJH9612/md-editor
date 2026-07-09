'use client';

import { useState } from 'react';
import { storage } from '@/storage';
import { promptDialog, confirmDialog } from '@/components/dialog';
import { useTreeStore } from './useTreeStore';
import { useFavorites } from '@/features/library/useFavorites';
import { useT, tr } from '@/components/useI18n';
import { NODE_DRAG_TYPE, readDragIds, type TreeItem } from './treeUtils';

interface Props {
  item: TreeItem;
  depth: number;
}

export function TreeNode({ item, depth }: Props) {
  const expanded = useTreeStore((s) => s.expanded.has(item.id));
  const isSelected = useTreeStore((s) => s.selectedIds.has(item.id));
  const toggleExpand = useTreeStore((s) => s.toggleExpand);
  const selectNode = useTreeStore((s) => s.selectNode);
  const toggleSelect = useTreeStore((s) => s.toggleSelect);
  const rangeSelect = useTreeStore((s) => s.rangeSelect);
  const openFile = useTreeStore((s) => s.openFile);
  const refresh = useTreeStore((s) => s.refresh);
  const moveNodes = useTreeStore((s) => s.moveNodes);
  const isFav = useFavorites((s) => s.favorites.has(item.id));
  const toggleFav = useFavorites((s) => s.toggle);
  const t = useT();

  const [dropTarget, setDropTarget] = useState(false);

  const isFolder = item.type === 'folder';
  // 드롭 시 이동될 부모: 폴더면 그 안으로, 파일이면 그 파일의 부모로(형제 배치).
  const dropParentId = isFolder ? item.id : item.parentId;

  const onClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      toggleSelect(item.id); // 다중 선택 토글 (열기/펼치기 안 함)
      return;
    }
    if (e.shiftKey) {
      rangeSelect(item.id); // 범위 선택
      return;
    }
    selectNode(item.id);
    if (isFolder) toggleExpand(item.id);
    else void openFile(item);
  };

  const onRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = await promptDialog(tr('renameTitle'), item.name);
    if (name && name.trim()) {
      await storage.rename(item.id, name.trim());
      await refresh();
    }
  };

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = tr(isFolder ? 'deleteFolderMsg' : 'deleteFileMsg').replace('{name}', item.name);
    const ok = await confirmDialog(tr('deleteTitle'), msg, { okLabel: tr('delete'), danger: true });
    if (ok) {
      await storage.delete(item.id);
      await refresh();
    }
  };

  const onDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    const { selectedIds } = useTreeStore.getState();
    // 이 노드가 다중 선택에 포함돼 있으면 선택 전체를, 아니면 이 노드만 이동.
    const ids =
      selectedIds.has(item.id) && selectedIds.size > 1 ? [...selectedIds] : [item.id];
    e.dataTransfer.setData(NODE_DRAG_TYPE, JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(NODE_DRAG_TYPE)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(true);
  };

  const onDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(NODE_DRAG_TYPE)) return;
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(false);
    const ids = readDragIds(e.dataTransfer);
    if (ids.length) void moveNodes(ids, dropParentId);
  };

  return (
    <li>
      <div
        className={`tree-row${isSelected ? ' selected' : ''}${dropTarget ? ' drop-target' : ''}`}
        style={{ paddingLeft: depth * 14 + 8 }}
        onClick={onClick}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={() => setDropTarget(false)}
        onDrop={onDrop}
      >
        <span className="tree-icon">
          {isFolder ? (expanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="tree-name">{item.name}</span>
        {!isFolder && (
          <button
            className={`tree-fav${isFav ? ' on' : ''}`}
            title={t('favTitle')}
            onClick={(e) => {
              e.stopPropagation();
              toggleFav(item.id);
            }}
          >
            {isFav ? '★' : '☆'}
          </button>
        )}
        <span className="tree-actions">
          <button title={t('renameTitle')} onClick={onRename}>✎</button>
          <button title={t('delete')} onClick={onDelete}>🗑</button>
        </span>
      </div>
      {isFolder && expanded && item.children.length > 0 && (
        <ul>
          {item.children.map((child) => (
            <TreeNode key={child.id} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
