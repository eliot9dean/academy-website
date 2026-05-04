import { useState, useCallback, useEffect } from 'react';
import {
  mockUsers, mockStudents, mockClasses, mockAttendance,
  mockDailyProgress, mockHomeworkResults, mockTestScores,
  mockScheduleEvents, mockConsultations, mockFinancials, mockDailyReports,
  mockClassHistory, mockEnrollmentMgmt, mockObservations,
} from '../data/mockData';
import { API_URL, API_ENABLED, SUPABASE_ENABLED } from '../config/api';
import {
  supabaseGetAll, supabaseSaveTable, supabaseChangePassword, supabaseSubscribeChanges,
} from '../lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export const DB_LS_KEY      = 'ams_db_tables_v4';
export const API_TOKEN_KEY  = 'ams_api_token';
// 더미 데이터가 바뀔 때마다 올려주면 Supabase 강제 재업로드됨
const SEED_VERSION = 4;

export const DB_INIT: Record<string, Row[]> = {
  users:          mockUsers.map(r => ({ ...r })),
  students:       mockStudents.map(r => ({ ...r })),
  classes:        mockClasses.map(r => ({ ...r })),
  attendance:     mockAttendance.map(r => ({ ...r })),
  dailyProgress:  mockDailyProgress.map(r => ({ ...r })),
  homework:       mockHomeworkResults.map(r => ({ ...r })),
  testScores:     mockTestScores.map(r => ({ ...r })),
  observations:   mockObservations.map(r => ({ ...r })),
  schedule:       mockScheduleEvents.map(r => ({ ...r })),
  consultations:  mockConsultations.map(r => ({ ...r })),
  financials:     mockFinancials.map(r => ({ ...r })),
  dailyReports:   mockDailyReports.map(r => ({ ...r })),
  classHistory:   mockClassHistory.map(r => ({ ...r })),
  enrollmentMgmt: mockEnrollmentMgmt.map(r => ({ ...r })),
};

// ─── 모듈 레벨 전역 스토어 ─────────────────────────────────────────────────
let _db: Record<string, Row[]> | null = null;
const _listeners = new Set<() => void>();
let _apiSynced = false;   // 이 세션에서 API 동기화가 완료됐는지 여부
let _realtimeUnsubscribe: (() => void) | null = null; // Supabase Realtime 구독 해제 함수

/** localStorage에서 DB를 읽어 캐시 초기화 (최초 1회) */
function initDB(): Record<string, Row[]> {
  if (_db !== null) return _db;
  try {
    const raw = window.localStorage.getItem(DB_LS_KEY);
    _db = raw ? (JSON.parse(raw) as Record<string, Row[]>) : { ...DB_INIT };
  } catch {
    _db = { ...DB_INIT };
  }
  return _db;
}

/** 항상 최신 DB 반환 */
export function getDB(): Record<string, Row[]> {
  return initDB();
}

/** DB 전체를 교체하고 localStorage에 즉시 저장, 모든 구독자에 알림 */
export function writeDB(next: Record<string, Row[]>): void {
  _db = next;
  try {
    window.localStorage.setItem(DB_LS_KEY, JSON.stringify(next));
  } catch { /* 용량 초과 등 무시 */ }
  _listeners.forEach(fn => fn());
}

/** 다른 탭에서 localStorage가 변경될 때 캐시 갱신 (cross-tab sync) */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== DB_LS_KEY || !e.newValue) return;
    try {
      _db = JSON.parse(e.newValue) as Record<string, Row[]>;
      _listeners.forEach(fn => fn());
    } catch {}
  });
}

// ─── API 헬퍼 ──────────────────────────────────────────────────────────────

/** 저장된 API 토큰 반환 */
export function getApiToken(): string | null {
  return window.localStorage.getItem(API_TOKEN_KEY);
}

/** API 토큰 저장 */
export function setApiToken(token: string): void {
  window.localStorage.setItem(API_TOKEN_KEY, token);
}

/** API 토큰 삭제 (로그아웃) */
export function clearApiToken(): void {
  window.localStorage.removeItem(API_TOKEN_KEY);
  _apiSynced = false;
}

/**
 * 서버에서 모든 데이터를 가져와 로컬 DB를 교체한다.
 * 로그인 직후 또는 앱 시작 시 토큰이 있을 때 자동 호출.
 * DB가 비어있으면(첫 사용) 로컬 mockData를 서버에 업로드한다.
 */
export async function syncFromAPI(): Promise<void> {
  if (_apiSynced) return;

  // ── Supabase 모드 ────────────────────────────────────────────────────────
  if (SUPABASE_ENABLED) {
    try {
      const serverData = await supabaseGetAll();
      const serverSeedVersion = (serverData?._seed_version?.[0] as { v?: number } | undefined)?.v;

      if (!serverData || Object.keys(serverData).length === 0) {
        // 첫 사용: DB_INIT 전체 업로드
        const initWithVersion = { ...DB_INIT, _seed_version: [{ v: SEED_VERSION }] };
        await uploadAllToSupabase(initWithVersion);
        writeDB({ ...DB_INIT });

      } else if (serverSeedVersion !== SEED_VERSION) {
        // 시드 버전 불일치: 사용자 데이터는 보존하고 새 레코드만 추가 (id 기준 병합)
        const merged: Record<string, Row[]> = {};
        // 서버의 기존 테이블은 모두 가져옴 (사용자 작성 데이터 보존)
        for (const [table, rows] of Object.entries(serverData)) {
          if (table !== '_seed_version') merged[table] = rows;
        }
        // DB_INIT 테이블에서 서버에 없는 id를 가진 레코드만 추가
        for (const [table, initRows] of Object.entries(DB_INIT)) {
          const serverRows = merged[table] ?? [];
          const serverIds = new Set(serverRows.map((r: Row) => String(r.id ?? '')).filter(Boolean));
          const toAdd = initRows.filter(r => r.id && !serverIds.has(String(r.id)));
          merged[table] = [...serverRows, ...toAdd];
        }
        merged._seed_version = [{ v: SEED_VERSION }];
        await uploadAllToSupabase(merged);
        // _seed_version은 로컬 DB에 포함하지 않음
        const { _seed_version: _, ...mergedLocal } = merged;
        writeDB(mergedLocal);

      } else {
        // 버전 일치: 서버 데이터 사용 (_seed_version 제외)
        const { _seed_version: _, ...serverLocal } = serverData;
        writeDB(serverLocal);
      }
      _apiSynced = true;

      // Realtime 구독 시작 (중복 방지)
      if (!_realtimeUnsubscribe) {
        _realtimeUnsubscribe = supabaseSubscribeChanges((tableName, rows) => {
          if (tableName === '_seed_version') return; // 버전 메타는 무시
          const db = getDB();
          writeDB({ ...db, [tableName]: rows });
        });
      }
    } catch { /* 무시 */ }
    return;
  }

  // ── PHP 모드 ─────────────────────────────────────────────────────────────
  if (!API_ENABLED) return;
  const token = getApiToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}?action=getAll`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { clearApiToken(); return; }
    if (!res.ok) return;

    const json = await res.json() as { ok: boolean; data: Record<string, Row[]> };
    if (!json.ok) return;

    const serverData = json.data;
    if (!serverData || Object.keys(serverData).length === 0) {
      await uploadAllToAPI(DB_INIT, token);
      writeDB({ ...DB_INIT });
    } else {
      writeDB(serverData);
    }
    _apiSynced = true;
  } catch { /* 무시 */ }
}

/** 로컬 DB 전체를 PHP API 서버에 업로드 (최초 데이터 밀어넣기용) */
async function uploadAllToAPI(db: Record<string, Row[]>, token: string): Promise<void> {
  for (const [table, rows] of Object.entries(db)) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'saveTable', table, rows }),
      });
    } catch { /* 무시 */ }
  }
}

/** 로컬 DB 전체를 Supabase에 업로드 (최초 데이터 밀어넣기용) */
async function uploadAllToSupabase(db: Record<string, Row[]>): Promise<void> {
  for (const [table, rows] of Object.entries(db)) {
    try {
      await supabaseSaveTable(table, rows);
    } catch { /* 무시 */ }
  }
}

/**
 * 특정 테이블을 백엔드 서버에 저장 (비동기, best-effort).
 * 실패해도 로컬 데이터는 이미 저장됐으므로 무시.
 */
async function saveTableToAPI(tableName: string, rows: Row[]): Promise<void> {
  // Supabase 모드
  if (SUPABASE_ENABLED) {
    try { await supabaseSaveTable(tableName, rows); } catch { /* 무시 */ }
    return;
  }
  // PHP 모드
  const token = getApiToken();
  if (!token) return;
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'saveTable', table: tableName, rows }),
    });
  } catch { /* 무시 */ }
}

/** 비밀번호 변경 (PHP / Supabase 공용) */
export async function changePasswordAPI(
  oldPassword: string,
  newPassword: string,
  currentEmail?: string,
): Promise<{ ok: boolean; error?: string }> {
  // Supabase 모드
  if (SUPABASE_ENABLED) {
    return supabaseChangePassword(oldPassword, newPassword, currentEmail ?? '');
  }
  // PHP 모드
  const token = getApiToken();
  if (!token) return { ok: false, error: '로그인이 필요합니다' };
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'changePassword', oldPassword, newPassword }),
    });
    const json = await res.json() as { ok?: boolean; error?: string };
    return json.ok ? { ok: true } : { ok: false, error: json.error };
  } catch {
    return { ok: false, error: '네트워크 오류' };
  }
}

/** _apiSynced 플래그 초기화 (다시 sync 강제) */
export function resetAPISync(): void {
  _apiSynced = false;
}

// ─── React 훅 ──────────────────────────────────────────────────────────────

/**
 * DB 전체를 읽고 쓰는 훅 (AdminDatabasePage용)
 */
export function useDB(): [
  Record<string, Row[]>,
  (updater: Record<string, Row[]> | ((prev: Record<string, Row[]>) => Record<string, Row[]>)) => void
] {
  const [, rerender] = useState(0);

  useEffect(() => {
    const notify = () => rerender(n => n + 1);
    _listeners.add(notify);
    return () => { _listeners.delete(notify); };
  }, []);

  const setData = useCallback(
    (updater: Record<string, Row[]> | ((prev: Record<string, Row[]>) => Record<string, Row[]>)) => {
      const current = getDB();
      const next = typeof updater === 'function' ? updater(current) : updater;
      writeDB(next);
      // useDB는 테이블 단위를 알 수 없으므로 변경된 테이블 전체 업로드
      if (API_ENABLED) {
        for (const [tbl, rows] of Object.entries(next)) {
          if (JSON.stringify(current[tbl]) !== JSON.stringify(rows)) {
            saveTableToAPI(tbl, rows).catch(() => {});
          }
        }
      }
    },
    [],
  );

  return [getDB(), setData];
}

/**
 * 특정 테이블의 데이터를 읽고 쓰는 훅
 */
export function useTableData<T extends Row = Row>(
  tableId: string,
): [T[], (updater: T[] | ((prev: T[]) => T[])) => void] {
  const [, rerender] = useState(0);

  useEffect(() => {
    const notify = () => rerender(n => n + 1);
    _listeners.add(notify);
    return () => { _listeners.delete(notify); };
  }, []);

  const rows = (getDB()[tableId] ?? []) as T[];

  const setRows = useCallback(
    (updater: T[] | ((prev: T[]) => T[])) => {
      const db = getDB();
      const current = (db[tableId] ?? []) as T[];
      const newRows = typeof updater === 'function' ? updater(current) : updater;
      writeDB({ ...db, [tableId]: newRows });
      // API / Supabase 모드: 서버에도 비동기 저장 (best-effort)
      if (API_ENABLED || SUPABASE_ENABLED) {
        saveTableToAPI(tableId, newRows).catch(() => {});
      }
    },
    [tableId],
  );

  return [rows, setRows];
}
