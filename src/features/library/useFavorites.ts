import { create } from 'zustand';

const KEY = 'md-viewer:favorites';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

interface FavState {
  favorites: Set<string>;
  toggle: (id: string) => void;
}

export const useFavorites = create<FavState>((set, get) => ({
  favorites: new Set(read()),
  toggle: (id) => {
    const favorites = new Set(get().favorites);
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...favorites]));
    } catch {
      /* ignore */
    }
    set({ favorites });
  },
}));
