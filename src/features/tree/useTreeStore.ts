import { create } from 'zustand';
import { storage } from '@/storage';
import { isSelfOrDescendant, flattenVisible } from './treeUtils';
import type { FsNode } from '@/types/models';

export type ViewMode = 'view' | 'edit';

const AUTOSAVE_KEY = 'md-viewer:autoSave';
const SESSION_KEY = 'md-viewer:session';

function readAutoSave(): boolean {
  if (typeof window === 'undefined') return true; // 기본 켬
  return localStorage.getItem(AUTOSAVE_KEY) !== 'false';
}

interface SavedSession {
  tabs: { fileId: string; mode: ViewMode; draft?: string }[];
  activeId: string | null;
}

function readSession(): SavedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (s && Array.isArray(s.tabs)) return s as SavedSession;
  } catch {
    /* ignore */
  }
  return null;
}

// 최초 로드 시 한 번만 세션을 복원한다.
let sessionRestored = false;

/** 열린 문서 탭 하나. 각 탭이 자체 draft/dirty/mode를 유지. */
export interface Tab {
  fileId: string;
  title: string;
  content: string; // 저장된 본문
  draft: string; // 편집 버퍼
  dirty: boolean;
  mode: ViewMode;
}

/** 활성 탭 기준 미러 필드 (기존 컴포넌트가 그대로 참조). */
interface Mirror {
  selectedFileId: string | null;
  selectedContent: string | null;
  selectedTitle: string | null;
  draft: string;
  dirty: boolean;
  mode: ViewMode;
}

function mirror(tabs: Tab[], activeId: string | null): Mirror {
  const t = tabs.find((x) => x.fileId === activeId);
  if (!t) {
    return {
      selectedFileId: null,
      selectedContent: null,
      selectedTitle: null,
      draft: '',
      dirty: false,
      mode: 'view',
    };
  }
  return {
    selectedFileId: t.fileId,
    selectedContent: t.content,
    selectedTitle: t.title,
    draft: t.draft,
    dirty: t.dirty,
    mode: t.mode,
  };
}

interface TreeState extends Mirror {
  nodes: FsNode[];
  expanded: Set<string>;
  selectedNodeId: string | null; // 앵커(마지막 선택) — import/새 파일 대상 등
  selectedIds: Set<string>; // 다중 선택 집합
  loading: boolean;

  tabs: Tab[];
  activeId: string | null;
  autoSave: boolean;

  refresh: () => Promise<void>;
  toggleExpand: (id: string) => void;
  selectNode: (id: string) => void;
  toggleSelect: (id: string) => void; // Ctrl/⌘+클릭
  rangeSelect: (id: string) => void; // Shift+클릭
  openFile: (node: FsNode) => Promise<void>;
  setActiveTab: (fileId: string) => Promise<void>;
  closeTab: (fileId: string) => Promise<void>;
  reorderTabs: (draggedId: string, targetId: string) => void;
  setMode: (mode: ViewMode) => void;
  updateDraft: (text: string) => void;
  save: () => Promise<void>;
  applyExternalContent: (fileId: string, content: string) => Promise<void>;
  setAutoSave: (v: boolean) => void;
  moveNodes: (draggedIds: string[], targetParentId: string | null) => Promise<void>;
}

export const useTreeStore = create<TreeState>((set, get) => ({
  nodes: [],
  expanded: new Set(),
  selectedNodeId: null,
  selectedIds: new Set(),
  loading: true,

  tabs: [],
  activeId: null,
  autoSave: readAutoSave(),

  // 미러 초기값
  selectedFileId: null,
  selectedContent: null,
  selectedTitle: null,
  draft: '',
  dirty: false,
  mode: 'view',

  refresh: async () => {
    set({ loading: true });
    const nodes = await storage.listNodes();
    const files = new Set(nodes.filter((n) => n.type === 'file').map((n) => n.id));
    const nameById = new Map(nodes.map((n) => [n.id, n.name]));

    // 최초 로드 시 저장된 세션(열린 탭)을 복원.
    if (!sessionRestored) {
      sessionRestored = true;
      const sess = readSession();
      if (sess && get().tabs.length === 0 && sess.tabs.length) {
        const restored: Tab[] = [];
        for (const it of sess.tabs) {
          if (!files.has(it.fileId)) continue;
          const content = await storage.readFile(it.fileId);
          const draft = typeof it.draft === 'string' ? it.draft : content;
          restored.push({
            fileId: it.fileId,
            title: nameById.get(it.fileId) ?? '',
            content,
            draft,
            dirty: draft !== content, // 저장된 draft가 있으면 미저장 상태로 복원
            mode: it.mode === 'edit' ? 'edit' : 'view',
          });
        }
        if (restored.length) {
          const activeId = restored.some((t) => t.fileId === sess.activeId)
            ? sess.activeId
            : restored[restored.length - 1].fileId;
          set({ nodes, loading: false, tabs: restored, activeId, ...mirror(restored, activeId) });
          return;
        }
      }
    }

    // 삭제된 파일 탭 제거 + 이름 변경 반영.
    let tabs = get()
      .tabs.filter((t) => files.has(t.fileId))
      .map((t) => {
        const nm = nameById.get(t.fileId);
        return nm && nm !== t.title ? { ...t, title: nm } : t;
      });
    let activeId = get().activeId;
    if (activeId && !files.has(activeId)) {
      activeId = tabs.length ? tabs[tabs.length - 1].fileId : null;
    }
    set({ nodes, loading: false, tabs, activeId, ...mirror(tabs, activeId) });
  },

  toggleExpand: (id) => {
    const expanded = new Set(get().expanded);
    if (expanded.has(id)) expanded.delete(id);
    else expanded.add(id);
    set({ expanded });
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedIds: new Set([id]) }),

  toggleSelect: (id) => {
    const selectedIds = new Set(get().selectedIds);
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    set({ selectedIds, selectedNodeId: id });
  },

  rangeSelect: (id) => {
    const { nodes, expanded, selectedNodeId } = get();
    if (!selectedNodeId) {
      set({ selectedNodeId: id, selectedIds: new Set([id]) });
      return;
    }
    const order = flattenVisible(nodes, expanded);
    const a = order.indexOf(selectedNodeId);
    const b = order.indexOf(id);
    if (a === -1 || b === -1) {
      set({ selectedNodeId: id, selectedIds: new Set([id]) });
      return;
    }
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    set({ selectedIds: new Set(order.slice(lo, hi + 1)) });
  },

  openFile: async (node) => {
    if (node.type !== 'file') return;
    const already = get().tabs.some((t) => t.fileId === node.id);
    const content = already ? '' : await storage.readFile(node.id);
    const st = get();
    const outgoingId = st.activeId;
    const outgoing = st.tabs.find((t) => t.fileId === outgoingId);
    // 자동 저장 상태면 현재 활성 탭의 미저장분을 먼저 저장.
    if (st.autoSave && outgoing && outgoing.dirty && outgoingId !== node.id) {
      await storage.updateFile(outgoing.fileId, outgoing.draft);
    }
    // 함수형 set: 최신 tabs 기준으로 갱신해 동시 open 경쟁을 방지.
    set((s) => {
      let tabs = s.tabs;
      if (st.autoSave && outgoingId && outgoingId !== node.id) {
        tabs = tabs.map((t) =>
          t.fileId === outgoingId && t.dirty ? { ...t, content: t.draft, dirty: false } : t
        );
      }
      if (!tabs.some((t) => t.fileId === node.id)) {
        tabs = [
          ...tabs,
          { fileId: node.id, title: node.name, content, draft: content, dirty: false, mode: 'view' },
        ];
      }
      return {
        tabs,
        activeId: node.id,
        selectedNodeId: node.id,
        selectedIds: new Set([node.id]),
        ...mirror(tabs, node.id),
      };
    });
  },

  setActiveTab: async (fileId) => {
    const st = get();
    if (st.activeId === fileId) return;
    const outgoing = st.tabs.find((t) => t.fileId === st.activeId);
    if (st.autoSave && outgoing && outgoing.dirty) {
      await storage.updateFile(outgoing.fileId, outgoing.draft);
    }
    set((s) => {
      let tabs = s.tabs;
      if (outgoing && st.autoSave && outgoing.dirty) {
        tabs = tabs.map((t) =>
          t.fileId === outgoing.fileId ? { ...t, content: t.draft, dirty: false } : t
        );
      }
      return {
        tabs,
        activeId: fileId,
        selectedNodeId: fileId,
        selectedIds: new Set([fileId]),
        ...mirror(tabs, fileId),
      };
    });
  },

  closeTab: async (fileId) => {
    const st = get();
    const closing = st.tabs.find((t) => t.fileId === fileId);
    if (st.autoSave && closing && closing.dirty) {
      await storage.updateFile(fileId, closing.draft);
    }
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.fileId === fileId);
      const tabs = s.tabs.filter((t) => t.fileId !== fileId);
      let activeId = s.activeId;
      if (activeId === fileId) {
        const next = tabs[idx] ?? tabs[idx - 1] ?? null;
        activeId = next ? next.fileId : null;
      }
      return {
        tabs,
        activeId,
        selectedNodeId: activeId ?? s.selectedNodeId,
        ...mirror(tabs, activeId),
      };
    });
  },

  reorderTabs: (draggedId, targetId) =>
    set((s) => {
      if (draggedId === targetId) return {};
      const from = s.tabs.findIndex((t) => t.fileId === draggedId);
      if (from < 0) return {};
      const tabs = [...s.tabs];
      const [moved] = tabs.splice(from, 1);
      const insertAt = tabs.findIndex((t) => t.fileId === targetId);
      if (insertAt < 0) return {};
      tabs.splice(insertAt, 0, moved); // 대상 탭 앞에 삽입
      return { tabs };
    }),

  setMode: (mode) =>
    set((s) => ({
      mode,
      tabs: s.tabs.map((t) => (t.fileId === s.activeId ? { ...t, mode } : t)),
    })),

  updateDraft: (text) =>
    set((s) => ({
      draft: text,
      dirty: text !== s.selectedContent,
      tabs: s.tabs.map((t) =>
        t.fileId === s.activeId ? { ...t, draft: text, dirty: text !== t.content } : t
      ),
    })),

  save: async () => {
    const { activeId, tabs } = get();
    const tab = tabs.find((t) => t.fileId === activeId);
    if (!tab || !tab.dirty) return;
    await storage.updateFile(tab.fileId, tab.draft);
    void storage.addSnapshot(tab.fileId, tab.draft); // 버전 히스토리
    set((s) => ({
      selectedContent: tab.draft,
      dirty: false,
      tabs: s.tabs.map((t) =>
        t.fileId === activeId ? { ...t, content: t.draft, dirty: false } : t
      ),
    }));
  },

  // 버전 복원 등 외부에서 파일 내용을 교체 (열린 탭이면 미러도 갱신).
  applyExternalContent: async (fileId, content) => {
    await storage.updateFile(fileId, content);
    void storage.addSnapshot(fileId, content);
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.fileId === fileId ? { ...t, content, draft: content, dirty: false } : t
      ),
      ...(s.activeId === fileId
        ? { selectedContent: content, draft: content, dirty: false }
        : {}),
    }));
  },

  setAutoSave: (v) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTOSAVE_KEY, String(v));
    }
    set({ autoSave: v });
  },

  moveNodes: async (draggedIds, targetParentId) => {
    const { nodes } = get();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const set0 = new Set(draggedIds);

    // 선택된 다른 노드의 하위인 것은 제외 (상위 폴더와 함께 이동됨).
    const roots = draggedIds.filter((id) => {
      let cur = byId.get(id)?.parentId ?? null;
      while (cur) {
        if (set0.has(cur)) return false;
        cur = byId.get(cur)?.parentId ?? null;
      }
      return true;
    });

    let moved = false;
    for (const id of roots) {
      // 자기 자신 / 자기 하위 폴더로는 이동 불가 (순환 방지).
      if (id === targetParentId) continue;
      if (targetParentId && isSelfOrDescendant(nodes, targetParentId, id)) continue;
      const n = byId.get(id);
      if (!n) continue;
      // 이미 같은 부모면 무시.
      if ((n.parentId ?? null) === (targetParentId ?? null)) continue;
      await storage.move(id, targetParentId);
      moved = true;
    }

    if (!moved) return;
    // 이동한 대상 폴더를 펼쳐 결과가 보이게.
    if (targetParentId) {
      const expanded = new Set(get().expanded);
      expanded.add(targetParentId);
      set({ expanded });
    }
    await get().refresh();
  },
}));

// 탭 상태(열림·모드·미저장 draft)·활성 탭을 세션에 저장. 타이핑 대비 디바운스.
if (typeof window !== 'undefined') {
  let timer: ReturnType<typeof setTimeout> | undefined;
  useTreeStore.subscribe(() => {
    if (!sessionRestored) return; // 복원 완료 전에는 저장하지 않음 (덮어쓰기 방지)
    clearTimeout(timer);
    timer = setTimeout(() => {
      const s = useTreeStore.getState();
      try {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            tabs: s.tabs.map((t) => ({
              fileId: t.fileId,
              mode: t.mode,
              // 미저장 탭만 draft 저장 (저장된 탭은 내용을 저장소에서 다시 읽음).
              ...(t.dirty ? { draft: t.draft } : {}),
            })),
            activeId: s.activeId,
          })
        );
      } catch {
        /* 용량 초과 등은 무시 */
      }
    }, 500);
  });
}
