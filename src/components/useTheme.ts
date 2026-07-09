import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'md-viewer:theme';

/** layout의 인라인 스크립트가 이미 설정한 data-theme를 초기값으로 읽는다. */
function currentTheme(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark') {
    return 'dark';
  }
  return 'light';
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: currentTheme(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = next;
    }
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    set({ theme: next });
  },
}));
