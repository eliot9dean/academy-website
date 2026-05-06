import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useTableData } from '../../hooks/useTableData';
import type {
  Student, ClassInfo, AttendanceRecord, TestScore, DailyProgress, User, HomeworkResult,
} from '../../types';

const ATT_LABEL: Record<string, string> = { present: '출석', absent: '결석', late: '지각', early_leave: '조퇴' };
const ATT_COLOR: Record<string, string> = {
  present:     'bg-green-100 text-green-700',
  absent:      'bg-red-100 text-red-700',
  late:        'bg-yellow-100 text-yellow-700',
  early_leave: 'bg-orange-100 text-orange-700',
};
const ATT_FILL: Record<string, string> = {
  present: '#22c55e', absent: '#ef4444', late: '#f59e0b', early_leave: '#f97316',
};

const MONTH_OPTIONS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const DEFAULT_MONTH = '2026-04';

function MonthSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y] = value.split('-');
  return (
    <select
      className="form-select text-xs"
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {MONTH_OPTIONS.map(m => (
        <option key={m} value={`${y}-${m}`}>{y}년 {Number(m)}월</option>
      ))}
    </select>
  );
}

// ── 점수별 색상 (CSS용) ──────────────────────────────────────────────────────
function getScoreCssColor(score: number): string {
  if (score === 100) return '#a855f7';
  if (score >= 90)   return '#3b82f6';
  if (score >= 80)   return '#22c55e';
  if (score >= 60)   return '#f97316';
  return '#ef4444';
}


export default function ParentDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'scores' | 'report'>('overview');
  // 성적표 기준 월
  const [reportMonth, setReportMonth] = useState(DEFAULT_MONTH);

  // ── 탭별 기간 선택 상태 ──────────────────────────────────────────────────
  const [attMonth,      setAttMonth]      = useState(DEFAULT_MONTH);
  const [scoreMonth,    setScoreMonth]    = useState(DEFAULT_MONTH);
  const [overviewMonth, setOverviewMonth] = useState(DEFAULT_MONTH);

  const { currentUser } = useAuth();
  const [students]      = useTableData<Student>('students');
  const [classes]       = useTableData<ClassInfo>('classes');
  const [attendance]    = useTableData<AttendanceRecord>('attendance');
  const [testScores]    = useTableData<TestScore>('testScores');
  const [dailyProgress] = useTableData<DailyProgress>('dailyProgress');
  const [users]         = useTableData<User>('users');
  const [homeworks]     = useTableData<HomeworkResult>('homework');

  const student = students.find(s => s.parentName === currentUser?.name) ?? students.find(s => s.id === 's1');

  if (!student) {
    return <div className="p-8 text-gray-400 text-center">자녀 정보를 찾을 수 없습니다.</div>;
  }

  const studentClasses = classes.filter(c => (c.studentIds as string[]).includes(student.id));
  const allAttRecords  = attendance.filter(a => a.studentId === student.id);
  const allTestScores  = testScores.filter(t => t.studentId === student.id);

  // ── 출결 탭 데이터 ───────────────────────────────────────────────────────
  const attRecords = useMemo(
    () => allAttRecords.filter(a => a.date.startsWith(attMonth)),
    [allAttRecords, attMonth],
  );
  const attPresentCount    = attRecords.filter(r => r.status === 'present').length;
  const attAbsentCount     = attRecords.filter(r => r.status === 'absent').length;
  const attLateCount       = attRecords.filter(r => r.status === 'late').length;
  const attEarlyLeaveCount = attRecords.filter(r => r.status === 'early_leave').length;
  const attTotal           = attRecords.length;
  const attRate            = attTotal > 0 ? Math.round(attPresentCount / attTotal * 100) : 0;

  const attStatusData = [
    { status: '출석', count: attPresentCount,    fill: ATT_FILL.present },
    { status: '결석', count: attAbsentCount,     fill: ATT_FILL.absent },
    { status: '지각', count: attLateCount,       fill: ATT_FILL.late },
    { status: '조퇴', count: attEarlyLeaveCount, fill: ATT_FILL.early_leave },
  ];

  // 캘린더 동적 계산
  const [attYear, attMonthNum] = attMonth.split('-').map(Number);
  const calFirstDay    = new Date(attYear, attMonthNum - 1, 1).getDay();
  const calDaysInMonth = new Date(attYear, attMonthNum, 0).getDate();

  // ── 성적 탭 데이터 ───────────────────────────────────────────────────────
  const scoreMonthScores = useMemo(
    () => allTestScores.filter(t => t.date.startsWith(scoreMonth)),
    [allTestScores, scoreMonth],
  );

  const dailyScoreData = useMemo(() =>
    scoreMonthScores
      .filter(t => t.type === 'daily')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(t => ({ date: t.date.slice(5), 점수: t.score, testName: t.testName })),
    [scoreMonthScores],
  );

  const dailyScoreList  = scoreMonthScores.filter(t => t.type === 'daily').sort((a, b) => b.date.localeCompare(a.date));
  const weeklyScoreList = scoreMonthScores
    .filter(t => t.type === 'weekly' || t.type === 'monthly')
    .sort((a, b) => b.date.localeCompare(a.date));

  // ── 전체현황 탭 데이터 ───────────────────────────────────────────────────
  const overviewScores = useMemo(
    () => allTestScores.filter(t => t.date.startsWith(overviewMonth)),
    [allTestScores, overviewMonth],
  );

  const overviewAllAtt  = allAttRecords.filter(a => a.date.startsWith(overviewMonth));
  const overviewPresent = overviewAllAtt.filter(r => r.status === 'present').length;
  const overviewAbsent  = overviewAllAtt.filter(r => r.status === 'absent').length;
  const overviewAttRate = overviewAllAtt.length > 0 ? Math.round(overviewPresent / overviewAllAtt.length * 100) : 0;

  // 데일리 테스트 현황
  const overviewDailyScores = overviewScores.filter(t => t.type === 'daily');
  const overviewDailyAvg    = overviewDailyScores.length > 0
    ? Math.round(overviewDailyScores.reduce((s, t) => s + t.score, 0) / overviewDailyScores.length) : null;
  const overviewDailyCount  = overviewDailyScores.length;

  // 주간/월간 시험 현황
  const overviewWeeklyScores  = overviewScores.filter(t => t.type === 'weekly');
  const overviewMonthlyScores = overviewScores.filter(t => t.type === 'monthly');
  const overviewWeeklyAvg     = overviewWeeklyScores.length > 0
    ? Math.round(overviewWeeklyScores.reduce((s, t) => s + t.score, 0) / overviewWeeklyScores.length) : null;
  const overviewMonthlyAvg    = overviewMonthlyScores.length > 0
    ? Math.round(overviewMonthlyScores.reduce((s, t) => s + t.score, 0) / overviewMonthlyScores.length) : null;

  // 과제 수행 현황
  const overviewHW = useMemo(
    () => homeworks.filter(h => h.studentId === student.id && h.date.startsWith(overviewMonth)),
    [homeworks, student.id, overviewMonth],
  );
  const hwSubmitted    = overviewHW.filter(h => h.result !== 'not_submitted').length;
  const hwNotSubmitted = overviewHW.filter(h => h.result === 'not_submitted').length;
  const hwRate         = overviewHW.length > 0 ? Math.round(hwSubmitted / overviewHW.length * 100) : 0;

  // 성적 추이 (전체 기간 주간/월간 통합) — 전체현황 탭 성적 추이 카드용
  const overviewTrendData = useMemo(() =>
    allTestScores
      .filter(t => t.type === 'weekly' || t.type === 'monthly')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(t => ({
        date: t.date.slice(5),
        점수: t.score,
        반평균: Math.round(
          testScores.filter(s => s.classId === t.classId && s.date === t.date && s.type === t.type)
            .reduce((sum, s) => sum + s.score, 0) /
          Math.max(1, testScores.filter(s => s.classId === t.classId && s.date === t.date && s.type === t.type).length)
        ),
      })),
    [allTestScores, testScores],
  );

  // 주간 시험 성적 추이 — 성적현황 탭 좌측 카드용
  const weeklyTrendData = useMemo(() =>
    allTestScores
      .filter(t => t.type === 'weekly')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(t => ({
        date: t.date.slice(5),
        점수: t.score,
        반평균: Math.round(
          testScores.filter(s => s.classId === t.classId && s.date === t.date && s.type === t.type)
            .reduce((sum, s) => sum + s.score, 0) /
          Math.max(1, testScores.filter(s => s.classId === t.classId && s.date === t.date && s.type === t.type).length)
        ),
      })),
    [allTestScores, testScores],
  );

  // 월간 시험 성적 추이 — 성적현황 탭 우측 카드용
  const monthlyTrendData = useMemo(() =>
    allTestScores
      .filter(t => t.type === 'monthly')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(t => ({
        date: t.date.slice(5),
        점수: t.score,
        반평균: Math.round(
          testScores.filter(s => s.classId === t.classId && s.date === t.date && s.type === t.type)
            .reduce((sum, s) => sum + s.score, 0) /
          Math.max(1, testScores.filter(s => s.classId === t.classId && s.date === t.date && s.type === t.type).length)
        ),
      })),
    [allTestScores, testScores],
  );

  // 최근 수업 내용 — 반별 그룹 (3열 배치용) — 오늘 이전 날짜만 표시
  const TODAY_DATE = new Date().toISOString().slice(0, 10);
  const progressByClass = useMemo(() =>
    studentClasses.map(cls => ({
      cls,
      teacher: users.find(u => u.id === cls.teacherId),
      items: dailyProgress
        .filter(p => p.classId === cls.id && p.date <= TODAY_DATE)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4),
    })),
    [dailyProgress, studentClasses, users],
  );

  const colCount = Math.min(Math.max(studentClasses.length, 1), 3);

  const TABS = [
    { id: 'overview'   as const, label: '전체 현황', icon: '🏠' },
    { id: 'attendance' as const, label: '출결 현황', icon: '✅' },
    { id: 'scores'     as const, label: '성적 현황', icon: '📊' },
    { id: 'report'     as const, label: '성적표',    icon: '📄' },
  ];

  return (
    <div>
      {/* ── 학생 헤더 ─────────────────────────────────────────────────────── */}
      <div className="card p-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow">
            {student.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.name} 학생</h1>
            <p className="text-sm text-gray-500">{student.grade} · {student.school}</p>
            <div className="flex gap-2 mt-1.5">
              {studentClasses.map(c => (
                <span key={c.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{c.name}</span>
              ))}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className={`text-lg font-bold ${overviewAttRate >= 90 ? 'text-green-600' : overviewAttRate >= 70 ? 'text-yellow-600' : 'text-red-500'}`}>
              출석률 {overviewAttRate}%
            </div>
            <div className="text-xs text-gray-400">{overviewMonth} 기준</div>
          </div>
        </div>
      </div>

      {/* ── 탭 네비게이션 ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━ TAB: 전체 현황 ━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">전체 현황</h2>
            <MonthSelect value={overviewMonth} onChange={setOverviewMonth} />
          </div>

          {/* ── 4개 카테고리 요약 카드 — 한 행 4열 ────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            {/* 출결현황 */}
            <div className="card p-4" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span>✅</span>
                <span className="font-semibold text-sm text-gray-700">출결현황</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-0.5">{overviewAttRate}%</div>
              <div className="text-xs text-gray-400 mb-2">출석률</div>
              <div className="flex gap-3 text-xs">
                <span className="text-green-600 font-semibold">출석 {overviewPresent}회</span>
                <span className="text-red-500 font-semibold">결석 {overviewAbsent}회</span>
              </div>
            </div>

            {/* 과제수행현황 */}
            <div className="card p-4" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span>📝</span>
                <span className="font-semibold text-sm text-gray-700">과제수행현황</span>
              </div>
              <div className="text-2xl font-bold text-amber-500 mb-0.5">
                {overviewHW.length > 0 ? `${hwRate}%` : '—'}
              </div>
              <div className="text-xs text-gray-400 mb-2">제출률</div>
              <div className="flex gap-3 text-xs">
                <span className="text-amber-600 font-semibold">완료 {hwSubmitted}건</span>
                <span className="text-gray-400 font-semibold">미완료 {hwNotSubmitted}건</span>
              </div>
            </div>

            {/* 데일리테스트 현황 */}
            <div className="card p-4" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span>📊</span>
                <span className="font-semibold text-sm text-gray-700">데일리테스트</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-0.5">
                {overviewDailyAvg !== null ? `${overviewDailyAvg}점` : '—'}
              </div>
              <div className="text-xs text-gray-400 mb-2">평균 점수</div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-600 font-semibold">{overviewDailyCount}건 실시</span>
              </div>
            </div>

            {/* 주간/월간시험 현황 */}
            <div className="card p-4" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span>📋</span>
                <span className="font-semibold text-sm text-gray-700">주간/월간시험</span>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-0.5">
                {overviewWeeklyAvg !== null ? `${overviewWeeklyAvg}점` : '—'}
              </div>
              <div className="text-xs text-gray-400 mb-2">주간 평균</div>
              <div className="flex gap-3 text-xs">
                <span className="text-purple-600 font-semibold">
                  월간 {overviewMonthlyAvg !== null ? `${overviewMonthlyAvg}점` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* ── 성적 추이 (카드 바로 아래) ───────────────────────────────── */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">성적 추이</h3>
            {overviewTrendData.length === 0 ? (
              <p className="text-gray-400 text-sm">시험 데이터가 없습니다</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={overviewTrendData} margin={{ left: -10, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="점수" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5 }}
                    label={{ position: 'top', fontSize: 10, fill: '#3b82f6', formatter: (v: unknown) => `${v}점` }} />
                  <Line type="monotone" dataKey="반평균" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── 최근 수업 내용 — 3열, 반별 상하 구분 ────────────────────── */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">최근 수업 내용</h3>
            {progressByClass.every(g => g.items.length === 0) ? (
              <p className="text-gray-400 text-sm">수업 기록이 없습니다</p>
            ) : (
              <div
                className="gap-3"
                style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
              >
                {progressByClass.map(({ cls, teacher, items }) => (
                  <div key={cls.id} className="bg-gray-50 rounded-xl p-3">
                    {/* 반 헤더 */}
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-200">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        {cls.name}
                      </span>
                      {teacher && (
                        <span className="text-xs text-gray-400">{teacher.name} 선생님</span>
                      )}
                    </div>
                    {/* 수업 목록 (상하 배치) */}
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2 text-center">수업 기록 없음</p>
                      ) : items.map((p, i) => (
                        <div key={i} className="p-2 bg-white rounded-lg border border-gray-100">
                          <div className="text-[11px] text-gray-400 mb-1">{p.date}</div>
                          <div className="text-xs text-gray-700 mb-0.5">
                            <strong>진도:</strong> {p.content}
                          </div>
                          <div className="text-xs text-gray-600">
                            <strong>과제:</strong> {p.homework}
                          </div>
                          {p.parentMessage && (
                            <div className="mt-1.5 p-1.5 bg-blue-50 rounded text-[11px] text-blue-700">
                              💬 {p.parentMessage}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━ TAB: 출결 현황 ━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">출결 현황</h2>
            <MonthSelect value={attMonth} onChange={setAttMonth} />
          </div>

          {/* 출결 캘린더 */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">출결 캘린더</h3>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['일','월','화','수','목','금','토'].map(d => (
                <div key={d} className="text-xs text-gray-500 font-semibold py-1">{d}</div>
              ))}
              {Array.from({ length: calFirstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: calDaysInMonth }, (_, i) => {
                const day     = i + 1;
                const dateStr = `${attMonth}-${String(day).padStart(2, '0')}`;
                const record  = attRecords.find(a => a.date === dateStr);
                return (
                  <div
                    key={day}
                    className={`rounded-lg text-xs font-medium py-1.5 ${
                      !record              ? 'text-gray-300' :
                      record.status === 'present'     ? 'bg-green-100 text-green-700' :
                      record.status === 'absent'      ? 'bg-red-100 text-red-700' :
                      record.status === 'late'        ? 'bg-yellow-100 text-yellow-700' :
                      'bg-orange-100 text-orange-700'
                    }`}
                    title={record ? ATT_LABEL[record.status] : ''}
                  >
                    <div className="text-[11px] font-semibold">{day}</div>
                    {record && (
                      <div className="text-[9px] leading-tight mt-0.5 font-medium">
                        {ATT_LABEL[record.status]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 justify-center flex-wrap">
              {(['present','absent','late','early_leave'] as const).map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${ATT_COLOR[s].split(' ')[0]}`} />
                  <span className="text-xs text-gray-500">{ATT_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 출결 통계 (섹션명 변경 + 비율 추가) */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-1">출결 통계</h3>
            <p className="text-xs text-gray-400 mb-4">
              총 {attTotal}회 · 출석률 {attRate}%
            </p>

            {attTotal === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">해당 월 출결 데이터가 없습니다</p>
            ) : (
              <>
                {/* 커스텀 HTML 수평 바 — 우측에 N회(X%) 라벨 표시 */}
                <div className="space-y-3 mb-5">
                  {attStatusData.map(d => {
                    const pct = attTotal > 0 ? Math.round(d.count / attTotal * 100) : 0;
                    const barW = attTotal > 0 ? (d.count / attTotal * 100) : 0;
                    return (
                      <div key={d.status} className="flex items-center gap-3">
                        <div className="w-8 text-xs font-bold text-gray-500 text-right shrink-0">
                          {d.status}
                        </div>
                        <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${barW}%`, background: d.fill, minWidth: d.count > 0 ? '8px' : '0' }}
                          />
                        </div>
                        <div className="text-xs font-bold shrink-0 w-24 text-right"
                          style={{ color: d.fill }}>
                          {d.count}회 ({pct}%)
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 카드형 요약 */}
                <div className="grid grid-cols-4 gap-2">
                  {attStatusData.map(d => (
                    <div key={d.status} className="rounded-xl p-2.5 text-center"
                      style={{ background: `${d.fill}18`, border: `1px solid ${d.fill}40` }}>
                      <div className="text-lg font-bold" style={{ color: d.fill }}>{d.count}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>{d.status}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━ TAB: 성적 현황 ━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">성적 현황</h2>
            <MonthSelect value={scoreMonth} onChange={setScoreMonth} />
          </div>

          {/* 데일리 테스트 점수 — 색상 분포 */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-2">데일리 테스트 점수</h3>
            {/* 색상 범례 */}
            <div className="flex gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm"
                  style={{ background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)' }} />
                <span className="text-[11px] text-gray-500">100점</span>
              </div>
              {[
                { label: '90~99점', color: '#3b82f6' },
                { label: '80~89점', color: '#22c55e' },
                { label: '60~79점', color: '#f97316' },
                { label: '59점↓',  color: '#ef4444' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                  <span className="text-[11px] text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>

            {dailyScoreData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">해당 월 데일리 테스트 데이터가 없습니다</p>
            ) : (
              /* 커스텀 HTML 수직 바 — 점수 라벨 + 무지개 그라데이션(100점) */
              <div>
                {/* 바 + Y축 격자 (고정 높이 180px, X축 레이블과 분리) */}
                <div className="relative" style={{ height: 180 }}>
                  {/* Y축 격자선 */}
                  <div className="flex flex-col-reverse h-full">
                    {[0, 25, 50, 75, 100].map(v => (
                      <div key={v} className="flex items-center" style={{ flex: 1 }}>
                        <span className="text-[10px] text-gray-400 w-6 text-right shrink-0">{v}</span>
                        <div className="flex-1 border-t border-dashed border-gray-100 ml-1" />
                      </div>
                    ))}
                  </div>
                  {/* 바 차트 (정확히 180px 이내) */}
                  <div className="absolute inset-0 flex items-end pl-7 pr-1">
                    <div className="flex items-end gap-1 w-full h-full">
                      {dailyScoreData.map((d, i) => {
                        const barH = (d.점수 / 100) * 168;
                        const isRainbow = d.점수 === 100;
                        const cssColor = getScoreCssColor(d.점수);
                        const barBg = isRainbow
                          ? 'linear-gradient(to top, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7)'
                          : cssColor;
                        return (
                          <div key={i} className="flex flex-col items-center justify-end flex-1 min-w-0 h-full">
                            <div
                              className="text-[10px] font-bold mb-0.5 leading-none"
                              style={{ color: cssColor }}
                            >
                              {d.점수}점
                            </div>
                            <div
                              className="w-full rounded-t"
                              style={{ height: barH, background: barBg, minHeight: 4 }}
                              title={`${d.testName}: ${d.점수}점`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* X축 날짜 레이블 (바 차트 바깥, 겹침 없음) */}
                <div className="flex pl-7 pr-1 mt-1 gap-1">
                  {dailyScoreData.map((d, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-gray-500 font-medium">{d.date.slice(3)}일</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 주간 / 월간 성적 추이 — 좌우 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 주간 시험 성적 추이 */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3">📊 주간 시험 성적 추이</h3>
              {weeklyTrendData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">주간 시험 데이터가 없습니다</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyTrendData} margin={{ left: -10, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="점수" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 5 }} name={`${student.name} 점수`} />
                    <Line type="monotone" dataKey="반평균" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="반 평균" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* 월간 시험 성적 추이 */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-800 mb-3">🏆 월간 시험 성적 추이</h3>
              {monthlyTrendData.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">월간 시험 데이터가 없습니다</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyTrendData} margin={{ left: -10, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="점수" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 5 }} name={`${student.name} 점수`} />
                    <Line type="monotone" dataKey="반평균" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="반 평균" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 시험 점수 내역 — 좌우 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 데일리 테스트 내역 — 3열 그리드 */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">데일리</span>
                <h3 className="font-semibold text-gray-800 text-sm">데일리 테스트 내역</h3>
                <span className="text-xs text-gray-400 ml-auto">{dailyScoreList.length}건</span>
              </div>
              {dailyScoreList.length === 0 ? (
                <div className="px-4 py-6 text-xs text-gray-400 text-center">해당 기간 데이터 없음</div>
              ) : (
                <div className="grid grid-cols-3 gap-2 p-3">
                  {dailyScoreList.map((t, i) => {
                    const color = getScoreCssColor(t.score);
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-2 text-center border"
                        style={{ borderColor: `${color}40`, background: `${color}0E` }}
                      >
                        <div className="text-lg font-bold" style={{ color }}>{t.score}점</div>
                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate" title={t.testName}>
                          {t.testName}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{t.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 주간·월간 시험 내역 */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700">주간·월간</span>
                <h3 className="font-semibold text-gray-800 text-sm">주간·월간 시험 내역</h3>
                <span className="text-xs text-gray-400 ml-auto">{weeklyScoreList.length}건</span>
              </div>
              <div className="divide-y divide-gray-50">
                {weeklyScoreList.length === 0 ? (
                  <div className="px-4 py-6 text-xs text-gray-400 text-center">해당 기간 데이터 없음</div>
                ) : weeklyScoreList.map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="font-medium text-gray-700 text-sm">{t.testName}</div>
                      <div className="text-xs text-gray-400">
                        {t.date} ·{' '}
                        <span className={`font-medium ${t.type === 'weekly' ? 'text-purple-600' : 'text-amber-600'}`}>
                          {t.type === 'weekly' ? '주간' : '월간'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${t.score >= 80 ? 'text-green-600' : t.score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {t.score}점
                      </div>
                      <div className="text-xs text-gray-400">/{t.maxScore}점</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━ TAB: 성적표 ━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'report' && (() => {
        // ── 색상 유틸 ──────────────────────────────────────────────────────
        const SC = (v:number, max:number): React.CSSProperties => {
          const p = max > 0 ? v/max*100 : 0;
          if(p>=90) return {backgroundColor:'#DCFCE7',color:'#15803D'};
          if(p>=75) return {backgroundColor:'#DBEAFE',color:'#1D4ED8'};
          if(p>=60) return {backgroundColor:'#FEF9C3',color:'#92400E'};
          return {backgroundColor:'#FEE2E2',color:'#DC2626'};
        };
        const FIELD_COLORS = ['#6366F1','#3B82F6','#10B981','#F59E0B','#EF4444'];

        // ── 선택 월 기간 계산 ────────────────────────────────────────────
        const [rptY, rptM] = reportMonth.split('-').map(Number);
        const rptMonthStart = `${reportMonth}-01`;
        const rptMonthEnd   = `${reportMonth}-${String(new Date(rptY, rptM, 0).getDate()).padStart(2, '0')}`;
        const m3StartDate   = new Date(rptY, rptM - 3, 1);
        const m3Start       = `${m3StartDate.getFullYear()}-${String(m3StartDate.getMonth() + 1).padStart(2, '0')}-01`;

        // ── 반별 성적표 카드 렌더링 ──────────────────────────────────────

        return (
          <div className="space-y-4">
            {/* ── 헤더: 월 선택기 ── */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">성적표</h2>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500">📅 기준 월</span>
                <input type="month"
                  className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold"
                  style={{ color: '#4F46E5' }}
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)} />
              </div>
            </div>

            {/* ── 반별 카드 ── */}
            {studentClasses.length === 0 ? (
              <div className="card p-8 text-center text-gray-400 text-sm">등록된 수업이 없습니다</div>
            ) : (
              <div className="flex flex-wrap gap-6 justify-center">
              {studentClasses.map(cls => {
                const stuColor = '#6366F1';
                const teacher  = users.find(u => u.id === cls.teacherId);

                // ── 반 전체 데이터 (평균 계산용) ──
                const clsDailyAll = testScores.filter(t => t.classId === cls.id && t.type === 'daily'   && t.date >= rptMonthStart && t.date <= rptMonthEnd);
                const clsWeekly   = testScores.filter(t => t.classId === cls.id && t.type === 'weekly'  && t.date >= rptMonthStart && t.date <= rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));
                const clsMonthly  = testScores.filter(t => t.classId === cls.id && t.type === 'monthly' && t.date >= m3Start        && t.date <= rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));

                // ── 내 데이터 ──
                const stuDailyAll  = allTestScores.filter(t => t.classId === cls.id && t.type === 'daily'   && t.date >= rptMonthStart && t.date <= rptMonthEnd);
                const stuWeeklyAll = allTestScores.filter(t => t.classId === cls.id && t.type === 'weekly'  && t.date >= rptMonthStart && t.date <= rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));
                const stuMonthlyAll= allTestScores.filter(t => t.classId === cls.id && t.type === 'monthly' && t.date >= m3Start        && t.date <= rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));

                const dailyDates   = [...new Set(clsDailyAll.map(t=>t.date))].sort();
                const weeklyDates  = [...new Set(clsWeekly.map(t=>t.date))].sort();
                const monthlyDates = [...new Set(clsMonthly.map(t=>t.date))].sort().slice(-3);

                // ── 반 평균 맵 ──
                const clsDailyAvgMap: Record<string,number>   = Object.fromEntries(dailyDates.map(d=>{const s=clsDailyAll.filter(x=>x.date===d);return [d,s.length?Math.round(s.reduce((a,b)=>a+b.score,0)/s.length):0];}));
                const clsWeeklyAvgMap: Record<string,number>  = Object.fromEntries(weeklyDates.map(d=>{const s=clsWeekly.filter(x=>x.date===d);return [d,s.length?Math.round(s.reduce((a,b)=>a+b.score,0)/s.length):0];}));
                const clsMonthlyAvgMap: Record<string,number> = Object.fromEntries(monthlyDates.map(d=>{const s=clsMonthly.filter(x=>x.date===d);return [d,s.length?Math.round(s.reduce((a,b)=>a+b.score,0)/s.length):0];}));

                // ── 분야 목록 ──
                const latestWithFields = [...stuWeeklyAll,...stuMonthlyAll].filter(t=>t.fields?.length).sort((a,b)=>b.date.localeCompare(a.date))[0];
                const FIELDS    = latestWithFields?.fields ?? [];
                const FIELD_MAX = latestWithFields ? Math.round((latestWithFields.maxScore??100)/(FIELDS.length||1)) : 20;

                // ── 내 데이터 날짜별 매핑 ──
                const stuDaily   = dailyDates.map(d=>({date:d, t:stuDailyAll.find(x=>x.date===d)}));
                const stuWeekly  = weeklyDates.map(d=>({date:d, t:stuWeeklyAll.find(x=>x.date===d)}));
                const stuMonthly = monthlyDates.map(d=>({date:d, t:stuMonthlyAll.find(x=>x.date===d)}));

                // ── 출결·과제 ──
                const stuAtt = allAttRecords.filter(a=>a.classId===cls.id&&a.date>=rptMonthStart&&a.date<=rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));
                const stuHw  = homeworks.filter(h=>h.studentId===student.id&&h.classId===cls.id&&h.date>=rptMonthStart&&h.date<=rptMonthEnd);

                // ── 차트 데이터 ──
                const dailyChartData   = stuDaily.filter(x=>x.t).map(x=>({name:x.date.slice(5),점수:x.t!.score,반평균:clsDailyAvgMap[x.date]??null}));
                const weeklyChartData  = stuWeekly.filter(x=>x.t).map(x=>({name:x.t!.testName.replace('주간테스트','').trim(),점수:x.t!.score,반평균:clsWeeklyAvgMap[x.date]??null}));
                const monthlyChartData = stuMonthly.filter(x=>x.t).map(x=>({name:x.t!.testName.replace('월간평가','').trim(),점수:x.t!.score,반평균:clsMonthlyAvgMap[x.date]??null}));

                // ── 레이더 (최신 주간) ──
                const clsFieldAvgFn = (date:string, fields:string[]) => {
                  const s=clsWeekly.filter(x=>x.date===date&&x.subScores);
                  return Object.fromEntries(fields.map(f=>[f,s.length?Math.round(s.reduce((a,t)=>a+(t.subScores?.[f]??0),0)/s.length):0]));
                };
                const latestWeekly  = stuWeekly.filter(x=>x.t&&x.t.subScores&&x.t.fields).slice(-1)[0]?.t;
                const clsFieldAvgs  = FIELDS.length&&latestWeekly ? clsFieldAvgFn(latestWeekly.date,FIELDS) : {};
                const radarData     = FIELDS.length&&latestWeekly?.subScores
                  ? FIELDS.map(f=>({field:f,점수:latestWeekly.subScores![f]??0,반평균:clsFieldAvgs[f]??0,만점:FIELD_MAX}))
                  : [];

                // ── 월간 분야별 꺾은선 ──
                const monthlyFieldData = monthlyDates.map(d=>{
                  const t=stuMonthlyAll.find(x=>x.date===d);
                  const row:Record<string,number|string>={name:t?.testName?.replace('월간평가','').trim()??d.slice(0,7)};
                  FIELDS.forEach(f=>{row[f]=t?.subScores?.[f]??0;});
                  return row;
                });

                // ── 도넛 데이터 ──
                const attCnt={present:stuAtt.filter(a=>a.status==='present').length,absent:stuAtt.filter(a=>a.status==='absent').length,late:stuAtt.filter(a=>a.status==='late').length,early_leave:stuAtt.filter(a=>a.status==='early_leave').length};
                const hwCnt={excellent:stuHw.filter(h=>h.result==='excellent').length,good:stuHw.filter(h=>h.result==='good').length,poor:stuHw.filter(h=>h.result==='poor').length,not_submitted:stuHw.filter(h=>h.result==='not_submitted').length};
                const attPieData=[{name:'출석',value:attCnt.present,fill:'#22C55E'},{name:'결석',value:attCnt.absent,fill:'#EF4444'},{name:'지각',value:attCnt.late,fill:'#EAB308'},{name:'조퇴',value:attCnt.early_leave,fill:'#F97316'}].filter(d=>d.value>0);
                const hwPieData=[{name:'우수',value:hwCnt.excellent,fill:'#6366F1'},{name:'보통',value:hwCnt.good,fill:'#22C55E'},{name:'미흡',value:hwCnt.poor,fill:'#F97316'},{name:'미제출',value:hwCnt.not_submitted,fill:'#9CA3AF'}].filter(d=>d.value>0);
                const attStyle:Record<string,React.CSSProperties>={present:{backgroundColor:'#DCFCE7',color:'#15803D'},absent:{backgroundColor:'#FEE2E2',color:'#DC2626'},late:{backgroundColor:'#FEF9C3',color:'#CA8A04'},early_leave:{backgroundColor:'#FFEDD5',color:'#EA580C'}};
                const attLblMap:Record<string,string>={present:'출석',absent:'결석',late:'지각',early_leave:'조퇴'};

                return (
                  <div key={cls.id}
                    className="rounded-3xl overflow-hidden shadow-xl flex flex-col"
                    style={{width:390,minWidth:320,maxWidth:420,border:`3px solid ${stuColor}`,background:'#FAFBFF'}}>

                    {/* ── 헤더 ── */}
                    <div className="px-5 pt-5 pb-4" style={{background:`linear-gradient(135deg,${stuColor}ee,${stuColor}99)`}}>
                      <div className="text-white font-bold text-xl">{student.name}</div>
                      <div className="text-white/75 text-sm">{student.grade} · {cls.name}</div>
                      <div className="text-white/60 text-xs mt-1">{reportMonth.replace('-','년 ')}월 성적표 · 담당 {teacher?.name} 선생님</div>
                    </div>

                    <div className="flex-1 overflow-y-auto" style={{maxHeight:820}}>
                    <div className="p-4 space-y-5">

                      {/* ① 데일리 테스트 추이 */}
                      {dailyChartData.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
                            <span>📝</span> 데일리 테스트 추이 ({dailyChartData.length}회)
                          </div>
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={dailyChartData} margin={{top:4,right:8,bottom:4,left:-28}}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                              <XAxis dataKey="name" tick={{fontSize:9}} />
                              <YAxis domain={[0,100]} tick={{fontSize:9}} />
                              <Tooltip formatter={(v:unknown)=>[`${v as number}점`]} contentStyle={{fontSize:11,borderRadius:8}} />
                              <Legend wrapperStyle={{fontSize:9}} />
                              <Line type="monotone" dataKey="점수" stroke={stuColor} strokeWidth={2.5} dot={{r:3,fill:stuColor}} activeDot={{r:5}} />
                              <Line type="monotone" dataKey="반평균" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {stuDaily.map(({date,t})=>(
                              <div key={date} className="text-center">
                                <div className="text-[9px] text-gray-400">{date.slice(5)}</div>
                                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg" style={t?SC(t.score,t.maxScore):{backgroundColor:'#F3F4F6',color:'#9CA3AF'}}>
                                  {t?t.score:'—'}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ② 주간 테스트 — 바 차트 + 분야별 */}
                      {stuWeekly.filter(x=>x.t).length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
                            <span>📊</span> 주간 테스트 ({stuWeekly.filter(x=>x.t).length}회)
                          </div>
                          <ResponsiveContainer width="100%" height={100}>
                            <BarChart data={weeklyChartData} margin={{top:4,right:8,bottom:4,left:-28}}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                              <XAxis dataKey="name" tick={{fontSize:9}} />
                              <YAxis domain={[0,100]} tick={{fontSize:9}} />
                              <Tooltip formatter={(v:unknown)=>[`${v as number}점`]} contentStyle={{fontSize:11,borderRadius:8}} />
                              <Legend wrapperStyle={{fontSize:9}} />
                              <Bar dataKey="점수" fill={stuColor} radius={[4,4,0,0]} />
                              <Bar dataKey="반평균" fill="#CBD5E1" radius={[4,4,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                          {FIELDS.length > 0 && (
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead><tr>
                                  <th className="text-left text-gray-400 font-medium pb-1 pr-2">영역</th>
                                  {stuWeekly.filter(x=>x.t).map(({t})=>(
                                    <th key={t!.date} className="text-center text-gray-400 font-medium pb-1 px-1">{t!.testName.replace('주간테스트','').trim()}</th>
                                  ))}
                                </tr></thead>
                                <tbody>
                                  {FIELDS.map((f,fi)=>(
                                    <tr key={f}>
                                      <td className="pr-2 py-1 font-semibold" style={{color:FIELD_COLORS[fi%FIELD_COLORS.length]}}>{f}</td>
                                      {stuWeekly.filter(x=>x.t).map(({t})=>{
                                        const v=t!.subScores?.[f];
                                        return <td key={t!.date} className="text-center py-1 px-1">{v!=null?<span className="font-bold px-1.5 py-0.5 rounded-md text-xs" style={SC(v,FIELD_MAX)}>{v}</span>:<span className="text-gray-300">—</span>}</td>;
                                      })}
                                    </tr>
                                  ))}
                                  <tr className="border-t border-gray-100">
                                    <td className="pr-2 py-1 font-bold text-gray-600">합계</td>
                                    {stuWeekly.filter(x=>x.t).map(({t})=>(
                                      <td key={t!.date} className="text-center py-1 px-1 font-bold" style={SC(t!.score,t!.maxScore)}>{t!.score}</td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                          {radarData.length > 0 && (
                            <div className="mt-3">
                              <div className="text-[10px] text-gray-400 mb-1 text-center">최신 주간 영역별 레이더 — {latestWeekly?.testName}</div>
                              <ResponsiveContainer width="100%" height={160}>
                                <RadarChart data={radarData} margin={{top:8,right:24,bottom:8,left:24}}>
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="field" tick={{fontSize:10}} />
                                  <PolarRadiusAxis domain={[0,FIELD_MAX]} tick={false} axisLine={false} />
                                  <Legend wrapperStyle={{fontSize:9}} />
                                  <Radar dataKey="점수" fill={stuColor} fillOpacity={0.3} stroke={stuColor} strokeWidth={2} />
                                  <Radar dataKey="반평균" fill="#94A3B8" fillOpacity={0.15} stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 3" />
                                  <Tooltip formatter={(v:unknown)=>[`${v as number}점 / ${FIELD_MAX}점`]} contentStyle={{fontSize:11,borderRadius:8}} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ③ 월간 평가 — 추이 + 분야별 꺾은선 */}
                      {stuMonthly.filter(x=>x.t).length > 0 && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                          <div className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1">
                            <span>🏆</span> 월간 평가 — 3개월 추이
                          </div>
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={monthlyChartData} margin={{top:24,right:8,bottom:4,left:-28}}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                              <XAxis dataKey="name" tick={{fontSize:10}} />
                              <YAxis domain={[0,100]} tick={{fontSize:9}} />
                              <Tooltip formatter={(v:unknown)=>[`${v as number}점`]} contentStyle={{fontSize:11,borderRadius:8}} />
                              <Legend wrapperStyle={{fontSize:9}} />
                              <Line type="monotone" dataKey="점수" stroke="#F59E0B" strokeWidth={3} dot={{r:5,fill:'#F59E0B',stroke:'#fff',strokeWidth:2}} activeDot={{r:7}} label={{position:'top',fontSize:11,fontWeight:'bold',fill:'#92400E'}} />
                              <Line type="monotone" dataKey="반평균" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                          {FIELDS.length>0&&monthlyFieldData.length>0&&(
                            <div className="mt-3">
                              <div className="text-[10px] text-gray-400 mb-1">영역별 점수 추이 (/{FIELD_MAX}점)</div>
                              <ResponsiveContainer width="100%" height={120}>
                                <LineChart data={monthlyFieldData} margin={{top:4,right:8,bottom:4,left:-28}}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                                  <XAxis dataKey="name" tick={{fontSize:9}} />
                                  <YAxis domain={[0,FIELD_MAX]} tick={{fontSize:9}} />
                                  <Tooltip contentStyle={{fontSize:11,borderRadius:8}} />
                                  <Legend wrapperStyle={{fontSize:10}} />
                                  {FIELDS.map((f,fi)=>(
                                    <Line key={f} type="monotone" dataKey={f} stroke={FIELD_COLORS[fi%FIELD_COLORS.length]} strokeWidth={2} dot={{r:3}} />
                                  ))}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                          {FIELDS.length>0&&(
                            <div className="mt-3 overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead><tr>
                                  <th className="text-left text-gray-400 font-medium pb-1 pr-2">영역</th>
                                  {stuMonthly.filter(x=>x.t).map(({t})=>(
                                    <th key={t!.date} className="text-center text-gray-400 font-medium pb-1 px-1">{t!.testName.replace('월간평가','').trim()}</th>
                                  ))}
                                </tr></thead>
                                <tbody>
                                  {FIELDS.map((f,fi)=>(
                                    <tr key={f}>
                                      <td className="pr-2 py-1 font-semibold" style={{color:FIELD_COLORS[fi%FIELD_COLORS.length]}}>{f}</td>
                                      {stuMonthly.filter(x=>x.t).map(({t},mi)=>{
                                        const v=t!.subScores?.[f];
                                        const prev=mi>0?stuMonthly.filter(x=>x.t)[mi-1].t?.subScores?.[f]:null;
                                        const arrow=(prev!=null&&v!=null)?(v>prev?'↑':v<prev?'↓':''):'';
                                        const arrowColor=arrow==='↑'?'#16A34A':arrow==='↓'?'#DC2626':'#94A3B8';
                                        return (
                                          <td key={t!.date} className="text-center py-1 px-1">
                                            {v!=null?<span className="font-bold">{v}<span className="text-[9px] ml-0.5" style={{color:arrowColor}}>{arrow}</span></span>:<span className="text-gray-300">—</span>}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                  <tr className="border-t border-gray-100">
                                    <td className="pr-2 py-1 font-bold text-gray-600">합계</td>
                                    {stuMonthly.filter(x=>x.t).map(({t},mi)=>{
                                      const prev=mi>0?stuMonthly.filter(x=>x.t)[mi-1].t?.score:null;
                                      const diff=prev!=null?t!.score-prev:null;
                                      return (
                                        <td key={t!.date} className="text-center py-1 px-1">
                                          <span className="font-bold px-1.5 py-0.5 rounded-md" style={SC(t!.score,t!.maxScore)}>{t!.score}</span>
                                          {diff!=null&&<div className="text-[9px]" style={{color:diff>0?'#16A34A':diff<0?'#DC2626':'#94A3B8'}}>{diff>0?`+${diff}`:diff}</div>}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ④ 출석 & 과제 도넛 */}
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="text-xs font-bold text-gray-500 mb-2">📋 출석 & 과제 현황</div>
                        <div className="flex gap-2">
                          <div className="flex-1 text-center">
                            <div className="text-[10px] text-gray-400 mb-1">✅ 출석 ({stuAtt.length}회)</div>
                            {attPieData.length>0?(
                              <ResponsiveContainer width="100%" height={110}>
                                <PieChart>
                                  <Pie data={attPieData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={46} paddingAngle={3}>
                                    {attPieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                                  </Pie>
                                  <Tooltip formatter={(v:unknown,n:unknown)=>[`${v as number}회`,String(n)]} contentStyle={{fontSize:10,borderRadius:8}} />
                                </PieChart>
                              </ResponsiveContainer>
                            ):<div className="h-[110px] flex items-center justify-center text-xs text-gray-300">기록 없음</div>}
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              {attPieData.map(d=>(
                                <div key={d.name} className="flex items-center gap-0.5 text-[9px]">
                                  <div className="w-2 h-2 rounded-full" style={{background:d.fill}}/>
                                  <span>{d.name} {d.value}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 justify-center">
                              {stuAtt.map(a=>(
                                <div key={a.date} className="flex flex-col items-center">
                                  <div className="text-[8px] text-gray-400">{a.date.slice(5)}</div>
                                  <div className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center" style={attStyle[a.status]}>
                                    {a.status==='present'?'✓':a.status==='absent'?'✗':attLblMap[a.status][0]}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-[10px] text-gray-400 mb-1">📋 과제 ({stuHw.length}회)</div>
                            {hwPieData.length>0?(
                              <ResponsiveContainer width="100%" height={110}>
                                <PieChart>
                                  <Pie data={hwPieData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={46} paddingAngle={3}>
                                    {hwPieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                                  </Pie>
                                  <Tooltip formatter={(v:unknown,n:unknown)=>[`${v as number}회`,String(n)]} contentStyle={{fontSize:10,borderRadius:8}} />
                                </PieChart>
                              </ResponsiveContainer>
                            ):<div className="h-[110px] flex items-center justify-center text-xs text-gray-300">기록 없음</div>}
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              {hwPieData.map(d=>(
                                <div key={d.name} className="flex items-center gap-0.5 text-[9px]">
                                  <div className="w-2 h-2 rounded-full" style={{background:d.fill}}/>
                                  <span>{d.name} {d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
