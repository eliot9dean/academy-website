// ─────────────────────────────────────────────────────────────────────────────
// src/lib/supabase.ts  –  Supabase 클라이언트 + 인증/데이터 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import type { User } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// ── 싱글턴 클라이언트 ─────────────────────────────────────────────────────────
// SUPABASE_ENABLED=false 일 때도 import 오류 방지를 위해 빈 URL로 생성
export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
);

// ── 프로필 Row → User 변환 (app_user_id를 id로 사용) ─────────────────────────
function profileToUser(profile: Row): User {
  return {
    ...(profile as User),
    id: (profile.app_user_id as string) || (profile.id as string),
  };
}

// ── 로그인 ────────────────────────────────────────────────────────────────────
export async function supabaseLogin(
  email: string,
  password: string,
): Promise<{ ok: boolean; user?: User; error?: string }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다' };
  }

  // user_profiles 에서 앱 사용자 정보 조회
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return { ok: true, user: profile ? profileToUser(profile) : undefined };
}

// ── 로그아웃 ──────────────────────────────────────────────────────────────────
export async function supabaseLogout(): Promise<void> {
  await supabase.auth.signOut();
}

// ── 현재 세션 → 앱 유저 복원 ─────────────────────────────────────────────────
export async function supabaseGetCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return profile ? profileToUser(profile) : null;
}

// ── 전체 데이터 조회 ──────────────────────────────────────────────────────────
export async function supabaseGetAll(): Promise<Record<string, Row[]> | null> {
  const { data, error } = await supabase
    .from('ams_tables')
    .select('name, data');

  if (error || !data) return null;

  const result: Record<string, Row[]> = {};
  for (const row of data) {
    result[row.name] = row.data as Row[];
  }
  return result;
}

// ── 테이블 저장 (upsert) ──────────────────────────────────────────────────────
export async function supabaseSaveTable(tableName: string, rows: Row[]): Promise<void> {
  await supabase
    .from('ams_tables')
    .upsert({ name: tableName, data: rows }, { onConflict: 'name' });
}

// ── 회원가입 ──────────────────────────────────────────────────────────────────
export async function supabaseSignUp(
  email: string,
  password: string,
  name: string,
  role: string,
): Promise<{ ok: boolean; error?: string }> {
  // 1. Supabase Auth 계정 생성
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message ?? '회원가입 실패' };
  }

  // 2. 트리거가 user_profiles를 생성한 뒤 name/role을 올바르게 업데이트
  //    (메타데이터 전달이 불안정한 경우를 대비해 직접 UPDATE)
  if (data.session) {
    // 약간의 지연으로 트리거 완료 대기
    await new Promise(r => setTimeout(r, 500));
    await supabase
      .from('user_profiles')
      .update({ name, role })
      .eq('id', data.user.id);
  }

  return { ok: true };
}

// ── 비밀번호 변경 ─────────────────────────────────────────────────────────────
export async function supabaseChangePassword(
  oldPassword: string,
  newPassword: string,
  currentEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  // 현재 비밀번호 검증 (재로그인으로 확인)
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: currentEmail,
    password: oldPassword,
  });
  if (verifyError) return { ok: false, error: '현재 비밀번호가 올바르지 않습니다' };

  // 새 비밀번호로 변경
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
