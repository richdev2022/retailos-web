import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'retailos-auth',
      // Only persist the user identity, never the access token in localStorage for long-lived sessions.
      // Token is kept in-memory but rehydrated for UX. Refresh cookie handles true persistence.
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
