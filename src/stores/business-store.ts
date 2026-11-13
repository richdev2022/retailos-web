import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Business, Branch } from '@/lib/types';

interface BusinessState {
  businesses: Business[];
  branches: Branch[];
  activeBusinessId: string | null;
  activeBranchId: string | null;
  activeBusiness: Business | null;
  setBusinesses: (businesses: Business[]) => void;
  setBranches: (branches: Branch[]) => void;
  setActiveBusiness: (id: string) => void;
  setActiveBranch: (id: string | null) => void;
  clear: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      businesses: [],
      branches: [],
      activeBusinessId: null,
      activeBranchId: null,
      activeBusiness: null,
      setBusinesses: (businesses) => {
        const current = get().activeBusinessId;
        const active = businesses.find((b) => b.id === current) ?? businesses[0] ?? null;
        set({
          businesses,
          activeBusinessId: active?.id ?? null,
          activeBusiness: active,
        });
      },
      setBranches: (branches) => {
        set({
          branches,
          activeBranchId: branches.find((b) => b.isHQ)?.id ?? branches[0]?.id ?? null,
        });
      },
      setActiveBusiness: (id) => {
        const active = get().businesses.find((b) => b.id === id) ?? null;
        set({ activeBusinessId: id, activeBusiness: active, branches: [], activeBranchId: null });
      },
      setActiveBranch: (id) => set({ activeBranchId: id }),
      clear: () =>
        set({
          businesses: [],
          branches: [],
          activeBusinessId: null,
          activeBranchId: null,
          activeBusiness: null,
        }),
    }),
    { name: 'retailos-business' },
  ),
);
