import { create } from 'zustand';
import type { SearchHit } from '@/types/models';

interface SearchState {
  query: string;
  caseSensitive: boolean;
  results: SearchHit[];
  setQuery: (q: string) => void;
  toggleCase: () => void;
  setResults: (r: SearchHit[]) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  caseSensitive: false,
  results: [],
  setQuery: (query) => set({ query }),
  toggleCase: () => set((s) => ({ caseSensitive: !s.caseSensitive })),
  setResults: (results) => set({ results }),
}));
