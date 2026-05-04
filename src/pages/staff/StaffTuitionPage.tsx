import { useState, useMemo, useRef, useCallback } from 'react';
import { useTableData } from '../../hooks/useTableData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { EnrollmentMgmt, Student, ClassInfo, Textbook, FinancialRecord } from '../../types';

// ── 날짜 동적 계산 ─────────────────────────────────────────────
const _now = new Date();
const TODAY = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
const THIS_MONTH = TODAY.slice(0, 7);

// ── 유틸 ──────────────────────────────────────────────────────
const won = (n: number) => n.toLocaleString('ko-KR') + '원';

// 최근 4개월 동적 생성
const MONTHS: string[] = [];
const MONTH_LABELS: Record<string, string> = {};
for (let i = 0; i < 4; i++) {
  const md = new Date(_now.getFullYear(), _now.getMonth() - i, 1);
  const key = `${md.getFullYear()}-${String(md.getMonth() + 1).padStart(2, '0')}`;
  MONTHS.push(key);
  MONTH_LABELS[key] = `${md.getMonth() + 1}월`;
}

type PeriodPreset = 'this' | '3m' | '6m' | '1y' | 'all';
const PERIOD_BTNS: { v: PeriodPreset; l: string }[] = [
  { v: 'this', l: '이번달' }, { v: '3m', l: '3개월' },
  { v: '6m', l: '6개월' },   { v: '1y', l: '1년' },  { v: 'all', l: '전체' },
];
const PERIOD_LABEL: Record<PeriodPreset, string> = {
  this: MONTH_LABELS[THIS_MONTH] ?? THIS_MONTH,
  '3m': '최근 3개월', '6m': '최근 6개월', '1y': '최근 1년', all: '전체',
};

function startMonthsInRange(preset: PeriodPreset, base: string): Set<string> | null {
  if (preset === 'all') return null;
  const [y, m] = base.split('-').map(Number);
  const count = preset === 'this' ? 1 : preset === '3m' ? 3 : preset === '6m' ? 6 : 12;
  const set = new Set<string>();
  for (let i = 0; i < count; i++) {
    let mm = m - i; let yy = y;
    while (mm <= 0) { mm += 12; yy--; }
    set.add(`${yy}-${String(mm).padStart(2, '0')}`);
  }
  return set;
}

// ── 교재 납부 상태 (3단계, 디폴트: 미구매) ─────────────────────
type TBStatus = 'paid' | 'unpaid' | 'not_purchased';

function getTBStatus(r: EnrollmentMgmt): TBStatus {
  if (r.textbookPaid) return 'paid';
  if (r.textbookFee && r.textbookNotPurchased === false) return 'unpaid';
  return 'not_purchased';
}

// ── 반별 설정 타입 ─────────────────────────────────────────────
interface ClassCfg { classId: string; tuitionFee: number; textbookIds: string[] }

// ── 최신 교재 정보 타입 ────────────────────────────────────────
type TBInfo = { name: string; pub?: string; fee: number; status: TBStatus; paidDate?: string; month: string; srcId: string };

// ──────────────────────────────────────────────────────────────
// ★ CellInput: 컴포넌트 외부에 정의 → 렌더마다 타입이 바뀌지 않아 리마운트 없음
// ──────────────────────────────────────────────────────────────
interface CellInputProps {
  type?: string;
  value: string;
  placeholder?: string;
  alignRight?: boolean;
  onChange: (v: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}
function CellInput({ type = 'text', value, placeholder, alignRight, onChange, onCommit, onCancel }: CellInputProps) {
  return (
    <input
      autoFocus
      type={type}
      className={`w-full border border-indigo-400 rounded px-1.5 py-0.5 text-xs focus:outline-none bg-white shadow-sm ${alignRight ? 'text-right' : 'text-left'}`}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={e => {
        if (e.key === 'Enter')  { e.preventDefault(); onCommit(); }
        if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
      }}
    />
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function StaffTuitionPage() {
  const [records, setRecords]   = useTableData<EnrollmentMgmt>('enrollmentMgmt');
  const [students, setStudents] = useTableData<Student>('students');
  const [classes]               = useTableData<ClassInfo>('classes');
  const [textbooks]             = useTableData<Textbook>('textbooks');
  const [, setFinancials] = useTableData<FinancialRecord>('financials');

  // ── 필터 상태 ───────────────────────────────────────────────
  const [selMonth,     setSelMonth]     = useState(THIS_MONTH);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this');
  const [selClass,     setSelClass]     = useState('all');
  const [tuFilt,       setTuFilt]       = useState<'all' | 'paid' | 'unpaid'>('all');
  const [tbFilt,       setTbFilt]       = useState<'all' | 'paid' | 'unpaid' | 'not_purchased' | 'none'>('all');
  const [search,       setSearch]       = useState('');

  // ── 셀 인라인 편집
  // editCell 을 ref 에도 미러링해서 blur 핸들러의 stale closure 방지
  const [editCell, _setEditCell] = useState<{ id: string; col: string; val: string } | null>(null);
  const editCellRef = useRef<typeof editCell>(null);
  const setEditCell: typeof _setEditCell = useCallback((v) => {
    const next = typeof v === 'function' ? v(editCellRef.current) : v;
    editCellRef.current = next;
    _setEditCell(next);
  }, []);

  // ── 반별 기본 설정 ──────────────────────────────────────────
  const [showClassCfg, setShowClassCfg] = useState(false);
  const [classCfgs,    setClassCfgs]    = useLocalStorage<ClassCfg[]>('ams_class_config_v2', []);

  // ── 편의 조회 ───────────────────────────────────────────────
  const getStu = useCallback((id: string) => students.find(s => s.id === id), [students]);
  const getCls = useCallback((id: string) => classes.find(c => c.id === id), [classes]);
  const getCfg = useCallback((cid: string) => classCfgs.find(c => c.classId === cid), [classCfgs]);

  // ── 학생별 최신 보유 교재 맵 ─────────────────────────────────
  const latestTBMap = useMemo(() => {
    const map: Record<string, TBInfo> = {};
    [...records]
      .filter(r => r.textbookName && r.textbookFee)
      .sort((a, b) => a.paymentMonth.localeCompare(b.paymentMonth))
      .forEach(r => {
        map[`${r.studentId}_${r.classId}`] = {
          name: r.textbookName!, pub: r.textbookPublisher,
          fee: r.textbookFee!, status: getTBStatus(r),
          paidDate: r.textbookPaidDate, month: r.paymentMonth, srcId: r.id,
        };
      });
    return map;
  }, [records]);

  // ── 수강시작일 기준 기간 집합 ────────────────────────────────
  const startMonthSet = useMemo(() => startMonthsInRange(periodPreset, THIS_MONTH), [periodPreset]);

  // ── 납부월 기준 기간 필터 함수 ──────────────────────────────
  const inPeriod = useCallback((paymentMonth: string) => {
    if (periodPreset === 'all') return true;
    if (periodPreset === 'this') return paymentMonth === selMonth;
    return startMonthSet?.has(paymentMonth) ?? true;
  }, [periodPreset, selMonth, startMonthSet]);

  // ── 필터링 ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return records
      .filter(r => inPeriod(r.paymentMonth))
      .filter(r => selClass === 'all' || r.classId === selClass)
      .filter(r => tuFilt === 'all' || (tuFilt === 'paid' ? r.tuitionPaid : !r.tuitionPaid))
      .filter(r => {
        if (tbFilt === 'all') return true;
        // 화면 표시와 동일한 로직: 행 자신의 필드만 참조 (latestTBMap 폴백 없음)
        const tbStat: TBStatus = r.textbookPaid
          ? 'paid'
          : r.textbookNotPurchased === false
            ? 'unpaid'
            : 'not_purchased';
        if (tbFilt === 'none') return !r.textbookFee; // 이 행에 교재비 자체가 없는 경우
        return tbStat === tbFilt;
      })
      .filter(r => !search || (getStu(r.studentId)?.name ?? '').includes(search))
      .sort((a, b) => {
        if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
        if (a.studentId !== b.studentId) return a.studentId.localeCompare(b.studentId);
        return a.paymentMonth.localeCompare(b.paymentMonth);
      });
  }, [records, inPeriod, selClass, tuFilt, tbFilt, search, getStu]);

  // ── 통계 ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const m       = records.filter(r => inPeriod(r.paymentMonth));
    const totalTu = m.reduce((s, r) => s + r.tuitionFee, 0);
    const paidTu  = m.filter(r => r.tuitionPaid).reduce((s, r) => s + r.tuitionFee, 0);
    const unpaidCnt = m.filter(r => !r.tuitionPaid).length;
    const tbVals  = Object.values(latestTBMap);
    const totalTb = tbVals.reduce((s, t) => s + t.fee, 0);
    const paidTb  = tbVals.filter(t => t.status === 'paid').reduce((s, t) => s + t.fee, 0);
    const unpaidTb = tbVals.filter(t => t.status === 'unpaid').reduce((s, t) => s + t.fee, 0);
    const unpaidTbCnt = tbVals.filter(t => t.status === 'unpaid').length;
    return { totalTu, paidTu, unpaidTu: totalTu - paidTu, unpaidCnt, totalTb, paidTb, unpaidTb, unpaidTbCnt };
  }, [records, inPeriod, latestTBMap]);

  // ── 수강료 납부 토글 ─────────────────────────────────────────
  const toggleTuition = useCallback((id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;
    const next = !record.tuitionPaid;

    // 1. enrollmentMgmt 업데이트
    setRecords(prev => prev.map(r =>
      r.id !== id ? r : { ...r, tuitionPaid: next, tuitionPaidDate: next ? TODAY : undefined }
    ));

    // 2. students.tuitionPaid 동기화 (가장 최신 달 납부 여부 반영)
    setStudents(prev => prev.map(s =>
      s.id !== record.studentId ? s : { ...s, tuitionPaid: next, tuitionDueDate: record.tuitionDueDate }
    ));

    // 3. 재무관리 연동: 납부 시 수입 추가, 미납 시 제거
    const finId = `auto_tu_${record.studentId}_${record.classId}_${record.paymentMonth}`;
    const stu = students.find(s => s.id === record.studentId);
    setFinancials(prev => {
      if (next) {
        if (prev.some(f => f.id === finId)) return prev;
        return [...prev, {
          id: finId,
          type: 'income' as const,
          category: '수강료',
          amount: record.tuitionFee,
          date: TODAY,
          description: `${stu?.name ?? record.studentId} ${record.paymentMonth} 수강료`,
          studentId: record.studentId,
        }];
      } else {
        return prev.filter(f => f.id !== finId);
      }
    });
  }, [records, students, setRecords, setStudents, setFinancials]);

  // ── 교재 납부 상태 변경 (현재 행 자체 필드만 업데이트 → 타 행 영향 없음) ──
  const setTBStatus = useCallback((rowId: string, next: TBStatus) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        textbookPaid:         next === 'paid',
        textbookPaidDate:     next === 'paid' ? (r.textbookPaidDate ?? TODAY) : undefined,
        textbookNotPurchased: next === 'not_purchased',
      };
    }));
  }, [setRecords]);

  // ── 셀 편집 핸들러 ────────────────────────────────────────────
  const startCellEdit = useCallback((id: string, col: string, rawVal: string | number | undefined) => {
    setEditCell({ id, col, val: String(rawVal ?? '') });
  }, [setEditCell]);

  const commitCell = useCallback(() => {
    const cell = editCellRef.current;
    if (!cell) return;
    setEditCell(null);
    setRecords(prev => prev.map(r => {
      if (r.id !== cell.id) return r;
      const v = cell.val;
      switch (cell.col) {
        case 'tuitionFee':        return { ...r, tuitionFee: Number(v) || r.tuitionFee };
        case 'tuitionDueDate':    return { ...r, tuitionDueDate: v || r.tuitionDueDate };
        case 'tuitionPaidDate':   return { ...r, tuitionPaidDate: v || undefined };
        case 'textbookName':      return { ...r, textbookName: v || undefined };
        case 'textbookPublisher': return { ...r, textbookPublisher: v || undefined };
        case 'textbookFee':       return { ...r, textbookFee: v ? Number(v) : undefined };
        case 'memo':              return { ...r, memo: v || undefined };
        default: return r;
      }
    }));
  }, [setEditCell, setRecords]);

  const cancelCell = useCallback(() => setEditCell(null), [setEditCell]);

  const updateCellVal = useCallback((v: string) => {
    setEditCell(p => p ? { ...p, val: v } : null);
  }, [setEditCell]);

  // ── 반별 설정 핸들러 ─────────────────────────────────────────
  const upsertCfg = (cid: string, patch: Partial<ClassCfg>) => {
    setClassCfgs(prev => {
      const ex = prev.find(c => c.classId === cid);
      if (ex) return prev.map(c => c.classId === cid ? { ...c, ...patch } : c);
      return [...prev, { classId: cid, tuitionFee: 0, textbookIds: [], ...patch }];
    });
  };
  const addTextbookToCfg = (cid: string, tbId: string) => {
    const ids = getCfg(cid)?.textbookIds ?? [];
    if (ids.includes(tbId)) return;
    upsertCfg(cid, { textbookIds: [...ids, tbId] });
  };
  const removeTBFromCfg = (cid: string, idx: number) => {
    const ids = [...(getCfg(cid)?.textbookIds ?? [])];
    ids.splice(idx, 1);
    upsertCfg(cid, { textbookIds: ids });
  };

  // ── 교재 납부 토글 ────────────────────────────────────────────
  const toggleTextbook = useCallback((rowId: string, textbookId: string, paid: boolean) => {
    const record = records.find(r => r.id === rowId);
    if (!record) return;

    setRecords(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const payments = { ...(r.textbookPayments ?? {}) };
      payments[textbookId] = { paid, paidDate: paid ? TODAY : undefined };
      return { ...r, textbookPayments: payments };
    }));

    // 재무관리 연동
    const finId = `auto_tb_${rowId}_${textbookId}`;
    const stu = students.find(s => s.id === record.studentId);
    const tb = textbooks.find(t => t.id === textbookId);
    setFinancials(prev => {
      if (paid) {
        if (prev.some(f => f.id === finId)) return prev;
        return [...prev, {
          id: finId,
          type: 'income' as const,
          category: '교재비',
          amount: tb?.price ?? 0,
          date: TODAY,
          description: `${stu?.name ?? record.studentId} 교재비 (${tb?.name ?? textbookId})`,
          studentId: record.studentId,
        }];
      } else {
        return prev.filter(f => f.id !== finId);
      }
    });
  }, [records, students, textbooks, setRecords, setFinancials]);

  // ── 렌더링 ──────────────────────────────────────────────────
  return (
    <div>
      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">수강 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">수강료 · 교재비 납부 현황 및 수강 이력 관리</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* 기간 선택 (수강시작일 기준) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-medium">납부월 기준</span>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {PERIOD_BTNS.map(({ v, l }) => (
                <button key={v} onClick={() => setPeriodPreset(v)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    periodPreset === v ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'
                  }`}>{l}</button>
              ))}
            </div>
          </div>
          {/* ⚙️ 반별 기본 설정 — 기본값 인디고 */}
          <button
            onClick={() => setShowClassCfg(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              showClassCfg
                ? 'bg-indigo-700 text-white border-indigo-700 shadow'
                : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
            }`}
          >
            ⚙️ 반별 기본 설정
          </button>
        </div>
      </div>

      {/* ── 반별 기본 설정 패널 ── */}
      {showClassCfg && (
        <div className="card p-4 mb-5 border border-indigo-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3">⚙️ 반별 기본 수강료 · 교재 설정</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {classes.map(cls => {
              const cfg = getCfg(cls.id);
              const clsColor = cls.id === 'c1' ? '#6366f1' : cls.id === 'c2' ? '#0ea5e9'
                : cls.id === 'c3' ? '#10b981' : '#f59e0b';
              return (
                <div key={cls.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: clsColor + '18', color: clsColor }}>{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-xs text-gray-500 w-20 flex-shrink-0">월 수강료</label>
                    <input type="number"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-300"
                      value={cfg?.tuitionFee ?? ''} placeholder="예: 300000"
                      onChange={e => upsertCfg(cls.id, { tuitionFee: Number(e.target.value) })} />
                    <span className="text-xs text-gray-400">원/월</span>
                  </div>
                  {/* 교재 섹션 */}
                  <div className="mb-2">
                    <div className="text-xs font-medium text-gray-500 mb-1.5">📚 교재 목록</div>
                    {(cfg?.textbookIds ?? []).length === 0 && (
                      <p className="text-xs text-gray-300 mb-1.5">등록된 교재 없음</p>
                    )}
                    {(cfg?.textbookIds ?? []).map((tbId, i) => {
                      const tb = textbooks.find(t => t.id === tbId);
                      if (!tb) return null;
                      return (
                        <div key={tbId} className="flex items-center gap-2 mb-1 text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                          <span className="flex-1 font-medium text-gray-700">{tb.name}</span>
                          {tb.publisher && <span className="text-gray-400">{tb.publisher}</span>}
                          <span className="text-indigo-600 font-semibold">{tb.price.toLocaleString()}원</span>
                          <button onClick={() => removeTBFromCfg(cls.id, i)}
                            className="text-red-400 hover:text-red-600 flex-shrink-0 ml-1">✕</button>
                        </div>
                      );
                    })}
                    {/* 교재 선택 드롭다운 */}
                    <select
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-300 bg-white"
                      value=""
                      onChange={e => { if (e.target.value) addTextbookToCfg(cls.id, e.target.value); }}>
                      <option value="">+ 교재 선택하여 추가...</option>
                      {textbooks
                        .filter(t => !(cfg?.textbookIds ?? []).includes(t.id))
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name}{t.publisher ? ` (${t.publisher})` : ''} — {t.price.toLocaleString()}원
                          </option>
                        ))}
                    </select>
                    {textbooks.length === 0 && (
                      <p className="text-[10px] text-orange-400 mt-1">※ 교재 관리 메뉴에서 교재를 먼저 등록해주세요</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 납부월 탭 (이번달 프리셋일 때만) ── */}
      {periodPreset === 'this' && (
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {MONTHS.map(m => (
            <button key={m} onClick={() => setSelMonth(m)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                selMonth === m ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}>{MONTH_LABELS[m]}</button>
          ))}
        </div>
      )}

      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-4">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">총 수강료 ({PERIOD_LABEL[periodPreset]})</div>
          <div className="text-xl font-bold text-gray-800">{won(stats.totalTu)}</div>
          <div className="text-xs text-gray-400 mt-1">
            {records.filter(r => inPeriod(r.paymentMonth)).length}건
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">납부 완료</div>
          <div className="text-xl font-bold text-green-600">{won(stats.paidTu)}</div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-green-400 rounded-full"
              style={{ width: stats.totalTu ? `${(stats.paidTu / stats.totalTu) * 100}%` : '0%' }} />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.totalTu ? Math.round(stats.paidTu / stats.totalTu * 100) : 0}% 납부
          </div>
        </div>
        <div className={`card p-4 ${stats.unpaidTu > 0 ? 'border border-red-100' : ''}`}>
          <div className="text-xs text-gray-400 mb-1">수강료 미납</div>
          <div className={`text-xl font-bold ${stats.unpaidTu > 0 ? 'text-red-500' : 'text-gray-400'}`}>
            {won(stats.unpaidTu)}
          </div>
          {stats.unpaidCnt > 0
            ? <div className="text-xs text-red-400 mt-1">{stats.unpaidCnt}명 미납</div>
            : <div className="text-xs text-green-500 mt-1">✓ 전원 납부 완료</div>}
        </div>
        <div className={`card p-4 ${stats.unpaidTb > 0 ? 'border border-orange-100' : ''}`}>
          <div className="text-xs text-gray-400 mb-1">교재비 (보유 교재 기준)</div>
          <div className="text-xl font-bold text-gray-700">{won(stats.totalTb)}</div>
          <div className="text-xs mt-1 flex gap-2">
            <span className="text-green-600">납부 {won(stats.paidTb)}</span>
            {stats.unpaidTb > 0 && <span className="text-orange-500">미납 {won(stats.unpaidTb)}</span>}
          </div>
          {stats.unpaidTbCnt > 0 && (
            <div className="text-[10px] text-orange-400 mt-0.5">{stats.unpaidTbCnt}건 미납</div>
          )}
        </div>
      </div>

      {/* ── 교재비 미납 현황 ── */}
      {stats.unpaidTbCnt > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-orange-100" style={{ background: '#FFF7ED' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">📚</span>
            <span className="text-xs font-bold text-orange-700">교재비 미납 {stats.unpaidTbCnt}건</span>
            <span className="text-[10px] text-orange-400">— 클릭하면 납부 처리</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(latestTBMap)
              .filter(([, tb]) => tb.status === 'unpaid')
              .map(([key, tb]) => {
                const [sid, cid] = key.split('_');
                const stu = getStu(sid); const cls = getCls(cid);
                return (
                  <button key={key} onClick={() => setTBStatus(tb.srcId, 'paid')}
                    className="flex items-center gap-1.5 text-xs bg-white border border-orange-200 rounded-lg px-2.5 py-1.5 hover:border-orange-400 hover:bg-orange-50 transition-all">
                    <span className="font-semibold text-gray-700">{stu?.name ?? sid}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500 truncate max-w-[80px]">{cls?.name ?? cid}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-orange-600 font-medium">{won(tb.fee)}</span>
                    <span className="text-[10px] text-gray-400">({tb.month})</span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* ── 필터 바 ── */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-300"
          value={selClass} onChange={e => setSelClass(e.target.value)}>
          <option value="all">전체 반</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
          {(['all', 'paid', 'unpaid'] as const).map(f => (
            <button key={f} onClick={() => setTuFilt(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tuFilt === f ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>
              {f === 'all' ? '수강료 전체' : f === 'paid' ? '납부' : '미납'}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
          {([
            { v: 'all',           l: '교재 전체' },
            { v: 'paid',          l: '교재납부' },
            { v: 'unpaid',        l: '교재미납' },
            { v: 'not_purchased', l: '미구매' },
            { v: 'none',          l: '교재없음' },
          ] as const).map(({ v, l }) => (
            <button key={v} onClick={() => setTbFilt(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tbFilt === v ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>{l}</button>
          ))}
        </div>
        <input
          className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-300"
          placeholder="학생명 검색..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="text-xs text-gray-400 ml-auto">{filtered.length}건</span>
      </div>

      <div className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
        <span>💡</span><span>수강료·납부기한·메모 셀을 클릭하면 바로 수정할 수 있습니다</span>
      </div>

      {/* ── 테이블 ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">학생</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">반</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">수강 시작일</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs">수강료</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">납부 기한</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs">수강료 납부</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">교재</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-300 text-sm">해당 조건의 수강 기록이 없습니다</td></tr>
              ) : filtered.map(r => {
                const stu      = getStu(r.studentId);
                const cls      = getCls(r.classId);
                const clsColor = r.classId === 'c1' ? '#6366f1' : r.classId === 'c2' ? '#0ea5e9'
                  : r.classId === 'c3' ? '#10b981' : '#f59e0b';

                // 셀 편집 활성 여부
                const ec = (col: string) => editCell?.id === r.id && editCell.col === col;

                return (
                  <tr key={r.id} className={`hover:bg-gray-50/60 transition-colors ${!r.tuitionPaid ? 'bg-red-50/20' : ''}`}>

                    {/* 학생 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: clsColor + 'cc' }}>{stu?.name[0] ?? '?'}</div>
                        <div>
                          <div className="font-medium text-gray-800">{stu?.name ?? r.studentId}</div>
                          <div className="text-xs text-gray-400">{stu?.grade}</div>
                        </div>
                      </div>
                    </td>

                    {/* 반 */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: clsColor + '18', color: clsColor }}>{cls?.name ?? r.classId}</span>
                    </td>

                    {/* 수강 시작일 */}
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.enrollStartDate}</td>

                    {/* 수강료 — 클릭 편집 */}
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">
                      {ec('tuitionFee') ? (
                        <CellInput type="number" value={editCell!.val} placeholder="수강료" alignRight
                          onChange={updateCellVal} onCommit={commitCell} onCancel={cancelCell} />
                      ) : (
                        <span onClick={() => startCellEdit(r.id, 'tuitionFee', r.tuitionFee)}
                          className="cursor-pointer hover:text-indigo-600 hover:underline transition-colors">
                          {won(r.tuitionFee)}
                        </span>
                      )}
                    </td>

                    {/* 납부 기한 — 클릭 편집 */}
                    <td className="px-4 py-3">
                      {ec('tuitionDueDate') ? (
                        <CellInput type="date" value={editCell!.val}
                          onChange={updateCellVal} onCommit={commitCell} onCancel={cancelCell} />
                      ) : (
                        <span onClick={() => startCellEdit(r.id, 'tuitionDueDate', r.tuitionDueDate)}
                          className="text-xs text-gray-600 cursor-pointer hover:text-indigo-600 hover:underline transition-colors">
                          {r.tuitionDueDate}
                        </span>
                      )}
                      {r.tuitionPaidDate && (
                        <div className="text-[10px] text-green-500 mt-0.5">납부 {r.tuitionPaidDate}</div>
                      )}
                    </td>

                    {/* 수강료 납부 토글 */}
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleTuition(r.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                          r.tuitionPaid
                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                        }`}>
                        {r.tuitionPaid ? '✓ 납부' : '✗ 미납'}
                      </button>
                    </td>

                    {/* 교재 */}
                    <td className="px-4 py-3 min-w-[200px]">
                      {(() => {
                        const cfg = getCfg(r.classId);
                        const cfgTbs = (cfg?.textbookIds ?? []).map(id => textbooks.find(t => t.id === id)).filter(Boolean) as Textbook[];

                        if (cfgTbs.length === 0) {
                          // backward compat: 기존 단일 교재 데이터 표시
                          if (r.textbookName) {
                            const paid = r.textbookPaid ?? false;
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-gray-600 truncate max-w-[120px]">{r.textbookName}</span>
                                {r.textbookFee && <span className="text-[10px] text-gray-400">{r.textbookFee.toLocaleString()}원</span>}
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${
                                  paid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'
                                }`}>{paid ? '✓납부' : '미구매'}</span>
                              </div>
                            );
                          }
                          return <span className="text-gray-300 text-xs">—</span>;
                        }

                        return (
                          <div className="space-y-1.5">
                            {cfgTbs.map(tb => {
                              const payment = r.textbookPayments?.[tb.id];
                              const paid = payment?.paid ?? false;
                              const paidDate = payment?.paidDate;
                              return (
                                <div key={tb.id} className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs text-gray-700 font-medium truncate max-w-[110px]" title={tb.name}>{tb.name}</span>
                                  <span className="text-[10px] text-gray-400 flex-shrink-0">{tb.price.toLocaleString()}원</span>
                                  <button
                                    onClick={() => toggleTextbook(r.id, tb.id, !paid)}
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 transition-all ${
                                      paid
                                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                        : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                                    }`}>
                                    {paid ? '✓납부' : '✗미납'}
                                  </button>
                                  {paid && paidDate && <span className="text-[9px] text-green-400 flex-shrink-0">{paidDate}</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 메모 — 클릭 편집 */}
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[120px]">
                      {ec('memo') ? (
                        <CellInput value={editCell!.val} placeholder="메모"
                          onChange={updateCellVal} onCommit={commitCell} onCancel={cancelCell} />
                      ) : (
                        <span onClick={() => startCellEdit(r.id, 'memo', r.memo)}
                          className="truncate block cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 rounded px-0.5 transition-colors min-h-[1rem]"
                          title="클릭하여 수정">
                          {r.memo ?? ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 합계 행 */}
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center gap-6 text-xs flex-wrap">
            <span className="text-gray-500 font-medium">합계 ({filtered.length}건)</span>
            <span className="text-gray-700">수강료 <b>{won(filtered.reduce((s, r) => s + r.tuitionFee, 0))}</b></span>
            <span className="text-green-600">납부 <b>{won(filtered.filter(r => r.tuitionPaid).reduce((s, r) => s + r.tuitionFee, 0))}</b></span>
            <span className="text-red-500">미납 <b>{won(filtered.filter(r => !r.tuitionPaid).reduce((s, r) => s + r.tuitionFee, 0))}</b></span>
          </div>
        )}
      </div>
    </div>
  );
}
