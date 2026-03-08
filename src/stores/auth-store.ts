import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bkend } from '@/lib/bkend';
import type { User } from '@/types';

// 미들웨어에서 인증 상태를 확인할 수 있도록 쿠키 동기화
function syncAuthCookie(isAuthenticated: boolean) {
  if (typeof document === 'undefined') return;
  if (isAuthenticated) {
    // 세션 쿠키로 설정 (브라우저 닫으면 만료)
    document.cookie = 'artref-auth-status=true;path=/;SameSite=Lax';
  } else {
    document.cookie = 'artref-auth-status=;path=/;max-age=0';
  }
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          // 로그인 → 토큰 저장 → 유저 프로필 조회
          await bkend.auth.signin({ email, password });
          const user = await bkend.auth.me();
          syncAuthCookie(true);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, name) => {
        set({ isLoading: true });
        try {
          // 회원가입 → 토큰 저장 → 유저 프로필 조회
          await bkend.auth.signup({ email, password, name });
          const user = await bkend.auth.me();
          syncAuthCookie(true);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await bkend.auth.signout();
        syncAuthCookie(false);
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          // /auth/me는 BkendUser 객체를 직접 반환
          const user = await bkend.auth.me();
          syncAuthCookie(true);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          syncAuthCookie(false);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'artref-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
