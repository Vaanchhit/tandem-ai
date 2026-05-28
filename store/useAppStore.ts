'use client';

import { create } from 'zustand';
import type { ValuationPayload } from '../lib/api';

interface AppState {
  selectedCompanyId: number | null;
  parsedPayload: ValuationPayload | null;
  setSelectedCompanyId: (id: number) => void;
  setParsedPayload: (payload: ValuationPayload | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCompanyId: null,
  parsedPayload: null,
  setSelectedCompanyId: (id) => set({ selectedCompanyId: id }),
  setParsedPayload: (payload) => set({ parsedPayload: payload })
}));
