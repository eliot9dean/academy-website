import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTableData } from '../../hooks/useTableData';
import type {
  Student, ClassInfo, AttendanceRecord, TestScore, User, ClassHistoryRecord, EnrollmentMgmt, ClassConfig,
} from '../../types';

// ── 상수 ────────────────────────────────────────────────────────
const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;


const TYPE_LABELS: Record<string, string> = {
  all: '전체', daily: '단어테스트', weekly: '주간테스트', monthly: '월간평가',
};
const TYPE_COLORS: Record<string, string> = {
  daily: '#6366f1', weekly: '#0ea5e9', monthly: '#10b981',
};

// 퇴원 사유 프리셋
const WITHDRAW_REASONS = [
  '타 학원 이동',
  '이사 / 전학',
  '학업 부담 과다',
  '개인 사정',
  '경제적 사정',
  '학교 시험 준비',
  '학원 불만족',
  '졸업 / 상급학교 진학',
  '기타 (직접 입력)',
] as const;

// ── 유틸 함수 ──────────────────────────────────────────────────
/** YYYY-MM → YYYY.MM */
const fmtYM = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** 두 날짜 사이 개월 수 (최소 1) */
const monthsBetween = (start: string, end: string | null): number => {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date(TODAY);
  const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  return Math.max(1, m);
};

/** 납부 기한으로부터 해당 수강 기간(start~end) 계산 */
const calcTuitionPeriod = (dueDate: string) => {
  const due = new Date(dueDate);
  const end = new Date(due);
  end.setDate(end.getDate() - 1);        // due -1일
  const start = new Date(due);
  start.setMonth(start.getMonth() - 1); // due -1개월
  return {
    start: start.toISOString().slice(0, 10),
    end:   end.toISOString().slice(0, 10),
  };
};

/** 기간 프리셋 → 시작 날짜 */
const getPresetStart = (preset: 'all' | '1m' | '3m' | '6m'): string => {
  if (preset === 'all') return '';
  const d = new Date(TODAY);
  if (preset === '1m') d.setMonth(d.getMonth() - 1);
  else if (preset === '3m') d.setMonth(d.getMonth() - 3);
  else d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
};

/**
 * 반 이력 레코드를 '이동 체인' 단위로 묶기
 * - 앞 레코드의 endDate와 다음 레코드의 startDate 차이가 35일 이내면 같은 체인으로 연결
 * - 현재 진행 중(endDate=null)인 레코드가 마지막인 체인은 더 이상 연결 불가
 */
const groupIntoTracks = (records: ClassHistoryRecord[]): ClassHistoryRecord[][] => {
  if (!records.length) return [];
  const sorted = [...records].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const tracks: ClassHistoryRecord[][] = [];

  for (const rec of sorted) {
    let placed = false;
    for (const track of tracks) {
      const last = track[track.length - 1];
      if (!last.endDate) continue; // 진행 중인 트랙엔 추가 불가
      const gapDays =
        (new Date(rec.startDate).getTime() - new Date(last.endDate).getTime()) / 86_400_000;
      if (gapDays >= 0 && gapDays <= 35) {
        track.push(rec);
        placed = true;
        break;
      }
    }
    if (!placed) tracks.push([rec]);
  }
  return tracks;
};

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export default function StaffStudentsPage() {
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [search, setSearch]               = useState('');

  // 테스트 결과 필터
  const [testType,    setTestType]    = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [testPeriod,  setTestPeriod]  = useState<'all' | '1m' | '3m' | '6m'>('all');
  const [testClassId, setTestClassId] = useState('all');  // 반 필터
  const [testMonth,   setTestMonth]   = useState('');     // YYYY-MM 월 필터 (빈 문자 = 미사용)

  // 출결 현황 기간 필터
  const [attPeriod, setAttPeriod] = useState<'month' | '3m' | 'custom'>('month');
  const [attMonth,  setAttMonth]  = useState(TODAY.slice(0, 7)); // YYYY-MM
  const [attCStart, setAttCStart] = useState('');
  const [attCEnd,   setAttCEnd]   = useState('');

  // 학생 편집 상태
  const [editingStudent, setEditingStudent] = useState<false | 'withdraw' | 'class'>(false);
  const [withdrawForm, setWithdrawForm] = useState({ reasonPreset: '', reasonCustom: '', date: TODAY });


  // 데이터
  const [students, setStudents] = useTableData<Student>('students');
  const [classes,  setClasses]  = useTableData<ClassInfo>('classes');
  const [attendance]            = useTableData<AttendanceRecord>('attendance');
  const [testScores]            = useTableData<TestScore>('testScores');
  const [users]                 = useTableData<User>('users');
  const [classHistory]          = useTableData<ClassHistoryRecord>('classHistory');
  const [enrollmentMgmt]        = useTableData<EnrollmentMgmt>('enrollmentMgmt');
  const [classConfigsDB]        = useTableData<ClassConfig>('classConfigs');
  const [textbooksDB]           = useTableData<{ id: string; name: string; price: number }>('textbooks');

  // ── 파생 데이터 ─────────────────────────────────────────────
  const filtered = useMemo(() =>
    students
      .filter(s => s.status === 'enrolled')
      .filter(s =>
        s.name.includes(search) ||
        s.school.includes(search) ||
        s.grade.includes(search),
      ),
    [students, search],
  );

  const selected = useMemo(
    () => (selectedId ? students.find(s => s.id === selectedId) ?? null : null),
    [selectedId, students],
  );

  /** 출결 요약 — 선택 기간 기준 */
  const attSummary = useMemo(() => {
    if (!selected) return null;
    let start = '', end = TODAY;
    if (attPeriod === 'month') {
      start = `${attMonth}-01`;
      const [y, m] = attMonth.split('-').map(Number);
      const monthEnd = `${attMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      end = monthEnd < TODAY ? monthEnd : TODAY;
    } else if (attPeriod === '3m') {
      const d = new Date(TODAY); d.setMonth(d.getMonth() - 3);
      start = d.toISOString().slice(0, 10);
    } else {
      start = attCStart; end = attCEnd || TODAY;
    }
    const recs    = attendance.filter(a =>
      a.studentId === selected.id &&
      (!start || a.date >= start) &&
      a.date <= end
    );
    const present = recs.filter(r => r.status === 'present').length;
    const absent  = recs.filter(r => r.status === 'absent').length;
    const late    = recs.filter(r => r.status === 'late').length;
    const early   = recs.filter(r => r.status === 'early_leave').length;
    const total   = recs.length;
    const rate    = total > 0 ? Math.round((present + late + early) / total * 100) : 0;
    return { present, absent, late, early, total, rate };
  }, [selected, attendance, attPeriod, attMonth, attCStart, attCEnd]);

  /** 반 이력 트랙 */
  const historyTracks = useMemo(() => {
    if (!selected) return [];
    const recs = classHistory.filter(h => h.studentId === selected.id);
    if (recs.length > 0) return groupIntoTracks(recs);
    // 이력 없으면 현재 반 기준 합성
    return classes
      .filter(c => (c.studentIds as string[]).includes(selected.id))
      .map(c => ([{
        id:        `synth_${selected.id}_${c.id}`,
        studentId: selected.id,
        classId:   c.id,
        className: c.name,
        startDate: selected.enrollDate,
        endDate:   null as string | null,
      }]));
  }, [selected, classHistory, classes]);

  /** 필터된 테스트 점수 (내림차순) — 반·월·기간 복합 필터 */
  const filteredScores = useMemo(() => {
    if (!selected) return [];
    // 월 필터 우선, 없으면 기간 프리셋
    const dateStart = testMonth ? `${testMonth}-01` : getPresetStart(testPeriod);
    const dateEnd   = testMonth
      ? (() => {
          const [y, m] = testMonth.split('-').map(Number);
          return `${testMonth}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
        })()
      : '';
    return testScores
      .filter(t => t.studentId === selected.id)
      .filter(t => testType    === 'all' || t.type    === testType)
      .filter(t => testClassId === 'all' || t.classId === testClassId)
      .filter(t => !dateStart || t.date >= dateStart)
      .filter(t => !dateEnd   || t.date <= dateEnd)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selected, testScores, testType, testPeriod, testClassId, testMonth]);

  /** 차트용 데이터 (오름차순) */
  const chartData = useMemo(() =>
    [...filteredScores].reverse().map(t => ({
      date:  t.date.slice(5),
      score: t.score,
      label: t.testName,
      type:  t.type,
    })),
    [filteredScores],
  );

  /** enrollmentMgmt 기반 학생별 납부 상태 맵 */
  const paymentStatusMap = useMemo(() => {
    const map: Record<string, {
      tuitionPaid: boolean;
      tuitionDueDate: string;                    // 납부 기한 (기간 계산용)
      unpaidTextbooks: { name: string; fee: number }[];  // 미납 교재 목록
      textbookPaid: boolean;
    }> = {};

    // classConfig 반별 교재 목록
    const cfgByClass: Record<string, string[]> = {};
    for (const cfg of classConfigsDB) {
      cfgByClass[cfg.classId] = cfg.textbookIds ?? [];
    }

    // textbook ID → { name, fee } 룩업 (Textbook 타입의 price 필드 사용)
    const tbLookup: Record<string, { name: string; fee: number }> = {};
    for (const tb of textbooksDB) {
      tbLookup[tb.id] = { name: tb.name, fee: tb.price };
    }

    // 학생별 그룹핑
    const byStudent: Record<string, EnrollmentMgmt[]> = {};
    for (const r of enrollmentMgmt) {
      if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
      byStudent[r.studentId].push(r);
    }

    for (const [sid, recs] of Object.entries(byStudent)) {
      // ── 수강료: 가장 최근 월 기준 ──────────────────────────────
      const latestMonth    = recs.reduce((max, r) => r.paymentMonth > max ? r.paymentMonth : max, '');
      const latestRecs     = recs.filter(r => r.paymentMonth === latestMonth);
      const tuitionPaid    = latestRecs.every(r => r.tuitionPaid);
      const tuitionDueDate = latestRecs[0]?.tuitionDueDate ?? '';

      // ── 교재비: 미납 교재 목록 수집 ─────────────────────────────
      const unpaidSet = new Map<string, { name: string; fee: number }>(); // key = 교재명(중복 제거)
      let   anyTbPaid = false;

      // 1) classConfig 신형 — 최신 월 레코드에서 textbookPayments 확인
      for (const r of latestRecs) {
        const tbIds = cfgByClass[r.classId] ?? [];
        for (const tbId of tbIds) {
          const paid = r.textbookPayments?.[tbId]?.paid ?? false;
          const info = tbLookup[tbId];
          if (!paid && info) unpaidSet.set(tbId, info);
          if (paid)         anyTbPaid = true;
        }
        // textbookPayments 직접 맵 (classConfig 없이 직접 저장된 경우)
        if (r.textbookPayments && tbIds.length === 0) {
          for (const [tbId, p] of Object.entries(r.textbookPayments)) {
            if (!p.paid && tbLookup[tbId]) unpaidSet.set(tbId, tbLookup[tbId]);
            if (p.paid) anyTbPaid = true;
          }
        }
      }

      // 2) 구형 textbookFee 방식 — classConfig 교재가 없을 때만 폴백
      if (unpaidSet.size === 0 && !anyTbPaid) {
        const latestTbByClass: Record<string, EnrollmentMgmt> = {};
        for (const r of recs) {
          if (!r.textbookFee) continue;
          const prev = latestTbByClass[r.classId];
          if (!prev || r.paymentMonth > prev.paymentMonth) latestTbByClass[r.classId] = r;
        }
        for (const r of Object.values(latestTbByClass)) {
          if (r.textbookPaid) {
            anyTbPaid = true;
          } else if (!r.textbookNotPurchased && r.textbookFee) {
            unpaidSet.set(r.id, { name: r.textbookName ?? '교재', fee: r.textbookFee });
          }
        }
      }

      map[sid] = {
        tuitionPaid,
        tuitionDueDate,
        unpaidTextbooks: [...unpaidSet.values()],
        textbookPaid: anyTbPaid && unpaidSet.size === 0,
      };
    }
    return map;
  }, [enrollmentMgmt, classConfigsDB, textbooksDB]);


  // ── 렌더링 ──────────────────────────────────────────────────
  return (
    <div className="flex gap-5 h-[calc(100vh-7rem)]">

      {/* ── 학생 목록 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-3">학생 정보</h1>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">🔍</span>
            <input
              className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="학생명, 학교, 학년 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.map(stu => {
            const recs    = attendance.filter(a => a.studentId === stu.id);
            const present = recs.filter(r => r.status === 'present').length;
            const late    = recs.filter(r => r.status === 'late').length;
            const early   = recs.filter(r => r.status === 'early_leave').length;
            const total   = recs.length;
            const rate    = total > 0 ? Math.round((present + late + early) / total * 100) : 0;
            return (
              <button
                key={stu.id}
                onClick={() => {
                  setSelectedId(stu.id);
                  setTestType('all'); setTestPeriod('all');
                  setTestClassId('all'); setTestMonth('');
                  setAttPeriod('month'); setAttMonth(TODAY.slice(0, 7));
                  setAttCStart(''); setAttCEnd('');
                  setEditingStudent(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedId === stu.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                    {stu.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate">{stu.name}</div>
                    <div className="text-xs text-gray-400 truncate">{stu.grade} · {stu.school}</div>
                  </div>
                  {(() => {
                    const st = paymentStatusMap[stu.id];
                    const tuUnpaid = st ? !st.tuitionPaid : !stu.tuitionPaid;
                    const tbUnpaid = (st?.unpaidTextbooks.length ?? 0) > 0;
                    if (!tuUnpaid && !tbUnpaid) return null;
                    return (
                      <div className="flex flex-col gap-0.5 items-end flex-shrink-0">
                        {tuUnpaid && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded leading-tight whitespace-nowrap">
                            수강료 미납
                          </span>
                        )}
                        {tbUnpaid && (
                          <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded leading-tight whitespace-nowrap">
                            교재비 미납
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="text-xs text-gray-400">
                  출석률 {rate}% · 결석 {recs.filter(r => r.status === 'absent').length}회
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 학생 상세 ── */}
      <div className="flex-1 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <div className="text-5xl mb-3">👤</div>
              <p>학생을 선택하면 상세 정보가 표시됩니다</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ── 기본 정보 ── */}
            <div className="card p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-700 font-bold text-xl">
                  {selected.name[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.grade} · {selected.school}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      📞 {selected.parentName} ({selected.parentPhone})
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      📅 입원 {selected.enrollDate}
                    </span>
                    {(() => {
                      const st = paymentStatusMap[selected.id];
                      const tuPaid = st ? st.tuitionPaid : selected.tuitionPaid;
                      // 납부 기한으로 수강 기간 계산
                      const period = st?.tuitionDueDate ? calcTuitionPeriod(st.tuitionDueDate) : null;
                      const fmt = (d: string) => {
                        const [, m, day] = d.split('-');
                        return `${parseInt(m)}/${parseInt(day)}`;
                      };
                      const periodLabel = period ? `${fmt(period.start)} ~ ${fmt(period.end)}` : '';
                      return (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          tuPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {tuPaid
                            ? `수강료 납부${periodLabel ? ` (${periodLabel})` : ''}`
                            : `수강료 미납${periodLabel ? ` (${periodLabel})` : ''}`}
                        </span>
                      );
                    })()}
                    {(() => {
                      const st = paymentStatusMap[selected.id];
                      if (!st) return null;
                      // 미납 교재 목록
                      if (st.unpaidTextbooks.length > 0) {
                        return (
                          <>
                            {st.unpaidTextbooks.map((tb, i) => (
                              <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                📚 {tb.name} {tb.fee.toLocaleString()}원 미납
                              </span>
                            ))}
                          </>
                        );
                      }
                      if (st.textbookPaid) {
                        return (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                            교재비 납부
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
              {/* 관리 버튼들 */}
              <div className="mt-3 flex gap-2 flex-wrap border-t border-gray-100 pt-3">
                {selected.status === 'enrolled' ? (
                  <button
                    onClick={() => { setWithdrawForm({ reasonPreset: '', reasonCustom: '', date: TODAY }); setEditingStudent('withdraw'); }}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    🚪 퇴원 처리
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setStudents(prev => prev.map(s =>
                        s.id !== selected.id ? s : { ...s, status: 'enrolled', withdrawDate: undefined, withdrawReason: undefined }
                      ));
                    }}
                    className="text-xs px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    ✅ 재원 처리
                  </button>
                )}
                <button
                  onClick={() => setEditingStudent('class')}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  🔄 반 변경
                </button>
              </div>

              {/* 퇴원 처리 폼 */}
              {editingStudent === 'withdraw' && (
                <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 space-y-2">
                  <div className="text-xs font-semibold text-red-700">🚪 퇴원 처리</div>

                  {/* 퇴원일 */}
                  <div>
                    <label className="text-[10px] text-gray-500 mb-0.5 block">퇴원일</label>
                    <input
                      type="date"
                      value={withdrawForm.date}
                      onChange={e => setWithdrawForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                    />
                  </div>

                  {/* 퇴원 사유 드롭다운 */}
                  <div>
                    <label className="text-[10px] text-gray-500 mb-0.5 block">퇴원 사유</label>
                    <select
                      value={withdrawForm.reasonPreset}
                      onChange={e => setWithdrawForm(f => ({ ...f, reasonPreset: e.target.value, reasonCustom: '' }))}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                    >
                      <option value="">사유를 선택하세요...</option>
                      {WITHDRAW_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* 기타: 직접 입력 */}
                  {withdrawForm.reasonPreset === '기타 (직접 입력)' && (
                    <div>
                      <label className="text-[10px] text-gray-500 mb-0.5 block">직접 입력</label>
                      <input
                        value={withdrawForm.reasonCustom}
                        onChange={e => setWithdrawForm(f => ({ ...f, reasonCustom: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none bg-white"
                        placeholder="퇴원 사유를 직접 입력하세요"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        const finalReason =
                          withdrawForm.reasonPreset === '기타 (직접 입력)'
                            ? (withdrawForm.reasonCustom.trim() || '기타')
                            : (withdrawForm.reasonPreset || '미입력');
                        setStudents(prev => prev.map(s =>
                          s.id !== selected.id ? s : {
                            ...s,
                            status: 'withdrawn',
                            withdrawDate: withdrawForm.date,
                            withdrawReason: finalReason,
                          }
                        ));
                        setEditingStudent(false);
                      }}
                      className="flex-1 text-xs py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold"
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setEditingStudent(false)}
                      className="flex-1 text-xs py-1.5 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 반 변경 폼 */}
              {editingStudent === 'class' && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-blue-700">반 변경</div>
                    <button onClick={() => setEditingStudent(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded hover:bg-blue-100">✕ 취소</button>
                  </div>
                  <div className="text-[10px] text-gray-500">현재 수강반: {classes.filter(c => (selected.classIds as string[]).includes(c.id)).map(c => c.name).join(', ') || '없음'}</div>
                  <div className="space-y-1">
                    {classes.map(c => {
                      // classIds 기준으로 checked 판단 (onChange와 일관성 유지)
                      const enrolled = (selected.classIds as string[]).includes(c.id);
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5">
                          <input type="checkbox" checked={enrolled}
                            onChange={e => {
                              // student.classIds 업데이트
                              setStudents(prev => prev.map(s => {
                                if (s.id !== selected.id) return s;
                                const ids = [...(s.classIds as string[])];
                                if (e.target.checked) { if (!ids.includes(c.id)) ids.push(c.id); }
                                else { const i = ids.indexOf(c.id); if (i >= 0) ids.splice(i, 1); }
                                return { ...s, classIds: ids };
                              }));
                              // class.studentIds도 동기 업데이트
                              setClasses(prev => prev.map(cls => {
                                if (cls.id !== c.id) return cls;
                                const ids = [...(cls.studentIds as string[])];
                                if (e.target.checked) { if (!ids.includes(selected.id)) ids.push(selected.id); }
                                else { const i = ids.indexOf(selected.id); if (i >= 0) ids.splice(i, 1); }
                                return { ...cls, studentIds: ids };
                              }));
                            }}
                          />
                          <span className="font-medium">{c.name}</span>
                          <span className="text-gray-400">{c.subject}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setEditingStudent(false)}
                      className="flex-1 text-xs py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold">
                      완료
                    </button>
                    <button onClick={() => setEditingStudent(false)}
                      className="flex-1 text-xs py-1.5 bg-white text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── 출결 현황 ── */}
            {attSummary && (
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-semibold text-gray-800">출결 현황</h3>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* 월 선택 */}
                    <input type="month"
                      className={`px-2 py-0.5 border rounded text-xs focus:outline-none ${
                        attPeriod === 'month' ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'
                      }`}
                      value={attMonth}
                      onChange={e => { setAttMonth(e.target.value); setAttPeriod('month'); }}
                    />
                    {/* 최근 3개월 */}
                    <button onClick={() => setAttPeriod('3m')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                        attPeriod === '3m' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      최근3개월
                    </button>
                    {/* 기간 선택 */}
                    <button onClick={() => setAttPeriod('custom')}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                        attPeriod === 'custom' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>
                      기간선택
                    </button>
                    {attPeriod === 'custom' && (
                      <>
                        <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs focus:outline-none"
                          value={attCStart} onChange={e => setAttCStart(e.target.value)} />
                        <span className="text-xs text-gray-400">~</span>
                        <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs focus:outline-none"
                          value={attCEnd} onChange={e => setAttCEnd(e.target.value)} />
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {[
                    { label: '출석', value: attSummary.present, color: 'text-green-600',  bg: 'bg-green-50'  },
                    { label: '결석', value: attSummary.absent,  color: 'text-red-500',    bg: 'bg-red-50'    },
                    { label: '지각', value: attSummary.late,    color: 'text-yellow-500', bg: 'bg-yellow-50' },
                    { label: '조퇴', value: attSummary.early,   color: 'text-orange-500', bg: 'bg-orange-50' },
                  ].map(item => (
                    <div key={item.label} className={`text-center ${item.bg} rounded-lg p-2`}>
                      <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${attSummary.rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  <span>출석률 = (출석 {attSummary.present} + 지각 {attSummary.late} + 조퇴 {attSummary.early}) / 총 {attSummary.total}회</span>
                  <span className="font-bold text-gray-600">{attSummary.rate}%</span>
                </div>
              </div>
            )}

            {/* ── 수강 반 (이력 포함) ── */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3">수강 반</h3>
              <div className="space-y-3">
                {historyTracks.map((track, ti) => {
                  const lastRec = track[track.length - 1];
                  const cls     = classes.find(c => c.id === lastRec.classId);
                  const teacher = cls ? users.find(u => u.id === cls.teacherId) : null;
                  return (
                    <div key={ti}>
                      {/* 현재 반 부가정보 */}
                      {cls && (
                        <div className="text-xs text-gray-400 mb-1.5">
                          <span className="font-medium text-gray-500">{cls.subject}</span>
                          {teacher && ` · 담당: ${teacher.name}`}
                          {` · ${(cls.days as string[]).join('·')}요일 ${cls.startTime}~${cls.endTime}`}
                        </div>
                      )}
                      {/* 타임라인 필 + 화살표 */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {track.map((rec, ri) => {
                          const isCurrent = !rec.endDate;
                          const months    = monthsBetween(rec.startDate, rec.endDate);
                          return (
                            <div key={rec.id} className="flex items-center gap-1">
                              <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
                                isCurrent
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-500'
                              }`}>
                                <div className="font-semibold">{rec.className}</div>
                                <div className="text-[10px] mt-0.5 font-normal opacity-80">
                                  {fmtYM(rec.startDate)} ~ {isCurrent ? '현재' : fmtYM(rec.endDate!)}
                                  <span className="ml-1">/ {months}개월</span>
                                </div>
                              </div>
                              {ri < track.length - 1 && (
                                <span className="text-gray-300 font-bold">→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 최근 테스트 결과 ── */}
            <div className="card p-4">
              {/* 헤더 행 1: 제목 + 기간 필터(월·기간) */}
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800 flex-shrink-0">최근 테스트 결과</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 월 선택 (전체 대신) */}
                  <input type="month"
                    className={`px-2 py-0.5 border rounded text-xs focus:outline-none ${
                      testMonth ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'
                    }`}
                    value={testMonth}
                    onChange={e => { setTestMonth(e.target.value); setTestPeriod('all'); }}
                  />
                  {/* 기간 버튼 (1m / 3m / 6m) */}
                  {(['1m', '3m', '6m'] as const).map(p => (
                    <button key={p}
                      onClick={() => { setTestPeriod(p); setTestMonth(''); }}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        !testMonth && testPeriod === p
                          ? 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-slate-400'
                      }`}>
                      {p === '1m' ? '1개월' : p === '3m' ? '3개월' : '6개월'}
                    </button>
                  ))}
                  {(testMonth || testPeriod !== 'all') && (
                    <button onClick={() => { setTestMonth(''); setTestPeriod('all'); }}
                      className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50">✕</button>
                  )}
                </div>
              </div>
              {/* 헤더 행 2: 반 선택 + 테스트 종류 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {/* 반 선택 버튼 */}
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setTestClassId('all')}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      testClassId === 'all'
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}>전체반</button>
                  {classes.filter(c => (selected.classIds as string[]).includes(c.id)).map(c => (
                    <button key={c.id} onClick={() => setTestClassId(c.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        testClassId === c.id
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                      }`}>{c.name}</button>
                  ))}
                </div>
                {/* 테스트 종류 버튼 */}
                <div className="ml-auto flex gap-1">
                  {(['all', 'daily', 'weekly', 'monthly'] as const).map(t => (
                    <button key={t} onClick={() => setTestType(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        testType === t
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                      }`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {filteredScores.length === 0 ? (
                <div className="py-8 text-center text-gray-300 text-sm">해당 기간의 테스트 결과가 없습니다</div>
              ) : (
                <>
                  {/* 점수 추이 차트 */}
                  <div style={{ height: 140 }} className="mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const d = payload[0].payload as { date: string; score: number; label: string; type: string };
                            const color = TYPE_COLORS[d.type] ?? '#6366f1';
                            return (
                              <div style={{
                                background: '#fff', border: '1px solid #e2e8f0',
                                borderRadius: 8, padding: '6px 10px', fontSize: 11,
                              }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>{d.label}</div>
                                <div style={{ color }}>점수: <b>{d.score}점</b></div>
                              </div>
                            );
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke={
                            testType === 'all' ? '#6366f1' : (TYPE_COLORS[testType] ?? '#6366f1')
                          }
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 점수 목록 */}
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {filteredScores.map((score, i) => {
                      const pct   = Math.round(score.score / score.maxScore * 100);
                      const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500';
                      const bar   = pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400';
                      return (
                        <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg text-sm">
                          <span className="text-xs text-gray-400 w-20 flex-shrink-0">{score.date}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                            style={{
                              background: `${TYPE_COLORS[score.type]}18`,
                              color: TYPE_COLORS[score.type] ?? '#6366f1',
                            }}
                          >
                            {TYPE_LABELS[score.type]}
                          </span>
                          <span className="flex-1 text-gray-700 font-medium truncate">{score.testName}</span>
                          <span className={`text-xs font-bold flex-shrink-0 ${color}`}>
                            {score.score}/{score.maxScore}
                          </span>
                          <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
