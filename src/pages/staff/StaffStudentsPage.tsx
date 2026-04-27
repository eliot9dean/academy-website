import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTableData } from '../../hooks/useTableData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type {
  Student, ClassInfo, AttendanceRecord, TestScore, User, ClassHistoryRecord,
} from '../../types';

// ── 상수 ────────────────────────────────────────────────────────
const TODAY = '2026-04-23';

const DEFAULT_MESSAGE =
  `안녕하세요, {학생명} 학부모님.\n` +
  `이번 달({미납기간}) 수강료가 아직 납부되지 않았습니다.\n` +
  `납부 기한은 {납부기한}까지이오니, 빠른 시일 내에 납부 부탁드립니다.\n` +
  `감사합니다. - 학원 드림`;

const TYPE_LABELS: Record<string, string> = {
  all: '전체', daily: '단어테스트', weekly: '주간테스트', monthly: '월간평가',
};
const TYPE_COLORS: Record<string, string> = {
  daily: '#6366f1', weekly: '#0ea5e9', monthly: '#10b981',
};

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
  const [testType,   setTestType]   = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [testPeriod, setTestPeriod] = useState<'all' | '1m' | '3m' | '6m'>('all');

  // 납부 메시지 / 웹훅 설정
  const [editingPayment, setEditingPayment] = useState(false);
  const [webhookUrl,      setWebhookUrl]     = useLocalStorage<string>('ams_webhook_url',      '');
  const [paymentMessage,  setPaymentMessage] = useLocalStorage<string>('ams_payment_message',  DEFAULT_MESSAGE);
  const [tempWebhook,     setTempWebhook]    = useState('');
  const [tempMsg,         setTempMsg]        = useState('');
  const [sending,         setSending]        = useState(false);

  // 데이터
  const [students]     = useTableData<Student>('students');
  const [classes]      = useTableData<ClassInfo>('classes');
  const [attendance]   = useTableData<AttendanceRecord>('attendance');
  const [testScores]   = useTableData<TestScore>('testScores');
  const [users]        = useTableData<User>('users');
  const [classHistory] = useTableData<ClassHistoryRecord>('classHistory');

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

  /** 출결 요약 (출석률 = 출석+지각+조퇴 / 총일수) */
  const attSummary = useMemo(() => {
    if (!selected) return null;
    const recs    = attendance.filter(a => a.studentId === selected.id);
    const present = recs.filter(r => r.status === 'present').length;
    const absent  = recs.filter(r => r.status === 'absent').length;
    const late    = recs.filter(r => r.status === 'late').length;
    const early   = recs.filter(r => r.status === 'early_leave').length;
    const total   = recs.length;
    const rate    = total > 0 ? Math.round((present + late + early) / total * 100) : 0;
    return { present, absent, late, early, total, rate };
  }, [selected, attendance]);

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

  /** 필터된 테스트 점수 (내림차순) */
  const filteredScores = useMemo(() => {
    if (!selected) return [];
    const start = getPresetStart(testPeriod);
    return testScores
      .filter(t => t.studentId === selected.id)
      .filter(t => testType === 'all' || t.type === testType)
      .filter(t => !start || t.date >= start)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selected, testScores, testType, testPeriod]);

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

  const tuitionPeriod = selected ? calcTuitionPeriod(selected.tuitionDueDate) : null;

  // ── 납부 관련 핸들러 ────────────────────────────────────────
  const openEditPayment = () => {
    setTempWebhook(webhookUrl);
    setTempMsg(paymentMessage);
    setEditingPayment(true);
  };
  const savePayment = () => {
    setWebhookUrl(tempWebhook);
    setPaymentMessage(tempMsg);
    setEditingPayment(false);
  };

  const sendWebhook = async () => {
    if (!selected) return;

    // ① 편집 패널이 열려있으면 먼저 저장 (state 동기화 문제 우회)
    if (editingPayment) {
      setWebhookUrl(tempWebhook);
      setPaymentMessage(tempMsg);
      setEditingPayment(false);
    }

    // ② 가장 최신값을 우선순위로 확인
    //    편집 패널 tempWebhook > React state webhookUrl > localStorage 직접 읽기
    let effectiveUrl =
      editingPayment && tempWebhook.trim()
        ? tempWebhook.trim()
        : webhookUrl.trim();

    if (!effectiveUrl) {
      // localStorage를 직접 확인 (state 갱신 지연 대비)
      try {
        const raw = window.localStorage.getItem('ams_webhook_url');
        if (raw) effectiveUrl = (JSON.parse(raw) as string).trim();
      } catch { /* ignore */ }
    }

    if (!effectiveUrl) {
      openEditPayment();
      return;
    }

    const effectiveMsg = editingPayment ? tempMsg : paymentMessage;
    const period = calcTuitionPeriod(selected.tuitionDueDate);
    const unpaidPeriod = `${period.start} ~ ${period.end}`;
    const filledMsg = effectiveMsg
      .replace(/{학생명}/g,  selected.name)
      .replace(/{미납기간}/g, unpaidPeriod)
      .replace(/{납부기한}/g, selected.tuitionDueDate);

    const payload = {
      studentName:  selected.name,
      unpaidPeriod,
      dueDate:      selected.tuitionDueDate,
      message:      filledMsg,
      parentName:   selected.parentName,
      parentPhone:  selected.parentPhone,
    };

    setSending(true);
    try {
      await fetch(effectiveUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      alert(`📤 납부 요청 문자 발송 완료!\n학부모: ${selected.parentName} (${selected.parentPhone})`);
    } catch {
      alert('❌ 발송 중 오류가 발생했습니다.\n웹훅 주소를 확인해주세요.');
    } finally {
      setSending(false);
    }
  };

  // ── 렌더링 ──────────────────────────────────────────────────
  return (
    <div className="flex gap-5 h-[calc(100vh-7rem)]">

      {/* ── 학생 목록 ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-3">학생 정보</h1>
          <input
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-300"
            placeholder="학생명, 학교, 학년 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
                  setTestType('all');
                  setTestPeriod('all');
                  setEditingPayment(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedId === stu.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                    {stu.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{stu.name}</div>
                    <div className="text-xs text-gray-400">{stu.grade} · {stu.school}</div>
                  </div>
                  {!stu.tuitionPaid && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">미납</span>
                  )}
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
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      selected.tuitionPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {selected.tuitionPaid ? '수강료 납부' : '수강료 미납'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 출결 현황 ── */}
            {attSummary && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-800 mb-3">출결 현황</h3>
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
              {/* 헤더: 제목 + 종류 필터 + 기간 필터 */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <h3 className="font-semibold text-gray-800 flex-shrink-0">최근 테스트 결과</h3>

                {/* 테스트 종류 버튼 */}
                <div className="flex gap-1">
                  {(['all', 'daily', 'weekly', 'monthly'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTestType(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        testType === t
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>

                {/* 기간 필터 */}
                <div className="ml-auto flex gap-1">
                  {(['all', '1m', '3m', '6m'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setTestPeriod(p)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        testPeriod === p
                          ? 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-slate-400'
                      }`}
                    >
                      {p === 'all' ? '전체' : p === '1m' ? '1개월' : p === '3m' ? '3개월' : '6개월'}
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

            {/* ── 수강료 정보 ── */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-800">수강료 정보</h3>
                {!selected.tuitionPaid && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={openEditPayment}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1"
                    >
                      ✏️ 납부메시지 수정
                    </button>
                    <button
                      onClick={sendWebhook}
                      disabled={sending}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {sending ? '⏳ 발송 중...' : '📤 납부 요청 문자 발송'}
                    </button>
                  </div>
                )}
              </div>

              {/* 납부 기한 + 해당 수강 기간 */}
              <div className={`flex items-start gap-3 p-3 rounded-lg ${
                selected.tuitionPaid ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">
                      납부 기한: {selected.tuitionDueDate}
                    </span>
                    {tuitionPeriod && (
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded">
                        ({tuitionPeriod.start} ~ {tuitionPeriod.end})
                      </span>
                    )}
                  </div>
                  <div className={`text-sm mt-1 font-medium ${
                    selected.tuitionPaid ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {selected.tuitionPaid ? '✓ 납부 완료' : '✗ 미납 상태'}
                  </div>
                </div>
              </div>

              {/* 납부메시지 / 웹훅 편집 패널 */}
              {editingPayment && (
                <div className="mt-3 border border-indigo-200 rounded-xl p-3 bg-indigo-50">
                  <div className="mb-2.5">
                    <label className="block text-xs font-semibold text-indigo-700 mb-1">
                      📡 웹훅 주소 (Make / Zapier)
                    </label>
                    <input
                      className="w-full px-3 py-1.5 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400"
                      placeholder="https://hook.make.com/..."
                      value={tempWebhook}
                      onChange={e => setTempWebhook(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-indigo-700 mb-1">
                      💬 납부 요청 메시지
                      <span className="font-normal text-indigo-400 ml-1">
                        (변수: {'{학생명}'} {'{미납기간}'} {'{납부기한}'})
                      </span>
                    </label>
                    <textarea
                      className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
                      rows={5}
                      value={tempMsg}
                      onChange={e => setTempMsg(e.target.value)}
                    />
                    {/* 미리보기 */}
                    {selected && (
                      <div className="mt-1.5 p-2 bg-white border border-dashed border-indigo-200 rounded-lg text-[11px] text-gray-500 whitespace-pre-line leading-relaxed">
                        <span className="text-indigo-400 font-semibold block mb-1">미리보기</span>
                        {tempMsg
                          .replace(/{학생명}/g,  selected.name)
                          .replace(/{미납기간}/g, tuitionPeriod ? `${tuitionPeriod.start} ~ ${tuitionPeriod.end}` : '')
                          .replace(/{납부기한}/g, selected.tuitionDueDate)
                        }
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingPayment(false)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white transition-all"
                    >
                      취소
                    </button>
                    <button
                      onClick={savePayment}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
