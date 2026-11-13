import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { USERS } from './seed';
import type { User } from './types';

interface AuthState {
  userId: string | null;
  hydrated: boolean;
  login: (code: string, pin: string) => { ok: boolean; message?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      hydrated: false,
      login: (code, pin) => {
        const user = USERS.find((u) => u.code === code.trim().toUpperCase());
        if (!user) return { ok: false, message: 'Mã nhân viên không tồn tại.' };
        if (user.pin !== pin.trim()) return { ok: false, message: 'Mã PIN không đúng.' };
        set({ userId: user.id });
        return { ok: true };
      },
      logout: () => set({ userId: null }),
    }),
    {
      name: 'vmes-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);

export function findUser(id: string | null | undefined): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function useCurrentUser(): User | undefined {
  const userId = useAuthStore((s) => s.userId);
  return findUser(userId);
}

export function getCurrentUser(): User | undefined {
  return findUser(useAuthStore.getState().userId);
}
