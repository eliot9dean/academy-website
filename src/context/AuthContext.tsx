import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { API_URL, API_ENABLED, SUPABASE_ENABLED } from '../config/api';
import {
  setApiToken, clearApiToken, syncFromAPI, resetAPISync, getApiToken, setTestMode,
} from '../hooks/useTableData';
import {
  supabaseLogin, supabaseLogout, supabaseGetCurrentUser, supabase,
} from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  /** 관리자가 다른 역할로 보기 위한 임시 사용자 */
  viewAsUser: User | null;
  setViewAsUser: (user: User | null) => void;
  /** 비밀번호 재설정 링크로 접근한 경우 true */
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (v: boolean) => void;
  /** 데모 모드 로그인 (역할 선택) */
  login: (role: UserRole, userId: string) => void;
  /** API/Supabase 모드 로그인 (이메일 + 비밀번호) */
  loginWithAPI: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** 현재 테스트 모드 여부 (모든 쓰기가 DB에 반영되지 않음) */
  isTestMode: boolean;
  /**
   * Supabase/API 모드에서 세션 유효성 검사가 완료되기 전까지 true.
   * Layout.tsx가 이 값이 true이면 보호된 화면을 렌더링하지 않음 → URL 직접 접근 차단.
   */
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('ams_auth_user', null);
  const [viewAsUser, setViewAsUser] = useState<User | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  // Supabase/API 세션 확인 완료 전까지 보호된 라우트 렌더링 차단
  const [isInitializing, setIsInitializing] = useState(SUPABASE_ENABLED || API_ENABLED);

  /** 테스트 모드 활성화 헬퍼 (React state + 모듈 플래그 동시 설정) */
  const applyTestMode = React.useCallback((isTest: boolean) => {
    setIsTestMode(isTest);
    setTestMode(isTest);
  }, []);

  // ── 앱 시작 시: 기존 세션 복원 + 비밀번호 복구 감지 ────────────────────
  useEffect(() => {
    if (SUPABASE_ENABLED) {
      // Supabase 비밀번호 복구 이벤트 감지
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        if (event === 'USER_UPDATED') {
          setIsPasswordRecovery(false);
        }
      });

      // 기존 세션 복원 + 항상 Supabase 동기화 (데모 모드 포함)
      supabaseGetCurrentUser().then(user => {
        if (user) {
          setCurrentUser(user);
          applyTestMode(user.isTestAccount ?? false); // 테스트 계정 복원 시 모드 재적용
        } else {
          // 유효한 Supabase 세션 없음 → 로컬 스토리지의 stale 유저 정보 제거
          // (URL 직접 접근으로 로그인 우회 차단)
          setCurrentUser(null);
        }
        syncFromAPI().catch(() => {});
        setIsInitializing(false); // 세션 확인 완료 → 보호된 라우트 접근 허용
      }).catch(() => {
        // 네트워크 오류 등 → 안전을 위해 로그아웃 상태로 처리
        setCurrentUser(null);
        setIsInitializing(false);
      });

      return () => subscription.unsubscribe();
    } else if (API_ENABLED) {
      if (getApiToken()) {
        // PHP 토큰 복원
        syncFromAPI().catch(() => {});
      } else {
        // 토큰 없음 → 로그인 상태 아님
        setCurrentUser(null);
      }
      setIsInitializing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 데모 모드 로그인 ──────────────────────────────────────────────────────
  const login = (role: UserRole, userId: string) => {
    const user = mockUsers.find(u => u.id === userId && u.role === role);
    if (user) {
      setCurrentUser(user);
      applyTestMode(user.isTestAccount ?? false);
    }
  };

  // ── API/Supabase 모드 로그인 ──────────────────────────────────────────────
  const loginWithAPI = async (
    email: string,
    password: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    // ── Supabase 로그인 ────────────────────────────────────────────────────
    if (SUPABASE_ENABLED) {
      const result = await supabaseLogin(email, password);
      if (!result.ok || !result.user) {
        return { ok: false, error: result.error ?? '로그인 실패' };
      }
      setCurrentUser(result.user);
      applyTestMode(result.user.isTestAccount ?? false); // 테스트 계정 여부 적용
      resetAPISync();
      syncFromAPI().catch(() => {});
      return { ok: true };
    }

    // ── PHP 로그인 ─────────────────────────────────────────────────────────
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const json = await res.json() as {
        ok?: boolean;
        token?: string;
        user?: User | null;
        userId?: string;
        error?: string;
      };

      if (!json.ok || !json.token) {
        return { ok: false, error: json.error ?? '로그인 실패' };
      }

      setApiToken(json.token);
      resetAPISync();

      let user: User | null = json.user ?? null;
      if (!user && json.userId) {
        user = mockUsers.find(u => u.id === json.userId) ?? null;
      }
      if (user) setCurrentUser(user);

      syncFromAPI().catch(() => {});
      return { ok: true };
    } catch {
      return { ok: false, error: '서버에 연결할 수 없습니다' };
    }
  };

  // ── 로그아웃 ──────────────────────────────────────────────────────────────
  // async로 Supabase signOut을 완전히 기다린 후 리턴.
  // Layout.tsx 로그아웃 버튼이 이를 await하여 세션이 정리된 뒤 navigate('/') 실행.
  // (이전에는 signOut을 기다리지 않아 다른 사람이 URL 직접 입력 시 세션이 살아있었음)
  const logout = async () => {
    applyTestMode(false); // 테스트 모드 해제
    setCurrentUser(null);
    if (SUPABASE_ENABLED) {
      await supabaseLogout(); // ← 반드시 완료 대기
    } else if (API_ENABLED) {
      clearApiToken();
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, viewAsUser, setViewAsUser, isPasswordRecovery, setIsPasswordRecovery, login, loginWithAPI, logout, isTestMode, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
