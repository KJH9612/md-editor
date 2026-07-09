import { create } from 'zustand';

const WIDTH_KEY = 'md-viewer:sidebarWidth';
const COLLAPSED_KEY = 'md-viewer:sidebarCollapsed';

export const SIDEBAR_MIN = 180;
export const SIDEBAR_MAX = 520;
const SIDEBAR_DEFAULT = 280;
/** 이 폭보다 좁아지면 사이드바를 자동 숨김(오버레이 모드). */
export const NARROW_BREAKPOINT = 700;

function readWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT;
  const v = Number(localStorage.getItem(WIDTH_KEY));
  return v >= SIDEBAR_MIN && v <= SIDEBAR_MAX ? v : SIDEBAR_DEFAULT;
}

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(COLLAPSED_KEY) === 'true';
}

function initialNarrow(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < NARROW_BREAKPOINT;
}

interface SidebarState {
  width: number;
  userCollapsed: boolean; // 넓은 화면에서 수동 숨김 (지속)
  narrow: boolean; // 창이 좁아 자동 숨김 대상
  narrowOpen: boolean; // 좁은 화면에서 오버레이를 열었는지
  setWidth: (w: number) => void;
  setNarrow: (n: boolean) => void;
  toggle: () => void;
  closeOverlay: () => void;
}

export const useSidebar = create<SidebarState>((set, get) => ({
  width: readWidth(),
  userCollapsed: readCollapsed(),
  narrow: initialNarrow(),
  narrowOpen: false,

  setWidth: (w) => {
    const width = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(w)));
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      /* ignore */
    }
    set({ width });
  },

  setNarrow: (narrow) => {
    if (narrow === get().narrow) return;
    // 좁아지는 순간 오버레이는 닫힌 상태로(자동 숨김).
    set({ narrow, narrowOpen: false });
  },

  toggle: () => {
    const { narrow, narrowOpen, userCollapsed } = get();
    if (narrow) {
      set({ narrowOpen: !narrowOpen });
    } else {
      const next = !userCollapsed;
      try {
        localStorage.setItem(COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      set({ userCollapsed: next });
    }
  },

  closeOverlay: () => set({ narrowOpen: false }),
}));
