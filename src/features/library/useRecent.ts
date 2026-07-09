import { create } from 'zustand';

const KEY = 'md-viewer:recent';
const MAX = 20;

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

interface RecentState {
  recent: string[]; // 최근 연 파일 id (최신 우선)
  push: (id: string) => void;
}

export const useRecent = create<RecentState>((set, get) => ({
  recent: read(),
  push: (id) => {
    const recent = [id, ...get().recent.filter((x) => x !== id)].slice(0, MAX);
    try {
      localStorage.setItem(KEY, JSON.stringify(recent));
    } catch {
      /* ignore */
    }
    set({ recent });
  },
}));
