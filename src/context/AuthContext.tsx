import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { API_URL, API_ENABLED, SUPABASE_ENABLED } from '../config/api';
import {
  setApiToken, clearApiToken, syncFromAPI, resetAPISync, getApiToken,
} from '../hooks/useTableData';
import {
  supabaseLogin, supabaseLogout, supabaseGetCurrentUser,
} from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  /** 관리자가 다른 역할로 보기 위한 임시 사용자 */
  viewAsUser: User | null;
  setViewAsUser: (user: User | null) => void;
  /** 데모 모드 로그인 (역할 선택) */
  login: (role: UserRole, userId: string) => void;
  /** API/Supabase 모드 로그인 (이메일 + 비밀번호) */
  loginWithAPI: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('ams_auth_user', null);
  const [viewAsUser, setViewAsUser] = useState<User | null>(null);

  // ── 앱 시작 시: 기존 세션 복원 ──────────────────────────────────────────
  useEffect(() => {
    if (SUPABASE_ENABLED) {
      // Supabase 세션 복원
      supabaseGetCurrentUser().then(user => {
        if (user) {
          setCurrentUser(user);
          syncFromAPI().catch(() => {});
        }
      });
    } else if (API_ENABLED && getApiToken()) {
      // PHP 토큰 복원
      syncFromAPI().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 데모 모드 로그인 ──────────────────────────────────────────────────────
  const login = (role: UserRole, userId: string) => {
    const user = mockUsers.find(u => u.id === userId && u.role === role);
    if (user) setCurrentUser(user);
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
  const logout = () => {
    setCurrentUser(null);
    if (SUPABASE_ENABLED) {
      supabaseLogout().catch(() => {});
    } else if (API_ENABLED) {
      clearApiToken();
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, viewAsUser, setViewAsUser, login, loginWithAPI, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
