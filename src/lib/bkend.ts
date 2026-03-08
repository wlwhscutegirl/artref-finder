// ============================================
// bkend.ai REST API Client
// 공식 스펙: api-client.bkend.ai + X-API-Key
// ============================================

import { STORAGE_KEYS } from '@/lib/constants';

const API_BASE = process.env.NEXT_PUBLIC_BKEND_API_URL || 'https://api-client.bkend.ai/v1';
const API_KEY = process.env.NEXT_PUBLIC_BKEND_API_KEY || '';

/** bkend.ai 표준 응답 래퍼 */
interface BkendResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/** 인증 토큰 응답 */
interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/** 유저 프로필 */
export interface BkendUser {
  id: string;
  role: string;
  name: string;
  nickname: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

/** 목록 조회 응답 (items + pagination) */
interface ListResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class BkendClient {
  // --- 토큰 관리 ---
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // --- 공통 HTTP 요청 (응답 래퍼 자동 언래핑) ---
  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // 401 시 토큰 갱신 시도
    if (res.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        return this.fetch<T>(path, options);
      }
      this.clearTokens();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const message = errorBody?.error?.message || `Request failed: ${res.status}`;
      // 에러 코드와 상세 정보를 보존하여 호출측에서 분기 가능하게 함
      const error = new Error(message) as Error & { code?: string; statusCode?: number; details?: unknown };
      error.code = errorBody?.error?.code;
      error.statusCode = res.status;
      error.details = errorBody?.error?.details;
      throw error;
    }

    const json: BkendResponse<T> = await res.json();

    // bkend.ai 응답은 { success, data } 래퍼로 감싸져 있음
    if (json.success === false) {
      const error = new Error(json.error?.message || 'Unknown error') as Error & { code?: string; details?: unknown };
      error.code = json.error?.code;
      error.details = json.error?.details;
      throw error;
    }

    return json.data;
  }

  // --- 토큰 갱신 ---
  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const json: BkendResponse<AuthTokenResponse> = await res.json();
      if (!json.success) return false;

      this.setTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // --- Auth (인증) ---
  auth = {
    /** 이메일 회원가입 (method: 'password' 필수) */
    signup: (body: { email: string; password: string; name: string }) =>
      this.fetch<AuthTokenResponse>(
        '/auth/email/signup',
        { method: 'POST', body: JSON.stringify({ ...body, method: 'password' }) }
      ).then((tokens) => {
        this.setTokens(tokens.accessToken, tokens.refreshToken);
        return tokens;
      }),

    /** 이메일 로그인 (method: 'password' 필수) */
    signin: (body: { email: string; password: string }) =>
      this.fetch<AuthTokenResponse>(
        '/auth/email/signin',
        { method: 'POST', body: JSON.stringify({ ...body, method: 'password' }) }
      ).then((tokens) => {
        this.setTokens(tokens.accessToken, tokens.refreshToken);
        return tokens;
      }),

    /** 현재 로그인한 유저 프로필 조회 */
    me: () => this.fetch<BkendUser>('/auth/me'),

    /** 로그아웃 (토큰 삭제) */
    signout: () => {
      this.clearTokens();
      return this.fetch('/auth/signout', { method: 'POST' }).catch(() => {});
    },
  };

  // --- Data (CRUD) ---
  data = {
    /**
     * 목록 조회 (페이지네이션, 필터, 정렬 지원)
     * bkend 응답: { items: T[], pagination: { total, page, limit, totalPages } }
     * 호환성을 위해 { data: T[], total: number } 형태로 변환
     */
    list: <T>(table: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return this.fetch<ListResponse<T>>(`/data/${table}${query}`)
        .then((res) => ({
          data: res.items,
          total: res.pagination.total,
        }));
    },

    /** 단일 조회 */
    get: <T>(table: string, id: string) =>
      this.fetch<T>(`/data/${table}/${id}`),

    /** 생성 */
    create: <T>(table: string, body: Partial<T>) =>
      this.fetch<T>(`/data/${table}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    /** 수정 */
    update: <T>(table: string, id: string, body: Partial<T>) =>
      this.fetch<T>(`/data/${table}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    /** 삭제 */
    delete: (table: string, id: string) =>
      this.fetch(`/data/${table}/${id}`, { method: 'DELETE' }),
  };
}

export const bkend = new BkendClient();
