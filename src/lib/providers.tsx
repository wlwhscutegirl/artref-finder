'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useCollectionStore } from '@/stores/collection-store';
import { useSubscriptionStore } from '@/stores/subscription-store';

// 앱 시작 시 인증 확인 + 클라우드 동기화 + 구독 로드 컴포넌트
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated, user } = useAuthStore();
  const { syncFromCloud, migrateToCloud } = useCollectionStore();
  // 구독 스토어 — 인증 후 fetchSubscription 호출
  const { fetchSubscription, clearSubscription } = useSubscriptionStore();
  const hasSynced = useRef(false);

  // 앱 시작 시 토큰 유효성 검증
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      checkAuth();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 인증 완료 후 클라우드 동기화 + 구독 정보 로드 (한 번만 실행)
  useEffect(() => {
    if (isAuthenticated && user && !hasSynced.current) {
      hasSynced.current = true;
      // localStorage → 클라우드 마이그레이션 후 동기화
      migrateToCloud().then(() => syncFromCloud());
      // 구독 정보 로드 (checkLimit, 배너 표시 등에 사용)
      fetchSubscription(user.id);
    }
    if (!isAuthenticated) {
      hasSynced.current = false;
      // 로그아웃 시 구독 정보 초기화 (free 플랜으로 복귀)
      clearSubscription();
    }
  }, [isAuthenticated, user]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
