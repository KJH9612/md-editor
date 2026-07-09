import { create } from 'zustand';

export type ActionId = 'quickOpen' | 'find' | 'save' | 'bold' | 'italic' | 'link';

/** 설정 화면에 표시할 액션 목록 (라벨은 i18n 키). */
export const ACTIONS: { id: ActionId; labelKey: string }[] = [
  { id: 'quickOpen', labelKey: 'actQuickOpen' },
  { id: 'find', labelKey: 'actFind' },
  { id: 'save', labelKey: 'actSave' },
  { id: 'bold', labelKey: 'actBold' },
  { id: 'italic', labelKey: 'actItalic' },
  { id: 'link', labelKey: 'actLink' },
];

const DEFAULTS: Record<ActionId, string> = {
  quickOpen: 'Mod+P',
  find: 'Mod+F',
  save: 'Mod+S',
  bold: 'Mod+B',
  italic: 'Mod+I',
  link: 'Mod+K',
};

const KEY = 'md-viewer:keybindings';

function read(): Record<ActionId, string> {
  const base = { ...DEFAULTS };
  if (typeof window === 'undefined') return base;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const id of Object.keys(DEFAULTS) as ActionId[]) {
      if (typeof saved[id] === 'string') base[id] = saved[id];
    }
  } catch {
    /* ignore */
  }
  return base;
}

interface KbState {
  bindings: Record<ActionId, string>;
  setBinding: (id: ActionId, combo: string) => void;
  reset: () => void;
}

export const useKeybindings = create<KbState>((set, get) => ({
  bindings: read(),
  setBinding: (id, combo) => {
    const bindings = { ...get().bindings, [id]: combo };
    try {
      localStorage.setItem(KEY, JSON.stringify(bindings));
    } catch {
      /* ignore */
    }
    set({ bindings });
  },
  reset: () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    set({ bindings: { ...DEFAULTS } });
  },
}));

/** 키 이벤트 → 정규화 콤보 문자열 (예: "Mod+Shift+F"). 순수 수식어만이면 null. */
export function eventToCombo(e: KeyboardEvent): string | null {
  const k = e.key;
  if (k === 'Control' || k === 'Meta' || k === 'Shift' || k === 'Alt') return null;
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Mod');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(k.length === 1 ? k.toUpperCase() : k);
  return parts.join('+');
}

/** 표시용: Mod을 OS에 맞게 (⌘ / Ctrl). */
export function displayCombo(combo: string): string {
  const isMac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');
  return combo.split('+').map((p) => (p === 'Mod' ? (isMac ? '⌘' : 'Ctrl') : p)).join(' + ');
}

/** CodeMirror 키 문자열로 변환 ("Mod+Shift+F" → "Mod-Shift-f"). */
export function comboToCM(combo: string): string {
  const parts = combo.split('+');
  const key = parts.pop()!;
  return [...parts, key.length === 1 ? key.toLowerCase() : key].join('-');
}
