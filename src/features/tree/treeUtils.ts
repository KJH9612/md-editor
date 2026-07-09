import type { FsNode } from '@/types/models';

export interface TreeItem extends FsNode {
  children: TreeItem[];
}

/** 트리 내부 노드 드래그를 식별하는 dataTransfer 타입. */
export const NODE_DRAG_TYPE = 'application/x-mdviewer-node';

/** dataTransfer에서 드래그된 노드 id 목록을 읽는다 (JSON 배열, 구형 단일값 호환). */
export function readDragIds(dt: DataTransfer): string[] {
  const raw = dt.getData(NODE_DRAG_TYPE);
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as string[]) : [raw];
  } catch {
    return [raw];
  }
}

/** 펼침 상태를 반영한 화면 표시 순서의 노드 id 목록 (Shift 범위 선택용). */
export function flattenVisible(nodes: FsNode[], expanded: Set<string>): string[] {
  const out: string[] = [];
  const walk = (items: TreeItem[]) => {
    for (const it of items) {
      out.push(it.id);
      if (it.type === 'folder' && expanded.has(it.id)) walk(it.children);
    }
  };
  walk(buildTree(nodes));
  return out;
}

/** candidateId가 ancestorId 자기 자신이거나 그 하위(자손)인지. 순환 이동 방지용. */
export function isSelfOrDescendant(
  nodes: FsNode[],
  candidateId: string | null,
  ancestorId: string
): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur: string | null = candidateId;
  while (cur) {
    if (cur === ancestorId) return true;
    cur = byId.get(cur)?.parentId ?? null;
  }
  return false;
}

/** 평면 노드 리스트를 parentId 기준 트리로 조립. 폴더 우선, 이름 순 정렬. */
export function buildTree(nodes: FsNode[]): TreeItem[] {
  const byId = new Map<string, TreeItem>();
  for (const n of nodes) byId.set(n.id, { ...n, children: [] });

  const roots: TreeItem[] = [];
  for (const item of byId.values()) {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  }

  const sortRec = (list: TreeItem[]) => {
    list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const it of list) sortRec(it.children);
  };
  sortRec(roots);
  return roots;
}
