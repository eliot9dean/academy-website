// ─────────────────────────────────────────────────────────────────────────────
// src/lib/supabase.ts  –  Supabase 클라이언트 + 인증/데이터 헬퍼
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import type { User } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

// ── 싱글턴 클라이언트 ─────────────────────────────────────────────────────────
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

// ── 로그인 (status 확인 포함) ─────────────────────────────────────────────────
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

  // 승인 대기 / 거절 상태 처리
  if (profile?.status === 'pending') {
    await supabase.auth.signOut();
    return { ok: false, error: '관리자 승인 대기 중입니다. 승인 후 로그인하실 수 있습니다.' };
  }
  if (profile?.status === 'rejected') {
    await supabase.auth.signOut();
    return { ok: false, error: '가입이 거절되었습니다. 관리자에게 문의하세요.' };
  }

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

  if (profile?.status === 'pending' || profile?.status === 'rejected') return null;
  return profile ? profileToUser(profile) : null;
}

// ── Realtime 구독: ams_tables 변경 시 콜백 호출 ──────────────────────────────
export function supabaseSubscribeChanges(onUpdate: (tableName: string, rows: Row[]) => void) {
  const channel = supabase
    .channel('ams_tables_realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'ams_tables' },
      (payload) => {
        const { name, data } = payload.new as { name: string; data: Row[] };
        if (name && Array.isArray(data)) onUpdate(name, data);
      },
    )
    .subscribe();
  // 구독 해제 함수 반환
  return () => { supabase.removeChannel(channel); };
}

// ── 전체 데이터 조회 ──────────────────────────────────────────────────────────
// 에러나 RLS 차단 등으로 인한 빈 응답은 null을 반환하여 호출부가 덮어쓰지 않도록 한다.
export async function supabaseGetAll(): Promise<Record<string, Row[]> | null> {
  const { data, error } = await supabase
    .from('ams_tables')
    .select('name, data');

  // 명시적 에러 또는 응답 없음 → null
  if (error || !data) return null;
  // 행이 0개 → 명시적 null (호출부가 빈 객체로 오인하지 않도록)
  if (data.length === 0) return null;

  const result: Record<string, Row[]> = {};
  for (const row of data) {
    if (!row || typeof row.name !== 'string') continue;
    // data가 배열이 아니면 무시 (null/undefined/object 방어)
    if (!Array.isArray(row.data)) continue;
    result[row.name] = row.data as Row[];
  }
  return Object.keys(result).length === 0 ? null : result;
}

// ── 테이블 저장 (upsert) ──────────────────────────────────────────────────────
export async function supabaseSaveTable(tableName: string, rows: Row[]): Promise<void> {
  const { error } = await supabase
    .from('ams_tables')
    .upsert({ name: tableName, data: rows }, { onConflict: 'name' });
  if (error) {
    console.error(`[AMS] supabaseSaveTable(${tableName}) error:`, error.message, error.code);
    throw error;
  }
}

// ── 회원가입 (승인 대기 방식) ─────────────────────────────────────────────────
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

  if (data.session) {
    // 트리거 완료 대기
    await new Promise(r => setTimeout(r, 500));

    // 2. user_profiles: name, role, status='pending' 업데이트
    await supabase
      .from('user_profiles')
      .update({ name, role, status: 'pending' })
      .eq('id', data.user.id);

    // 3. ams_tables.pending_users 에 추가 (관리자 승인 목록용)
    try {
      const { data: pendingRow } = await supabase
        .from('ams_tables')
        .select('data')
        .eq('name', 'pending_users')
        .single();

      const current: Row[] = (pendingRow?.data as Row[]) ?? [];
      const already = current.some(p => p.email === email);
      if (!already) {
        const newPending: Row = {
          supabaseId: data.user.id,
          name,
          email,
          role,
          requestedAt: new Date().toISOString(),
        };
        await supabase
          .from('ams_tables')
          .upsert({ name: 'pending_users', data: [...current, newPending] }, { onConflict: 'name' });
      }
    } catch { /* 무시 */ }

    // 4. 승인 전까지 세션 종료
    await supabase.auth.signOut();
  }

  return { ok: true };
}

// ── 관리자: 가입 신청 승인 ────────────────────────────────────────────────────
// AdminHubPage에서 newAppId를 계산해서 전달 (ams_tables 업데이트는 훅으로 처리)
export async function supabaseAdminApproveUser(
  supabaseId: string,
  newRole: string,
  newName: string,
  newAppId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('approve_pending_user', {
    target_id: supabaseId,
    new_role: newRole,
    new_name: newName,
    new_app_id: newAppId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── 관리자: 가입 신청 거절 ────────────────────────────────────────────────────
export async function supabaseAdminRejectUser(
  supabaseId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('reject_pending_user', { target_id: supabaseId });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── 관리자: 사용자 직접 추가 (별도 세션으로 가입, 이메일 발송 옵션) ───────────
export async function supabaseAdminCreateUser(
  email: string,
  name: string,
  role: string,
  newAppId: string,
  sendEmail: boolean,
): Promise<{ ok: boolean; error?: string }> {
  // 임시 비밀번호 생성 (사용자는 이메일로 재설정 예정)
  const tempPw = Array.from({ length: 16 }, () =>
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[
      Math.floor(Math.random() * 62)
    ]
  ).join('');

  // ※ 별도 클라이언트 인스턴스 사용 → 관리자 세션 보존
  const tempClient = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder',
  );

  const { data, error } = await tempClient.auth.signUp({
    email,
    password: tempPw,
    options: { data: { name, role } },
  });

  // 이미 가입된 계정인 경우 → ams_tables만 업데이트하고 이메일 발송
  const alreadyExists =
    error?.message?.toLowerCase().includes('already registered') ||
    error?.message?.toLowerCase().includes('already been registered') ||
    error?.message?.toLowerCase().includes('user already');

  if (alreadyExists) {
    if (sendEmail) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/',
      });
    }
    return { ok: true }; // 이메일만 발송, ams_tables 추가는 호출부에서 처리
  }

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? '사용자 생성 실패' };
  }

  // 트리거 완료 대기
  await new Promise(r => setTimeout(r, 600));

  // user_profiles 업데이트 (tempClient → 자신의 row 수정 가능)
  await tempClient
    .from('user_profiles')
    .update({ name, role, status: 'approved', app_user_id: newAppId })
    .eq('id', data.user.id);

  // 이메일 발송: 비밀번호 설정 링크 전송
  if (sendEmail) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/',
    });
  }

  return { ok: true };
}

// ── 관리자: 비밀번호 설정 이메일 재발송 ──────────────────────────────────────
export async function supabaseSendPasswordEmail(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/',
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── 관리자: 다른 사용자 비밀번호 강제 변경 (Supabase RPC 경유) ───────────────
export async function supabaseAdminResetPassword(
  email: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_reset_password', {
    user_email: email,
    new_password: newPassword,
  });
  if (error) return { ok: false, error: error.message };
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
