import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell,
} from 'recharts';
import { useTableData } from '../../hooks/useTableData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type {
  AttendanceStatus, HomeworkResult, ClassInfo, Student, User,
  AttendanceRecord, DailyProgress, TestScore, ObservationRecord,
  ClassNotice, ClassSettings,
} from '../../types';

type Tab = 'attendance' | 'progress' | 'observation' | 'homework' | 'daily_test' | 'exam' | 'report_card' | 'charts';
type AttCalTab = 'calendar' | 'chart';
type HwSubTab = 'calendar' | 'chart';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'attendance',  label: '출석체크',     icon: '✅' },
  { id: 'progress',   label: '진도/과제',     icon: '📖' },
  { id: 'observation',label: '학생관찰',      icon: '📝' },
  { id: 'homework',   label: '과제수행',      icon: '📋' },
  { id: 'daily_test', label: '데일리테스트',  icon: '🎯' },
  { id: 'exam',        label: '주간/월간시험', icon: '📊' },
  { id: 'report_card', label: '성적표',       icon: '📜' },
  { id: 'charts',      label: '현황그래프',   icon: '📈' },
];

const attStatusOptions: { status: AttendanceStatus; label: string; color: string }[] = [
  { status: 'present',     label: '출석', color: 'bg-green-500 text-white' },
  { status: 'absent',      label: '결석', color: 'bg-red-500 text-white' },
  { status: 'late',        label: '지각', color: 'bg-yellow-500 text-white' },
  { status: 'early_leave', label: '조퇴', color: 'bg-orange-500 text-white' },
];

const hwResultOptions: { result: HomeworkResult['result']; label: string; color: string }[] = [
  { result: 'excellent',    label: '우수',   color: 'bg-blue-500 text-white' },
  { result: 'good',         label: '보통',   color: 'bg-green-500 text-white' },
  { result: 'poor',         label: '미흡',   color: 'bg-orange-500 text-white' },
  { result: 'not_submitted',label: '미제출', color: 'bg-gray-400 text-white' },
];

const hwLabel: Record<string, string> = { excellent: '우수', good: '보통', poor: '미흡', not_submitted: '미제출' };
const hwColor: Record<string, string> = {
  excellent: 'bg-blue-100 text-blue-700', good: 'bg-green-100 text-green-700',
  poor: 'bg-orange-100 text-orange-700',  not_submitted: 'bg-gray-100 text-gray-500',
};
const hwScoreMap: Record<string, number> = { excellent: 100, good: 70, poor: 35, not_submitted: 0 };
const hwPillColor: Record<string, { bg: string; text: string }> = {
  excellent:     { bg: '#DBEAFE', text: '#1D4ED8' },
  good:          { bg: '#D1FAE5', text: '#065F46' },
  poor:          { bg: '#FFEDD5', text: '#C2410C' },
  not_submitted: { bg: '#F3F4F6', text: '#6B7280' },
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e'];
const DAY_MAP: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

const ATT_DOT: Record<string, string> = { present: '✓', absent: '✗', late: '지', early_leave: '조' };
const ATT_CELL: Record<string, { bg: string; text: string }> = {
  present:     { bg: '#F0FDF4', text: '#16A34A' },
  absent:      { bg: '#FEF2F2', text: '#DC2626' },
  late:        { bg: '#FEFCE8', text: '#CA8A04' },
  early_leave: { bg: '#FFF7ED', text: '#EA580C' },
};

// 캘린더 셀 - 출석 상태별 진한 배경 + 흰 텍스트
const ATT_STATUS_COLOR: Record<string, { bg: string }> = {
  present:     { bg: '#22c55e' },
  absent:      { bg: '#ef4444' },
  late:        { bg: '#eab308' },
  early_leave: { bg: '#f97316' },
};
const ATT_LEGEND = [
  { label: '출석', bg: '#22c55e' },
  { label: '결석', bg: '#ef4444' },
  { label: '지각', bg: '#eab308' },
  { label: '조퇴', bg: '#f97316' },
];

const d0 = new Date();
const todayStr = `${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`;

const givenName = (name: string) => name.length > 1 ? name.slice(1) : name;
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
const dateRelative = (days: number) => { const d = new Date(); d.setDate(d.getDate() - days); return fmtDate(d); };

// 라인차트 공통 툴팁 — 반평균을 항상 마지막에 표시
function LineChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  // 값 내림차순 정렬 (반평균 포함)
  const sorted = [...payload].sort((a, b) => b.value - a.value);
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: '#374151' }}>{label}</p>
      {sorted.map(p => {
        const isAvg = p.name === '반평균';
        return (
          <div key={p.name} style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
            ...(isAvg ? { background: '#F1F5F9', borderRadius: 5, padding: '2px 5px', margin: '2px -5px' } : {}),
          }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ color: isAvg ? '#475569' : '#6B7280', minWidth: 48, fontWeight: isAvg ? 600 : 400 }}>{p.name}</span>
            <span style={{ fontWeight: 700, color: '#1E293B' }}>{p.value}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [dbClasses]                         = useTableData<ClassInfo>('classes');
  const [dbStudents]                        = useTableData<Student>('students');
  const [dbUsers]                           = useTableData<User>('users');
  const [dbAttendance, setDbAtt]            = useTableData<AttendanceRecord>('attendance');
  const [dbProgress,   setDbProgress]       = useTableData<DailyProgress>('dailyProgress');
  const [dbHomework,   setDbHomework]       = useTableData<HomeworkResult>('homework');
  const [dbTestScores, setDbScores]         = useTableData<TestScore>('testScores');
  const [dbObservations, setDbObservations] = useTableData<ObservationRecord>('observations');
  const [classNoticesDB, setClassNoticesDB] = useTableData<ClassNotice>('classNotices');
  const [classSettingsDB, setClassSettingsDB] = useTableData<ClassSettings>('classSettings');

  const [activeTab,    setActiveTab]    = useState<Tab>('attendance');
  // 선택 날짜를 반별 localStorage에 저장 → 역할(선생님/원장) 관계없이 같은 날짜 유지
  const [selectedDate, setSelectedDateRaw] = useLocalStorage<string>(
    `ams_selectedDate_${classId}`, todayStr,
  );
  const setSelectedDate = (d: string) => setSelectedDateRaw(d);
  const [notice,       setNotice]       = useState('');

  // 현재 반의 공지사항 (DB 기반)
  const savedNotices = classNoticesDB.filter(n => n.classId === classId).map(n => n.text);
  const setSavedNotices = (updater: string[] | ((prev: string[]) => string[])) => {
    setClassNoticesDB(prev => {
      const others = prev.filter(n => n.classId !== classId);
      const current = prev.filter(n => n.classId === classId).map(n => n.text);
      const newTexts = typeof updater === 'function' ? updater(current) : updater;
      const newNotices: ClassNotice[] = newTexts.map((text, i) => ({
        id: `notice_${classId}_${i}`,
        classId: classId!,
        text,
      }));
      return [...others, ...newNotices];
    });
  };

  const [editingNoticeIdx, setEditingNoticeIdx] = useState<number | null>(null);
  const [editingNoticeText, setEditingNoticeText] = useState('');

  const [attendance,     setAttendance]     = useState<Record<string, AttendanceStatus>>({});
  const [calSubTab,      setCalSubTab]      = useState<AttCalTab>('calendar');
  const [calSelStudent,  setCalSelStudent]  = useState<string>('all');

  // ── 출결 알림 메시지 템플릿 (DB 저장) ───────────────────────────────────────
  // 사용 가능한 변수: {이름} {날짜} {반명} {연락처}
  type AttMsgMap = Record<AttendanceStatus, string>;
  const DEFAULT_ATT_MSG_TEMPLATES: AttMsgMap = {
    present:
      '안녕하세요! {이름} 학생이 {날짜} {반명} 수업에 정상 출석하였습니다. 오늘도 열심히 참여해 주어 감사합니다. 😊',
    absent:
      '안녕하세요. {이름} 학생이 {날짜} {반명} 수업에 결석 처리되었습니다. 사유가 있으신 경우 담당 선생님께 연락 주시기 바랍니다. 📞',
    late:
      '안녕하세요. {이름} 학생이 {날짜} {반명} 수업에 지각하였습니다. 다음부터는 제시간에 오실 수 있도록 지도 부탁드립니다. ⏰',
    early_leave:
      '안녕하세요. {이름} 학생이 {날짜} {반명} 수업 도중 조기 귀가하였습니다. 귀가 후 건강 상태를 확인해 주시기 바랍니다. 🏠',
  };
  const clsSetting = classSettingsDB.find(s => s.classId === classId);
  const attMsgTemplates: AttMsgMap = { ...DEFAULT_ATT_MSG_TEMPLATES, ...(clsSetting?.attMsgTemplates ?? {}) } as AttMsgMap;
  const setAttMsgTemplates = (updater: AttMsgMap | ((prev: AttMsgMap) => AttMsgMap)) => {
    setClassSettingsDB(prev => {
      const ex = prev.find(s => s.classId === classId);
      const current: AttMsgMap = { ...DEFAULT_ATT_MSG_TEMPLATES, ...(ex?.attMsgTemplates ?? {}) } as AttMsgMap;
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (ex) return prev.map(s => s.classId === classId ? { ...s, attMsgTemplates: next } : s);
      return [...prev, { id: classId!, classId: classId!, examFields: [], attMsgTemplates: next, reportComments: {} }];
    });
  };
  // 웹훅 URL (전역 저장)
  const [webhookUrl,     setWebhookUrl]     = useLocalStorage<string>('ams_webhook_url', '');
  const [webhookSending, setWebhookSending] = useState(false);
  const [showMsgSection, setShowMsgSection] = useState(false);
  // 지각/조퇴 즉시 확인 모달
  type QuickStatus = 'late' | 'early_leave';
  const [attConfirm, setAttConfirm] = useState<{ studentId: string; studentName: string; status: QuickStatus } | null>(null);

  const [progressContent,   setProgressContent]   = useState('');
  const [homework,           setHomework]          = useState('');
  const [progressParentMsg,  setProgressParentMsg] = useState('');

  const [observationNote, setObservationNote] = useState<Record<string, string>>({});
  const [parentMessage,   setParentMessage]   = useState<Record<string, string>>({});

  const [hwResults, setHwResults] = useState<Record<string, HomeworkResult['result']>>({});
  const [hwNotes,   setHwNotes]   = useState<Record<string, string>>({});
  const [hwSubTab,  setHwSubTab]  = useState<HwSubTab>('chart');
  const [hwLineStudents, setHwLineStudents] = useState<string[]>([]);
  const [hwHistPreset, setHwHistPreset] = useState<'all' | '1w' | '1m' | '3m'>('1w');
  const [hwHistStart,  setHwHistStart]  = useState('');
  const [hwHistEnd,    setHwHistEnd]    = useState('');

  const [dailyScores,    setDailyScores]    = useState<Record<string, string>>({});
  const [dailyMaxScore,  setDailyMaxScore]  = useState('100');
  const [dailyHistStart, setDailyHistStart] = useState('');
  const [dailyHistEnd,   setDailyHistEnd]   = useState('');
  const [dailyHistView,  setDailyHistView]  = useState<'list' | 'chart'>('list');
  const [dailyHistStu,   setDailyHistStu]   = useState<string>('');   // '' = 전체

  const [examName,       setExamName]       = useState('');
  const [examType,       setExamType]       = useState<'weekly' | 'monthly'>('weekly');
  const [examScores,     setExamScores]     = useState<Record<string, string>>({});
  const [examHistStart,  setExamHistStart]  = useState('');
  const [examHistEnd,    setExamHistEnd]    = useState('');
  const [examHistView,   setExamHistView]   = useState<'list' | 'chart'>('list');
  const [examHistStu,    setExamHistStu]    = useState<string>('');   // '' = 전체
  const [editingExamDate,   setEditingExamDate]   = useState<string | null>(null);
  const [editExamName,      setEditExamName]      = useState('');
  const [editExamType,      setEditExamType]      = useState<'weekly' | 'monthly'>('weekly');
  const [editExamScores,    setEditExamScores]    = useState<Record<string, string>>({});
  const [editExamSubScores, setEditExamSubScores] = useState<Record<string, Record<string, string>>>({});
  const [editExamMaxScore,  setEditExamMaxScore]  = useState('100');
  // ── 시험 분야 + 만점 (DB 저장 — 반별 고정 설정) ─────────────────────────
  const examFields    = clsSetting?.examFields   ?? [];
  const examMaxScore  = clsSetting?.examMaxScore ?? '100';

  /** classSettings 부분 업데이트 헬퍼 */
  const patchClsSetting = (patch: Partial<ClassSettings>) => {
    setClassSettingsDB(prev => {
      const ex = prev.find(s => s.classId === classId);
      if (ex) return prev.map(s => s.classId === classId ? { ...s, ...patch } : s);
      return [...prev, { id: classId!, classId: classId!, examFields: [], attMsgTemplates: {}, reportComments: {}, ...patch }];
    });
  };

  const setExamFields = (updater: string[] | ((prev: string[]) => string[])) => {
    const next = typeof updater === 'function' ? updater(examFields) : updater;
    patchClsSetting({ examFields: next });
  };
  const setExamMaxScore = (v: string) => patchClsSetting({ examMaxScore: v });
  const [examFieldInput, setExamFieldInput] = useState('');
  const [examSubScores,  setExamSubScores]  = useState<Record<string, Record<string, string>>>({});
  const [editingFieldIdx,   setEditingFieldIdx]   = useState<number | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState('');
  const [dragFieldIdx,      setDragFieldIdx]      = useState<number | null>(null);
  const [dragOverIdx,       setDragOverIdx]       = useState<number | null>(null);
  // ── 성적표 ────────────────────────────────────────────────────────────────
  const [reportGenerated,  setReportGenerated]  = useState(false);
  const [reportChecked,    setReportChecked]    = useState<Record<string, boolean>>({});
  const [reportMonth,      setReportMonth]      = useState(todayStr.slice(0, 7)); // YYYY-MM
  const reportComments = clsSetting?.reportComments ?? {};
  const setReportComments = (updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    setClassSettingsDB(prev => {
      const ex = prev.find(s => s.classId === classId);
      const current = ex?.reportComments ?? {};
      const next = typeof updater === 'function' ? updater(current) : updater;
      if (ex) return prev.map(s => s.classId === classId ? { ...s, reportComments: next } : s);
      return [...prev, { id: classId!, classId: classId!, examFields: [], attMsgTemplates: {}, reportComments: next }];
    });
  };
  const [sendingReport,    setSendingReport]    = useState(false);

  // ── 학생 상세 모달 ─────────────────────────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [obsHistStart,  setObsHistStart]  = useState('');
  const [obsHistEnd,    setObsHistEnd]    = useState('');
  const [obsHistPreset, setObsHistPreset] = useState<'all' | '1w' | '1m' | '3m'>('all');

  const [chartDailyStudents, setChartDailyStudents] = useState<string[]>([]);
  const [chartDailyStart,    setChartDailyStart]    = useState('');
  const [chartDailyEnd,      setChartDailyEnd]      = useState('');
  // 방사형 그래프 기간 필터: 'month'=선택월, '3m'=최근3개월 (+ 직접 입력)
  const [radarPeriod, setRadarPeriod] = useState<'month' | '3m'>('month');
  const [radarDateStart, setRadarDateStart] = useState('');
  const [radarDateEnd,   setRadarDateEnd]   = useState('');

  // 과제 수행 전체 분포(도넛) 기간
  const [hwPieStart, setHwPieStart] = useState('');
  const [hwPieEnd,   setHwPieEnd]   = useState('');

  // 주간시험 성적 추이 (weeklyOnly)
  const [chartWeeklyStart,    setChartWeeklyStart]    = useState('');
  const [chartWeeklyEnd,      setChartWeeklyEnd]      = useState('');
  const [chartWeeklyStudents, setChartWeeklyStudents] = useState<string[]>([]);

  // 월간시험 성적 추이 (monthlyOnly)
  const [chartMonthlyStart,    setChartMonthlyStart]    = useState('');
  const [chartMonthlyEnd,      setChartMonthlyEnd]      = useState('');
  const [chartMonthlyStudents, setChartMonthlyStudents] = useState<string[]>([]);

  // 분야별 성취도·비교 기간 (주간/월간 분리)
  const [fieldWeeklyStart,  setFieldWeeklyStart]  = useState('');
  const [fieldWeeklyEnd,    setFieldWeeklyEnd]    = useState('');
  const [fieldMonthlyStart, setFieldMonthlyStart] = useState('');
  const [fieldMonthlyEnd,   setFieldMonthlyEnd]   = useState('');

  // 과제 제출일별 현황 기간
  const [hwChartStart, setHwChartStart] = useState('');
  const [hwChartEnd,   setHwChartEnd]   = useState('');

  // 분야별 학생점수 비교 — 선택 학생 필터 (주간/월간)
  const [fieldWeeklyCompStudents,  setFieldWeeklyCompStudents]  = useState<string[]>([]);
  const [fieldMonthlyCompStudents, setFieldMonthlyCompStudents] = useState<string[]>([]);

  const cls = dbClasses.find(c => c.id === classId);
  const students = cls
    ? (cls.studentIds as string[]).map(sid => dbStudents.find(s => s.id === sid)).filter(Boolean) as Student[]
    : [];

  useEffect(() => {
    const init: Record<string, AttendanceStatus> = {};
    dbAttendance.filter(a => a.classId === classId && a.date === selectedDate && cls?.studentIds.includes(a.studentId))
      .forEach(a => { init[a.studentId] = a.status as AttendanceStatus; });
    setAttendance(init);

    const hw: Record<string, HomeworkResult['result']> = {};
    const hwN: Record<string, string> = {};
    dbHomework.filter(r => r.classId === classId && r.date === selectedDate)
      .forEach(r => { hw[r.studentId] = r.result as HomeworkResult['result']; hwN[r.studentId] = r.note ?? ''; });
    setHwResults(hw);
    setHwNotes(hwN);

    const ds: Record<string, string> = {};
    dbTestScores.filter(t => t.classId === classId && t.date === selectedDate && t.type === 'daily')
      .forEach(t => { ds[t.studentId] = String(t.score); });
    setDailyScores(ds);

    const prog = dbProgress.find(p => p.classId === classId && p.date === selectedDate);
    setProgressContent(prog?.content ?? '');
    setHomework(prog?.homework ?? '');
    setProgressParentMsg(prog?.parentMessage ?? '');

    const obsNote: Record<string, string> = {};
    const parMsg: Record<string, string> = {};
    dbObservations.filter(o => o.classId === classId && o.date === selectedDate)
      .forEach(o => { obsNote[o.studentId] = o.note; parMsg[o.studentId] = o.parentNote; });
    setObservationNote(obsNote);
    setParentMessage(parMsg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, classId]);

  if (!cls) return <div className="p-8 text-gray-400">반을 찾을 수 없습니다.</div>;

  const progress = dbProgress.find(p => p.classId === classId && p.date === selectedDate);

  const handleSaveAttendance = () => {
    setDbAtt(prev => {
      const without = prev.filter(a => !(a.classId === classId && (cls.studentIds as string[]).includes(a.studentId) && a.date === selectedDate));
      const added = students.filter(s => attendance[s.id]).map(s => ({ classId: classId!, studentId: s.id, date: selectedDate, status: attendance[s.id] }));
      return [...without, ...added];
    });
    alert('출석이 저장되었습니다.');
  };

  /** 지각/조퇴 즉시 단일 학생 웹훅 발송 */
  const sendSingleWebhook = async (studentId: string, status: AttendanceStatus) => {
    if (!webhookUrl.trim()) return;
    const stu = students.find(s => s.id === studentId);
    if (!stu) return;
    const now = new Date();
    const sentAtStr = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const className = cls?.name ?? '';
    const statusLabelMap: Record<AttendanceStatus, string> = { present:'출석', absent:'결석', late:'지각', early_leave:'조퇴' };
    const rawMsg = attMsgTemplates[status] ?? '';
    const message = rawMsg
      .replace(/\{이름\}/g,   stu.name)
      .replace(/\{날짜\}/g,   selectedDate)
      .replace(/\{반명\}/g,   className)
      .replace(/\{연락처\}/g, stu.parentPhone);
    const payload = {
      date:    selectedDate,
      sentAt:  sentAtStr,
      class:   className,
      students: [{
        name:        stu.name,
        status,
        statusLabel: statusLabelMap[status],
        parentPhone: stu.parentPhone,
        message,
      }],
    };
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      /* 실패 시 무시 (전체 발송 버튼에서 별도 안내) */
    }
  };

  /** 확인 모달 — 확인 버튼 */
  const handleAttConfirm = async () => {
    if (!attConfirm) return;
    const { studentId, status } = attConfirm;
    // 출결 상태 반영
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setAttConfirm(null);
    // 웹훅 발송
    await sendSingleWebhook(studentId, status);
  };

  const handleSendWebhook = async () => {
    if (!webhookUrl.trim()) {
      alert('웹훅 URL을 먼저 입력해 주세요.');
      setShowMsgSection(true);
      return;
    }
    const now = new Date();
    const sentAtStr = now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const className = cls?.name ?? '';
    const statusLabelMap: Record<AttendanceStatus, string> = { present:'출석', absent:'결석', late:'지각', early_leave:'조퇴' };

    /** 메시지 템플릿의 변수 치환 */
    const resolveMsg = (template: string, name: string, phone: string) =>
      template
        .replace(/\{이름\}/g,   name)
        .replace(/\{날짜\}/g,   selectedDate)
        .replace(/\{반명\}/g,   className)
        .replace(/\{연락처\}/g, phone);

    const payload = {
      date:    selectedDate,
      sentAt:  sentAtStr,
      class:   className,
      students: students.map(s => {
        const status = (attendance[s.id] ?? null) as AttendanceStatus | null;
        const rawMsg = status ? (attMsgTemplates[status] ?? '') : '';
        return {
          name:        s.name,
          status:      status ?? 'unknown',
          statusLabel: status ? statusLabelMap[status] : '-',
          parentPhone: s.parentPhone,
          message:     resolveMsg(rawMsg, s.name, s.parentPhone),
        };
      }),
    };
    setWebhookSending(true);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) alert('웹훅 발송 완료!');
      else        alert(`발송 실패 (HTTP ${res.status})`);
    } catch {
      alert('발송 중 오류가 발생했습니다.\nURL을 확인해 주세요.');
    } finally {
      setWebhookSending(false);
    }
  };

  const handleSaveProgress = () => {
    setDbProgress(prev => {
      const without = prev.filter(p => !(p.classId === classId && p.date === selectedDate));
      return [...without, { classId: classId!, date: selectedDate, content: progressContent, homework, teacherNote: progress?.teacherNote ?? '', parentMessage: progressParentMsg }];
    });
    alert('저장되었습니다.');
  };

  const handleSaveObservation = () => {
    setDbObservations(prev => {
      const without = prev.filter(o => !(o.classId === classId && o.date === selectedDate));
      const added = students.map(s => ({
        id: `obs-${classId}-${s.id}-${selectedDate}`,
        classId: classId!, studentId: s.id, date: selectedDate,
        note: observationNote[s.id] ?? '', parentNote: parentMessage[s.id] ?? '',
      }));
      return [...without, ...added];
    });
    alert('저장되었습니다.');
  };

  const handleSaveHomework = () => {
    setDbHomework(prev => {
      const without = prev.filter(r => !(r.classId === classId && r.date === selectedDate && (cls.studentIds as string[]).includes(r.studentId)));
      const added = Object.entries(hwResults).map(([studentId, result]) => ({
        studentId, classId: classId!, date: selectedDate, result, note: hwNotes[studentId] ?? '',
      }));
      return [...without, ...added];
    });
    alert('저장되었습니다.');
  };

  const handleSaveDailyTest = () => {
    setDbScores(prev => {
      const without = prev.filter(t => !(t.classId === classId && t.date === selectedDate && t.type === 'daily' && (cls.studentIds as string[]).includes(t.studentId)));
      const added = Object.entries(dailyScores).filter(([, v]) => v !== '').map(([studentId, score]) => ({
        studentId, classId: classId!, date: selectedDate,
        type: 'daily' as const, score: Number(score), maxScore: Number(dailyMaxScore) || 100,
        testName: `데일리테스트 ${selectedDate}`,
      }));
      return [...without, ...added];
    });
    alert('저장되었습니다.');
  };

  const handleSaveExam = () => {
    if (!examName) { alert('시험명을 입력하세요.'); return; }
    const perFieldMax = Number(examMaxScore) || 100;
    setDbScores(prev => {
      const without = prev.filter(t => !(t.classId === classId && t.date === selectedDate && t.type === examType && (cls.studentIds as string[]).includes(t.studentId)));
      const added = students
        .filter(s => {
          if (examFields.length > 0) {
            return examFields.some(f => (examSubScores[s.id]?.[f] ?? '') !== '');
          }
          return (examScores[s.id] ?? '') !== '';
        })
        .map(s => {
          if (examFields.length > 0) {
            const sub: Record<string, number> = {};
            let total = 0;
            examFields.forEach(f => { const v = Number(examSubScores[s.id]?.[f] ?? 0); sub[f] = v; total += v; });
            return {
              studentId: s.id, classId: classId!, date: selectedDate,
              type: examType, testName: examName,
              score: total,
              maxScore: examFields.length * perFieldMax,
              fields: [...examFields],
              subScores: sub,
            };
          }
          return {
            studentId: s.id, classId: classId!, date: selectedDate,
            type: examType, score: Number(examScores[s.id]), maxScore: perFieldMax, testName: examName,
          };
        });
      return [...without, ...added];
    });
    alert('시험 점수가 저장되었습니다.');
    setExamScores({});
    setExamSubScores({});
  };

  const handleSaveEditExam = (date: string) => {
    const dayScores = dbTestScores.filter(t => t.classId === classId && t.date === date && (t.type === 'weekly' || t.type === 'monthly'));
    const first = dayScores[0];
    const hasFields = Array.isArray(first?.fields) && (first.fields as string[]).length > 0;
    const perMax = Number(editExamMaxScore) || 100;
    setDbScores(prev => {
      const without = prev.filter(t => !(t.classId === classId && t.date === date && (t.type === 'weekly' || t.type === 'monthly') && (cls.studentIds as string[]).includes(t.studentId)));
      const fields = hasFields ? (first.fields as string[]) : [];
      const added = students
        .filter(s => hasFields
          ? fields.some(f => (editExamSubScores[s.id]?.[f] ?? '') !== '')
          : (editExamScores[s.id] ?? '') !== '')
        .map(s => {
          if (hasFields) {
            const sub: Record<string, number> = {};
            let total = 0;
            fields.forEach(f => { const v = Number(editExamSubScores[s.id]?.[f] ?? 0); sub[f] = v; total += v; });
            return { studentId: s.id, classId: classId!, date, type: editExamType, testName: editExamName, score: total, maxScore: fields.length * perMax, fields: [...fields], subScores: sub };
          }
          return { studentId: s.id, classId: classId!, date, type: editExamType, testName: editExamName, score: Number(editExamScores[s.id]), maxScore: perMax };
        });
      return [...without, ...added];
    });
    alert('수정되었습니다.');
    setEditingExamDate(null);
  };

  const openEditExam = (date: string) => {
    if (editingExamDate === date) { setEditingExamDate(null); return; }
    const dayScores = dbTestScores.filter(t => t.classId === classId && t.date === date && (t.type === 'weekly' || t.type === 'monthly'));
    const first = dayScores[0];
    const hasFields = Array.isArray(first?.fields) && (first.fields as string[]).length > 0;
    setEditExamName(first?.testName ?? '');
    setEditExamType((first?.type ?? 'weekly') as 'weekly' | 'monthly');
    setEditExamMaxScore(hasFields
      ? String(first.maxScore / (first.fields as string[]).length)
      : String(first?.maxScore ?? 100));
    if (hasFields) {
      const sub: Record<string, Record<string, string>> = {};
      dayScores.forEach(t => {
        sub[t.studentId] = {};
        (t.fields as string[]).forEach(f => { sub[t.studentId][f] = String((t.subScores as Record<string,number>)?.[f] ?? ''); });
      });
      setEditExamSubScores(sub);
      setEditExamScores({});
    } else {
      const sc: Record<string, string> = {};
      dayScores.forEach(t => { sc[t.studentId] = String(t.score); });
      setEditExamScores(sc);
      setEditExamSubScores({});
    }
    setEditingExamDate(date);
  };

  const currentMonth    = selectedDate.slice(0, 7);
  const [calYear, calMonth] = currentMonth.split('-').map(Number);
  const daysInMonth     = new Date(calYear, calMonth, 0).getDate();
  const firstDayOfMonth = new Date(`${currentMonth}-01`).getDay();

  const classDatesThisMonth = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${currentMonth}-${String(i + 1).padStart(2, '0')}`;
    return (cls.days as string[]).some(day => DAY_MAP[day] === new Date(dateStr).getDay()) ? dateStr : null;
  }).filter(Boolean) as string[];

  // 로컬 attendance 상태와 DB를 병합 → 저장 전에도 캘린더/그래프에 반영
  const mergedAttendance: AttendanceRecord[] = useMemo(() => {
    const sids = (cls?.studentIds as string[]) ?? [];
    const without = dbAttendance.filter(
      (a: AttendanceRecord) => !(a.classId === classId && a.date === selectedDate && sids.includes(a.studentId))
    );
    const live: AttendanceRecord[] = Object.entries(attendance).map(([studentId, status]) => ({
      classId: classId!, studentId, date: selectedDate, status,
    }));
    return [...without, ...live];
  }, [dbAttendance, attendance, selectedDate, classId, cls?.studentIds]);

  const attChartData = classDatesThisMonth.filter(dt => dt <= todayStr).map(date => {
    const names = (st: string) =>
      students.filter(s => mergedAttendance.find(a => a.studentId === s.id && a.date === date)?.status === st).map(s => s.name);
    return {
      date: date.slice(5),
      출석: names('present').length,
      결석: names('absent').length,
      지각: names('late').length,
      조퇴: names('early_leave').length,
      _출석명: names('present'),
      _결석명: names('absent'),
      _지각명: names('late'),
      _조퇴명: names('early_leave'),
    };
  });

  const allDailyDates = [...new Set(dbTestScores.filter(t => t.classId === classId && t.type === 'daily').map(t => t.date))].sort().reverse();
  const filteredDailyDates = allDailyDates.filter(d =>
    (!dailyHistStart || d >= dailyHistStart) && (!dailyHistEnd || d <= dailyHistEnd)
  );

  const allExamDates = [...new Set(dbTestScores.filter(t => t.classId === classId && (t.type === 'weekly' || t.type === 'monthly')).map(t => t.date))].sort().reverse();
  const filteredExamDates = allExamDates.filter(d =>
    (!examHistStart || d >= examHistStart) && (!examHistEnd || d <= examHistEnd)
  );

  const hwAllDates = [...new Set(dbHomework.filter(r => r.classId === classId).map(r => r.date))].sort().reverse();
  const hwEffStart = hwHistPreset === '1w' ? dateRelative(7)
                   : hwHistPreset === '1m' ? dateRelative(30)
                   : hwHistPreset === '3m' ? dateRelative(90)
                   : hwHistStart;
  const hwEffEnd   = hwHistPreset !== 'all' ? todayStr : hwHistEnd;
  const hwDates = hwAllDates.filter(d =>
    (!hwEffStart || d >= hwEffStart) && (!hwEffEnd || d <= hwEffEnd)
  );

  const getGradeAvg = (date: string, type: string) => {
    const grades = new Set(students.map(s => s.grade));
    const ids = dbStudents.filter(s => grades.has(s.grade)).map(s => s.id);
    const scores = dbTestScores.filter(t => t.date === date && t.type === type && ids.includes(t.studentId));
    return scores.length > 0 ? (scores.reduce((sum, t) => sum + t.score / t.maxScore * 100, 0) / scores.length).toFixed(1) : null;
  };
  const getSchoolAvg = (date: string, type: string) => {
    const schools = new Set(students.map(s => s.school));
    const ids = dbStudents.filter(s => schools.has(s.school)).map(s => s.id);
    const scores = dbTestScores.filter(t => t.date === date && t.type === type && ids.includes(t.studentId));
    return scores.length > 0 ? (scores.reduce((sum, t) => sum + t.score / t.maxScore * 100, 0) / scores.length).toFixed(1) : null;
  };

  const obsHistAllDates = [...new Set(dbObservations.filter(o => o.classId === classId).map(o => o.date))].sort().reverse();
  const obsEffStart = obsHistPreset === '1w' ? dateRelative(7)
                    : obsHistPreset === '1m' ? dateRelative(30)
                    : obsHistPreset === '3m' ? dateRelative(90)
                    : obsHistStart;
  const obsEffEnd   = (obsHistPreset !== 'all' || obsHistEnd) ? (obsHistPreset !== 'all' ? todayStr : obsHistEnd) : '';
  const obsHistDates = obsHistAllDates.filter(d =>
    (!obsEffStart || d >= obsEffStart) && (!obsEffEnd || d <= obsEffEnd)
  );

  const visibleDailyStudents   = chartDailyStudents.length   > 0 ? chartDailyStudents   : students.map(s => s.id);
  const visibleWeeklyStudents  = chartWeeklyStudents.length  > 0 ? chartWeeklyStudents  : students.map(s => s.id);
  const visibleMonthlyStudents = chartMonthlyStudents.length > 0 ? chartMonthlyStudents : students.map(s => s.id);
  const visibleHwStudents    = hwLineStudents.length     > 0 ? hwLineStudents     : students.map(s => s.id);

  const dailyChartData = (() => {
    const dates = [...new Set(dbTestScores.filter(t => t.classId === classId && t.type === 'daily').map(t => t.date))].sort()
      .filter(d => (!chartDailyStart || d >= chartDailyStart) && (!chartDailyEnd || d <= chartDailyEnd));
    return dates.map(date => {
      const row: Record<string, string | number> = { date: date.slice(5) };
      const allScores: number[] = [];
      students.forEach(s => {
        const sc = dbTestScores.find(t => t.studentId === s.id && t.classId === classId && t.date === date && t.type === 'daily');
        const pct = sc ? Math.round(sc.score / sc.maxScore * 100) : 0;
        row[s.name] = pct;
        if (sc) allScores.push(pct);
      });
      row['반평균'] = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      return row;
    });
  })();

  // 주간시험 성적 추이
  const weeklyOnlyData = (() => {
    const dates = [...new Set(dbTestScores.filter(t => t.classId === classId && t.type === 'weekly').map(t => t.date))].sort()
      .filter(d => (!chartWeeklyStart || d >= chartWeeklyStart) && (!chartWeeklyEnd || d <= chartWeeklyEnd));
    return dates.map(date => {
      const row: Record<string, string | number> = { date: date.slice(5) };
      const allScores: number[] = [];
      students.forEach(s => {
        const sc = dbTestScores.find(t => t.studentId === s.id && t.classId === classId && t.date === date && t.type === 'weekly');
        const pct = sc ? Math.round(sc.score / sc.maxScore * 100) : 0;
        row[s.name] = pct;
        if (sc) allScores.push(pct);
      });
      row['반평균'] = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      return row;
    });
  })();

  // 월간시험 성적 추이
  const monthlyOnlyData = (() => {
    const dates = [...new Set(dbTestScores.filter(t => t.classId === classId && t.type === 'monthly').map(t => t.date))].sort()
      .filter(d => (!chartMonthlyStart || d >= chartMonthlyStart) && (!chartMonthlyEnd || d <= chartMonthlyEnd));
    return dates.map(date => {
      const row: Record<string, string | number> = { date: date.slice(5) };
      const allScores: number[] = [];
      students.forEach(s => {
        const sc = dbTestScores.find(t => t.studentId === s.id && t.classId === classId && t.date === date && t.type === 'monthly');
        const pct = sc ? Math.round(sc.score / sc.maxScore * 100) : 0;
        row[s.name] = pct;
        if (sc) allScores.push(pct);
      });
      row['반평균'] = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
      return row;
    });
  })();

  // 기존 weeklyExamData (하위 호환 — 현황그래프 하단 체크에서만 사용)
  const weeklyExamData = [...weeklyOnlyData, ...monthlyOnlyData];

  const hwChartData = (() => {
    const dates = [...new Set(dbHomework.filter(r => r.classId === classId).map(r => r.date))].sort()
      .filter(d => (!hwChartStart || d >= hwChartStart) && (!hwChartEnd || d <= hwChartEnd));
    return dates.map(date => {
      const count = { excellent: 0, good: 0, poor: 0, not_submitted: 0 };
      dbHomework.filter(r => r.classId === classId && r.date === date).forEach(r => { count[r.result as keyof typeof count]++; });
      return { date: date.slice(5), ...count };
    });
  })();

  const hwLineData = (() => {
    const dates = [...new Set(dbHomework.filter(r => r.classId === classId).map(r => r.date))].sort()
      .filter(d => (!hwEffStart || d >= hwEffStart) && (!hwEffEnd || d <= hwEffEnd));
    return dates.map(date => {
      const row: Record<string, string | number> = { date: date.slice(5) };
      students.forEach(s => {
        const hw = dbHomework.find(r => r.classId === classId && r.studentId === s.id && r.date === date);
        row[s.name] = hw ? hwScoreMap[hw.result] : 0;
      });
      return row;
    });
  })();

  // 방사형 그래프 기간 필터 — 직접 입력이 있으면 우선 적용
  const radarDateFilter = (() => {
    if (radarDateStart || radarDateEnd) {
      return (date: string) =>
        (!radarDateStart || date >= radarDateStart) &&
        (!radarDateEnd   || date <= radarDateEnd)   &&
        date <= selectedDate;
    }
    if (radarPeriod === '3m') {
      const d3m = new Date(selectedDate);
      d3m.setMonth(d3m.getMonth() - 3);
      const cutoff = d3m.toISOString().slice(0, 10);
      return (date: string) => date >= cutoff && date <= selectedDate;
    }
    // 기본: 선택 월
    return (date: string) => date.startsWith(currentMonth) && date <= selectedDate;
  })();

  // 출석률 기준 날짜 목록 (방사형 기간에 맞춰 재계산, selectedDate 이하만)
  const radarAttDates = (() => {
    const DAY_MAP2: Record<string, number> = { 일:0, 월:1, 화:2, 수:3, 목:4, 금:5, 토:6 };
    const end = radarDateEnd && (radarDateStart || radarDateEnd) ? radarDateEnd : selectedDate;
    const start = (radarDateStart || radarDateEnd)
      ? (radarDateStart || (cls ? [...dbAttendance.filter(a => a.classId === classId).map(a => a.date)].sort()[0] ?? end : end))
      : radarPeriod === '3m'
        ? (() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0,10); })()
        : `${currentMonth}-01`;
    const result: string[] = [];
    const cur = new Date(start);
    while (cur.toISOString().slice(0,10) <= end) {
      const dateStr = cur.toISOString().slice(0,10);
      if ((cls?.days as string[])?.some(day => DAY_MAP2[day] === cur.getDay())) result.push(dateStr);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  })();

  const radarData = students.map((s, si) => {
    // 시험 3종목: 기간 내 "가장 최근" 점수 → 선택 날짜에 입력한 점수가 즉시 반영됨
    const latestTestScore = (type: string) => {
      const latest = dbTestScores
        .filter(t => t.classId === classId && t.studentId === s.id && t.type === type && radarDateFilter(t.date))
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return latest ? Math.round(latest.score / latest.maxScore * 100) : 0;
    };

    // 과제성실도: 기간 내 평균 (매 수업마다 기록되므로 평균이 적절)
    const hwAll   = dbHomework.filter(r => r.classId === classId && r.studentId === s.id && radarDateFilter(r.date));
    const hwScore = hwAll.length > 0 ? Math.round(hwAll.reduce((sum, r) => sum + hwScoreMap[r.result], 0) / hwAll.length) : 0;

    // 출석 점수: 출석=100 / 조퇴=80 / 지각=60 / 결석=0, 기록 없는 날은 제외
    const ATT_SCORE: Record<string, number> = { present: 100, early_leave: 80, late: 60, absent: 0 };
    const attAll   = dbAttendance.filter(a => a.classId === classId && a.studentId === s.id && radarAttDates.includes(a.date));
    const attScore = attAll.length > 0
      ? Math.round(attAll.reduce((sum, a) => sum + (ATT_SCORE[a.status] ?? 0), 0) / attAll.length)
      : 0;

    return { name: s.name, color: COLORS[si % COLORS.length], axes: [
      { axis: '과제성실도', value: hwScore },
      { axis: '데일리테스트', value: latestTestScore('daily') },
      { axis: '주간시험',    value: latestTestScore('weekly') },
      { axis: '월간시험',    value: latestTestScore('monthly') },
      { axis: '출석률',     value: attScore },
    ]};
  });

  const hwPieData = [
    { name: '우수',   value: dbHomework.filter(r => r.classId === classId && r.result === 'excellent'     && (!hwPieStart || r.date >= hwPieStart) && (!hwPieEnd || r.date <= hwPieEnd)).length, color: '#3b82f6' },
    { name: '보통',   value: dbHomework.filter(r => r.classId === classId && r.result === 'good'          && (!hwPieStart || r.date >= hwPieStart) && (!hwPieEnd || r.date <= hwPieEnd)).length, color: '#10b981' },
    { name: '미흡',   value: dbHomework.filter(r => r.classId === classId && r.result === 'poor'          && (!hwPieStart || r.date >= hwPieStart) && (!hwPieEnd || r.date <= hwPieEnd)).length, color: '#f97316' },
    { name: '미제출', value: dbHomework.filter(r => r.classId === classId && r.result === 'not_submitted' && (!hwPieStart || r.date >= hwPieStart) && (!hwPieEnd || r.date <= hwPieEnd)).length, color: '#9ca3af' },
  ].filter(d => d.value > 0);

  const toggleStudent = (setter: (fn: (prev: string[]) => string[]) => void, sid: string) => {
    setter(prev => prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]);
  };

  const setChartPeriod = (months: number) => {
    const end = new Date(); const start = new Date();
    start.setMonth(start.getMonth() - months);
    setChartDailyStart(fmtDate(start)); setChartDailyEnd(fmtDate(end));
    setChartWeeklyStart(fmtDate(start)); setChartWeeklyEnd(fmtDate(end));
    setChartMonthlyStart(fmtDate(start)); setChartMonthlyEnd(fmtDate(end));
  };

  // 분야별 기간 설정 헬퍼
  const setFieldPeriod = (type: 'weekly' | 'monthly', months: number) => {
    const end = new Date(); const start = new Date();
    start.setMonth(start.getMonth() - months);
    if (type === 'weekly') { setFieldWeeklyStart(fmtDate(start)); setFieldWeeklyEnd(fmtDate(end)); }
    else                   { setFieldMonthlyStart(fmtDate(start)); setFieldMonthlyEnd(fmtDate(end)); }
  };

  // 과제 제출일별 현황 기간 설정 헬퍼
  const setHwChartPeriod = (months: number) => {
    const end = new Date(); const start = new Date();
    start.setMonth(start.getMonth() - months);
    setHwChartStart(fmtDate(start)); setHwChartEnd(fmtDate(end));
  };

  // 도넛 기간 설정 헬퍼
  const setHwPiePeriod = (months: number) => {
    const end = new Date(); const start = new Date();
    start.setMonth(start.getMonth() - months);
    setHwPieStart(fmtDate(start)); setHwPieEnd(fmtDate(end));
  };

  // 방사형 기간 버튼 클릭 시 커스텀 날짜 초기화
  const handleRadarPreset = (preset: 'month' | '3m') => {
    setRadarPeriod(preset);
    setRadarDateStart(''); setRadarDateEnd('');
  };

  // 공통 학생명 pill: 진한 배경, 흰 텍스트, 15px (클릭 시 상세 모달)
  const StudentNamePill = ({ student, index, onClick }: { student: Student; index: number; onClick?: () => void }) => (
    <div
      className={`flex items-center px-2.5 py-1.5 rounded-lg flex-shrink-0 transition-opacity ${onClick ? 'cursor-pointer hover:opacity-75' : ''}`}
      style={{ background: COLORS[index % COLORS.length], minWidth: 72 }}
      onClick={onClick}
    >
      <span className="font-bold text-[15px] text-white leading-tight">{student.name}</span>
    </div>
  );

  // 캘린더 셀 안 학생명 pill (이름만, 11px)
  const CalPill = ({ name, index, bg }: { name: string; index: number; bg?: string }) => (
    <div className="text-[11px] font-bold text-center rounded leading-tight py-px text-white"
      style={{ background: bg ?? COLORS[index % COLORS.length] }}>
      {name}
    </div>
  );

  return (
    <div className="flex flex-col" style={{ margin: '-1.5rem', height: 'calc(100% + 3rem)' }}>
      {/* 헤더 + 탭 — 스크롤 영역 바깥에 고정 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm px-6">
        <div className="flex items-center gap-3 pt-3 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">←</button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{cls.name}</h1>
            <p className="text-sm text-gray-500">{(cls.days as string[]).join('·')}요일 {cls.startTime}~{cls.endTime} · {students.length}명</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-gray-500">날짜</label>
            <input type="date" className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-xl mb-2">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 스크롤 영역 — 헤더 아래만 스크롤 */}
      <div className="flex-1 overflow-y-auto p-6">

      {/* ── TAB: 출석체크 ── */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-2">전체 공지</h3>
            <div className="flex gap-2 mb-3">
              <input className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="전체 공지사항을 입력하세요..."
                value={notice}
                onChange={e => setNotice(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && notice.trim()) {
                    setSavedNotices(prev => [notice.trim(), ...prev]);
                    setNotice('');
                  }
                }} />
              <button className="btn-primary flex-shrink-0"
                onClick={() => {
                  if (!notice.trim()) return;
                  setSavedNotices(prev => [notice.trim(), ...prev]);
                  setNotice('');
                }}>등록</button>
            </div>
            {savedNotices.length > 0 && (
              <div className="space-y-2">
                {savedNotices.map((n, idx) => (
                  <div key={idx}>
                    {editingNoticeIdx === idx ? (
                      <div className="flex gap-2">
                        <input className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-sm bg-indigo-50 outline-none focus:ring-2 focus:ring-indigo-200"
                          value={editingNoticeText}
                          onChange={e => setEditingNoticeText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              setSavedNotices(prev => prev.map((item, i) => i === idx ? editingNoticeText.trim() : item).filter(Boolean));
                              setEditingNoticeIdx(null);
                            }
                            if (e.key === 'Escape') setEditingNoticeIdx(null);
                          }}
                          autoFocus />
                        <button className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#EFF6FF', color: '#2563EB' }}
                          onClick={() => {
                            setSavedNotices(prev => prev.map((item, i) => i === idx ? editingNoticeText.trim() : item).filter(Boolean));
                            setEditingNoticeIdx(null);
                          }}>저장</button>
                        <button className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#FEF2F2', color: '#DC2626' }}
                          onClick={() => {
                            setSavedNotices(prev => prev.filter((_, i) => i !== idx));
                            setEditingNoticeIdx(null);
                          }}>삭제</button>
                        <button className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#F1F5F9', color: '#64748B' }}
                          onClick={() => setEditingNoticeIdx(null)}>취소</button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors"
                        style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                        onClick={() => { setEditingNoticeIdx(idx); setEditingNoticeText(n); }}>
                        <span className="text-yellow-500 text-sm flex-shrink-0 mt-0.5">📢</span>
                        <span className="text-sm flex-1" style={{ color: '#92400E' }}>{n}</span>
                        <span className="text-[10px] text-gray-300 group-hover:text-gray-400 flex-shrink-0 mt-0.5">클릭하여 수정</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 출석 체크 */}
            <div className="card p-4 lg:col-span-1">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">출석 체크</h3>
              <div className="space-y-2">
                {students.map((student, si) => (
                  <div key={student.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-gray-400">{student.grade}</div>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {attStatusOptions.map(opt => (
                        <button key={opt.status}
                          onClick={() => {
                            if (opt.status === 'late' || opt.status === 'early_leave') {
                              // 지각/조퇴 → 확인 모달 띄우기
                              setAttConfirm({ studentId: student.id, studentName: student.name, status: opt.status });
                            } else {
                              // 출석/결석 → 즉시 상태 변경
                              setAttendance(prev => ({ ...prev, [student.id]: opt.status }));
                            }
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            attendance[student.id] === opt.status ? opt.color : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 출결 상태별 알림 메시지 템플릿 ── */}
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                  onClick={() => setShowMsgSection(v => !v)}
                >
                  <span>📨 출결 상태별 알림 메시지</span>
                  <span className="text-gray-400">{showMsgSection ? '▲' : '▼'}</span>
                </button>

                {showMsgSection && (
                  <div className="mt-3 space-y-2">
                    {/* 변수 힌트 */}
                    <div className="flex flex-wrap gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                      <span className="text-[10px] text-indigo-500 font-semibold w-full mb-0.5">사용 가능한 변수</span>
                      {[
                        { var: '{이름}',   desc: '학생 이름' },
                        { var: '{날짜}',   desc: '출석일' },
                        { var: '{반명}',   desc: '수업 반 이름' },
                        { var: '{연락처}', desc: '학부모 연락처' },
                      ].map(({ var: v, desc }) => (
                        <span key={v} className="inline-flex items-center gap-1 text-[10px] bg-white border border-indigo-200 rounded px-1.5 py-0.5">
                          <code className="text-indigo-600 font-bold">{v}</code>
                          <span className="text-gray-400">{desc}</span>
                        </span>
                      ))}
                    </div>

                    {([
                      { status: 'present'     as AttendanceStatus, label: '✅ 출석', bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
                      { status: 'absent'      as AttendanceStatus, label: '❌ 결석', bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' },
                      { status: 'late'        as AttendanceStatus, label: '⏰ 지각', bg: '#FEFCE8', border: '#FDE68A', text: '#CA8A04' },
                      { status: 'early_leave' as AttendanceStatus, label: '🚪 조퇴', bg: '#FFF7ED', border: '#FDBA74', text: '#EA580C' },
                    ]).map(({ status, label, bg, border, text }) => (
                      <div key={status}>
                        <label className="text-[10px] font-semibold mb-0.5 block" style={{ color: text }}>{label}</label>
                        <textarea
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg resize-none focus:outline-none focus:ring-1 transition-all placeholder-gray-300"
                          style={{ background: bg, border: `1px solid ${border}`, color: '#374151' }}
                          placeholder={`예) ${label.replace(/.*\s/, '')} 상태의 학부모 메시지를 입력하세요`}
                          value={attMsgTemplates[status] ?? ''}
                          onChange={e => setAttMsgTemplates(prev => ({ ...prev, [status]: e.target.value }))}
                        />
                      </div>
                    ))}

                    {/* 웹훅 URL */}
                    <div className="pt-1">
                      <label className="text-[10px] font-semibold text-gray-500 mb-0.5 block">🔗 웹훅 URL</label>
                      <input
                        type="url"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all placeholder-gray-300"
                        placeholder="https://hook.example.com/..."
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        발송 데이터: 일자 · 발송시각 · 반명 · 학생별(이름, 출결상태, 학부모연락처, 메시지)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 버튼 2개 ── */}
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#4F46E5', color: '#fff' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#4338CA'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#4F46E5'}
                  onClick={handleSaveAttendance}
                >
                  출석 저장
                </button>
                <button
                  disabled={webhookSending}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: webhookSending ? '#9CA3AF' : '#059669', color: '#fff' }}
                  onMouseEnter={e => { if (!webhookSending) (e.currentTarget as HTMLElement).style.background = '#047857'; }}
                  onMouseLeave={e => { if (!webhookSending) (e.currentTarget as HTMLElement).style.background = '#059669'; }}
                  onClick={handleSendWebhook}
                >
                  {webhookSending ? '발송 중…' : '학부모 알림 발송'}
                </button>
              </div>
            </div>

            {/* 이달 출석 현황 */}
            <div className="card p-4 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">이달 출석 현황</h3>
                <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
                  {(['calendar', 'chart'] as AttCalTab[]).map(t => (
                    <button key={t} onClick={() => setCalSubTab(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${calSubTab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                      {t === 'calendar' ? '캘린더' : '그래프'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 학생 필터 + 범례 같은 행 */}
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setCalSelStudent('all')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    calSelStudent === 'all' ? 'text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                  style={calSelStudent === 'all' ? { background: '#475569' } : {}}>
                  전체
                </button>
                {students.map((s, si) => (
                  <button key={s.id} onClick={() => setCalSelStudent(s.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      calSelStudent === s.id ? 'text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    style={calSelStudent === s.id ? { background: COLORS[si % COLORS.length] } : {}}>
                    {s.name}
                  </button>
                ))}
              </div>
                {/* 범례 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {ATT_LEGEND.map(l => (
                    <span key={l.label} className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: l.bg }}>{l.label}</span>
                  ))}
                </div>
              </div>

              {calSubTab === 'calendar' ? (
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {['일','월','화','수','목','금','토'].map(d => (
                    <div key={d} className="text-[10px] text-gray-400 font-semibold py-1">{d}</div>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                    const hasClass = (cls.days as string[]).some(d => DAY_MAP[d] === new Date(dateStr).getDay());
                    if (!hasClass) return <div key={day} className="py-1 text-[10px] text-gray-200 text-center">{day}</div>;

                    if (calSelStudent === 'all') {
                      return (
                        <div key={day} onClick={() => setSelectedDate(dateStr)}
                          className="rounded border border-gray-100 cursor-pointer p-0.5 min-h-[56px] hover:border-blue-200 transition-colors"
                          style={{ background: '#FAFAFA' }}>
                          <div className="text-[10px] font-semibold text-gray-500 text-center mb-0.5">{day}</div>
                          <div className="grid grid-cols-3 gap-0.5">
                            {students.map(s => {
                              const rec = mergedAttendance.find(a => a.studentId === s.id && a.date === dateStr);
                              if (!rec) return <div key={s.id} />;
                              const sc = ATT_STATUS_COLOR[rec.status];
                              return (
                                <div key={s.id} className="text-[11px] font-bold text-center rounded leading-tight py-px text-white"
                                  style={{ background: sc.bg }}>
                                  {givenName(s.name)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    } else {
                      const att = mergedAttendance.find(a => a.studentId === calSelStudent && a.date === dateStr);
                      const style = att ? ATT_CELL[att.status] : { bg: '#F8FAFC', text: '#CBD5E1' };
                      return (
                        <div key={day} onClick={() => setSelectedDate(dateStr)}
                          className="rounded cursor-pointer py-1.5 text-center min-h-[40px] hover:opacity-80 transition-opacity"
                          style={{ background: style.bg, color: style.text }}>
                          <div className="text-[10px] font-medium">{day}</div>
                          <div style={{ fontSize: 9 }}>{att ? ATT_DOT[att.status] : '–'}</div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={attChartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload[0]) return null;
                        const d = payload[0].payload as Record<string, string[]>;
                        const order: { key: string; nameKey: string; color: string }[] = [
                          { key: '출석', nameKey: '_출석명', color: '#22c55e' },
                          { key: '결석', nameKey: '_결석명', color: '#ef4444' },
                          { key: '지각', nameKey: '_지각명', color: '#eab308' },
                          { key: '조퇴', nameKey: '_조퇴명', color: '#f97316' },
                        ];
                        return (
                          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:12, maxWidth: 220 }}>
                            <div style={{ fontWeight:700, marginBottom:6 }}>{label}</div>
                            {order.map(({ key, nameKey, color }) => {
                              const names: string[] = d[nameKey] ?? [];
                              return (
                                <div key={key} style={{ marginBottom: 2 }}>
                                  <span style={{ color, fontWeight:700 }}>{key}</span>
                                  <span style={{ color:'#64748B', marginLeft: 6 }}>
                                    {names.length > 0 ? names.join(', ') : '—'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }}
                      content={() => (
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', fontSize: 11, marginTop: 4 }}>
                          {[{k:'출석',c:'#22c55e'},{k:'결석',c:'#ef4444'},{k:'지각',c:'#eab308'},{k:'조퇴',c:'#f97316'}].map(i => (
                            <span key={i.k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 10, height: 10, background: i.c, display: 'inline-block', borderRadius: 2 }} />
                              {i.k}
                            </span>
                          ))}
                        </div>
                      )} />
                    <Bar dataKey="조퇴" stackId="a" fill="#f97316" />
                    <Bar dataKey="지각" stackId="a" fill="#eab308" />
                    <Bar dataKey="결석" stackId="a" fill="#ef4444" />
                    <Bar dataKey="출석" stackId="a" fill="#22c55e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: 진도/과제 ── */}
      {activeTab === 'progress' && (
        <div className="card p-4">
          <h3 className="font-semibold text-gray-800 mb-3">진도 및 과제 입력 ({selectedDate})</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">오늘의 진도 내용</label>
              <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={3}
                placeholder="오늘 학습한 내용을 입력하세요..."
                value={progressContent} onChange={e => setProgressContent(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">이번 주 과제</label>
              <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={2}
                placeholder="과제 내용을 입력하세요..."
                value={homework} onChange={e => setHomework(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">학부모 전달 메시지 (공통)</label>
              <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" rows={2}
                placeholder="학부모님께 전달할 내용..."
                value={progressParentMsg} onChange={e => setProgressParentMsg(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleSaveProgress}>저장</button>
          </div>
        </div>
      )}

      {/* ── TAB: 학생관찰 ── */}
      {activeTab === 'observation' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">학생별 관찰/전달 내용 입력 ({selectedDate})</h3>
            <div className="space-y-4">
              {students.map((student, si) => (
                <div key={student.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                    <span className="text-xs text-gray-400">{student.grade}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600">🔒 원장 열람용 관찰 내용</label>
                      <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none bg-yellow-50"
                        rows={2} placeholder="학원장만 볼 수 있는 메모..."
                        value={observationNote[student.id] ?? ''}
                        onChange={e => setObservationNote(p => ({ ...p, [student.id]: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">📱 학부모 전달 내용</label>
                      <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none bg-green-50"
                        rows={2} placeholder="학부모님께 전달할 내용..."
                        value={parentMessage[student.id] ?? ''}
                        onChange={e => setParentMessage(p => ({ ...p, [student.id]: e.target.value }))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary mt-3" onClick={handleSaveObservation}>전체 저장</button>
          </div>

          {obsHistAllDates.length > 0 && (
            <div className="card p-4">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">이전 관찰 기록</h3>
                  <span className="text-xs text-gray-400">{obsHistDates.length}건</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 프리셋 버튼 */}
                  {([
                    { id: 'all', label: '전체' },
                    { id: '1w',  label: '1주일' },
                    { id: '1m',  label: '1개월' },
                    { id: '3m',  label: '3개월' },
                  ] as const).map(opt => (
                    <button key={opt.id}
                      onClick={() => { setObsHistPreset(opt.id); if (opt.id !== 'all') { setObsHistStart(''); setObsHistEnd(''); } }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={obsHistPreset === opt.id
                        ? { background: '#F59E0B', color: '#fff' }
                        : { background: '#FEF3C7', color: '#92400E' }}>
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-gray-300">|</span>
                  {/* 직접 입력 */}
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={obsHistStart}
                    onChange={e => { setObsHistStart(e.target.value); setObsHistPreset('all'); }} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={obsHistEnd}
                    onChange={e => { setObsHistEnd(e.target.value); setObsHistPreset('all'); }} />
                  {(obsHistStart || obsHistEnd) && (
                    <button onClick={() => { setObsHistStart(''); setObsHistEnd(''); setObsHistPreset('all'); }}
                      className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                </div>
              </div>

              {/* 기록 목록 */}
              <div className="space-y-3">
                {obsHistDates.map(date => {
                  const recs = students.map(s => ({
                    student: s,
                    obs: dbObservations.find(o => o.classId === classId && o.studentId === s.id && o.date === date),
                  })).filter(r => r.obs?.note || r.obs?.parentNote);
                  if (recs.length === 0) return null;
                  return (
                    <div key={date} className="rounded-lg border border-gray-100 overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50">
                        <span className="text-sm font-semibold text-gray-700">{date}</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {recs.map(({ student, obs }) => obs && (
                          <div key={student.id} className="px-3 py-2">
                            <div className="font-medium text-xs text-gray-700 mb-1">{student.name}</div>
                            {obs.note && <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mb-1">🔒 {obs.note}</div>}
                            {obs.parentNote && <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">📱 {obs.parentNote}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {obsHistDates.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">해당 기간의 기록이 없습니다</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: 과제수행 ── */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">과제 수행 결과 입력 ({selectedDate})</h3>
            <div className="space-y-2">
              {students.map((student, si) => {
                const currentResult = hwResults[student.id];
                return (
                  <div key={student.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                    <div className="flex gap-1 flex-shrink-0">
                      {hwResultOptions.map(opt => (
                        <button key={opt.result}
                          onClick={() => setHwResults(p => ({ ...p, [student.id]: opt.result }))}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            currentResult === opt.result ? opt.color : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <input className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                      placeholder="과제 평가 메모..."
                      value={hwNotes[student.id] ?? ''}
                      onChange={e => setHwNotes(p => ({ ...p, [student.id]: e.target.value }))} />
                    {currentResult && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${hwColor[currentResult]}`}>
                        {hwLabel[currentResult]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn-primary mt-3" onClick={handleSaveHomework}>저장</button>
          </div>

          {hwAllDates.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">이전 과제 수행 기록</h3>
                  <span className="text-xs text-gray-400">{hwDates.length}건</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([
                    { id:'1w',  label:'1주일' },
                    { id:'1m',  label:'1개월' },
                    { id:'3m',  label:'3개월' },
                  ] as const).map(opt => (
                    <button key={opt.id}
                      onClick={() => { setHwHistPreset(opt.id); setHwHistStart(''); setHwHistEnd(''); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={hwHistPreset === opt.id
                        ? { background:'#3B82F6', color:'#fff' }
                        : { background:'#EFF6FF', color:'#1D4ED8' }}>
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-gray-300">|</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={hwHistStart}
                    onChange={e => { setHwHistStart(e.target.value); setHwHistPreset('all'); }} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={hwHistEnd}
                    onChange={e => { setHwHistEnd(e.target.value); setHwHistPreset('all'); }} />
                  {(hwHistStart || hwHistEnd) && (
                    <button onClick={() => { setHwHistStart(''); setHwHistEnd(''); setHwHistPreset('1w'); }}
                      className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {hwDates.map(date => {
                  const recs = dbHomework.filter(r => r.classId === classId && r.date === date);
                  return (
                    <div key={date} className="rounded-lg border border-gray-100 overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">{date}</span>
                        <span className="text-xs text-gray-400">{recs.length}명</span>
                      </div>
                      <div className="px-3 py-2 flex flex-wrap gap-1.5">
                        {recs.map(r => {
                          const s = students.find(st => st.id === r.studentId);
                          if (!s) return null;
                          const pc = hwPillColor[r.result];
                          return (
                            <div key={r.studentId} className="flex flex-col gap-0.5">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: pc.bg, color: pc.text }}>
                                {s.name}: {hwLabel[r.result]}
                              </span>
                              {r.note && <span className="text-[10px] text-gray-400 px-2">{r.note}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {hwDates.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">해당 기간의 기록이 없습니다</p>
                )}
              </div>
            </div>
          )}

          {/* 과제 수행도 추이 */}
          {(hwLineData.length > 0 || hwDates.length > 0) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-800">과제 수행도 추이</h3>
                  {/* 그래프 보기일 때만 범례 표시 */}
                  {hwSubTab === 'chart' && (
                    <p className="text-xs text-gray-400">우수=100 · 보통=70 · 미흡=35 · 미제출=0</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 기간 프리셋 */}
                  {([
                    { id:'1w', label:'1주일' },
                    { id:'1m', label:'1개월' },
                    { id:'3m', label:'3개월' },
                  ] as const).map(opt => (
                    <button key={opt.id}
                      onClick={() => { setHwHistPreset(opt.id); setHwHistStart(''); setHwHistEnd(''); }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={hwHistPreset === opt.id
                        ? { background:'#3B82F6', color:'#fff' }
                        : { background:'#EFF6FF', color:'#1D4ED8' }}>
                      {opt.label}
                    </button>
                  ))}
                  <span className="text-gray-300">|</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={hwHistStart}
                    onChange={e => { setHwHistStart(e.target.value); setHwHistPreset('all'); }} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={hwHistEnd}
                    onChange={e => { setHwHistEnd(e.target.value); setHwHistPreset('all'); }} />
                  {(hwHistStart || hwHistEnd) && (
                    <button onClick={() => { setHwHistStart(''); setHwHistEnd(''); setHwHistPreset('1w'); }}
                      className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                  <span className="text-gray-300">|</span>
                  {/* 캘린더/그래프 탭 */}
                  <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
                    {(['calendar', 'chart'] as HwSubTab[]).map(t => (
                      <button key={t} onClick={() => setHwSubTab(t)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${hwSubTab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                        {t === 'calendar' ? '캘린더' : '그래프'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hwSubTab === 'calendar' ? (
                <div>
                  {/* 범례 */}
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    {[
                      { label:'우수',   bg:'#3b82f6' },
                      { label:'보통',   bg:'#10b981' },
                      { label:'미흡',   bg:'#f97316' },
                      { label:'미제출', bg:'#9ca3af' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.bg }} />
                        <span className="text-[11px] text-gray-500">{l.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 text-center">
                    {['일','월','화','수','목','금','토'].map(d => (
                      <div key={d} className="text-[10px] text-gray-400 font-semibold py-1">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
                      const hasClass = (cls.days as string[]).some(d => DAY_MAP[d] === new Date(dateStr).getDay());
                      if (!hasClass) return <div key={day} className="py-1 text-[10px] text-gray-200 text-center">{day}</div>;
                      const dayHw = dbHomework.filter(r => r.classId === classId && r.date === dateStr);
                      const hwResultBg: Record<string, string> = {
                        excellent:'#3b82f6', good:'#10b981', poor:'#f97316', not_submitted:'#9ca3af',
                      };
                      return (
                        <div key={day} className="rounded border border-gray-100 p-0.5 min-h-[56px]" style={{ background: '#FAFAFA' }}>
                          <div className="text-[10px] font-semibold text-gray-500 text-center mb-0.5">{day}</div>
                          <div className="grid grid-cols-3 gap-0.5">
                            {students.map((s, si) => {
                              const hw = dayHw.find(r => r.studentId === s.id);
                              if (!hw) return <div key={s.id} />;
                              return <CalPill key={s.id} name={givenName(s.name)} index={si} bg={hwResultBg[hw.result]} />;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                hwLineData.length > 0 ? (
                  <>
                    {/* 학생 토글 버튼 */}
                    <div className="flex gap-1 flex-wrap mb-2">
                      {students.map((s, i) => (
                        <button key={s.id}
                          onClick={() => toggleStudent(setHwLineStudents, s.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            hwLineStudents.length === 0 || hwLineStudents.includes(s.id)
                              ? 'text-white border-transparent'
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                          style={hwLineStudents.length === 0 || hwLineStudents.includes(s.id)
                            ? { background: COLORS[i % COLORS.length] } : {}}>
                          {s.name}
                        </button>
                      ))}
                      {hwLineStudents.length > 0 && (
                        <button onClick={() => setHwLineStudents([])}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">전체</button>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={hwLineData} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }}
                          tickFormatter={v => ({ 100:'우수', 70:'보통', 35:'미흡', 0:'미제출' }[v as number] ?? String(v))} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const scoreToLabel: Record<number, string> = { 100:'우수', 70:'보통', 35:'미흡', 0:'미제출' };
                            const labelColor: Record<string, string> = {
                              '우수':'#3b82f6', '보통':'#10b981', '미흡':'#f97316', '미제출':'#9ca3af',
                            };
                            return (
                              <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
                                <div style={{ fontWeight:700, marginBottom:4 }}>{label}</div>
                                {payload.map(p => {
                                  const txt = scoreToLabel[p.value as number] ?? String(p.value);
                                  return (
                                    <div key={p.dataKey as string} style={{ marginBottom:2 }}>
                                      <span style={{ color: p.stroke as string }}>{String(p.dataKey)}: </span>
                                      <span style={{ fontWeight:700, color: labelColor[txt] ?? '#374151' }}>{txt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }}
                        />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                        {students.filter(s => visibleHwStudents.includes(s.id)).map((s, i) => (
                          <Line key={s.id} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">과제 데이터가 없습니다</p>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: 데일리테스트 ── */}
      {activeTab === 'daily_test' && (
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">데일리 테스트 ({selectedDate})</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">만점</label>
                <input type="number" min={1}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                  value={dailyMaxScore} onChange={e => setDailyMaxScore(e.target.value)} />
                <span className="text-xs text-gray-400">점</span>
              </div>
            </div>
            <div className="space-y-2">
              {students.map((student, si) => (
                <div key={student.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                  <span className="text-xs text-gray-400 flex-shrink-0">{student.grade}</span>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={Number(dailyMaxScore) || 100}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center"
                      placeholder="점수"
                      value={dailyScores[student.id] ?? ''}
                      onChange={e => setDailyScores(p => ({ ...p, [student.id]: e.target.value }))} />
                    <span className="text-sm text-gray-400">/ {dailyMaxScore || 100}</span>
                  </div>
                </div>
              ))}
            </div>
            {(() => {
              const scores = Object.values(dailyScores).filter(v => v !== '').map(Number);
              const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
              return avg ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between text-sm text-blue-700">
                  <span>반 평균: <strong>{avg}점</strong> / {dailyMaxScore || 100}점</span>
                  <span className="text-xs">({scores.length}명 입력)</span>
                </div>
              ) : null;
            })()}
            <button className="btn-primary mt-3 w-full" onClick={handleSaveDailyTest}>저장</button>
          </div>

          {allDailyDates.length > 0 && (
            <div className="card p-4">
              {/* ── 헤더: 제목 + 뷰 토글 + 기간 필터 ── */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">이전 데일리테스트 기록</h3>
                  <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
                    {(['list','chart'] as const).map(v => (
                      <button key={v} onClick={() => setDailyHistView(v)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${dailyHistView === v ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                        {v === 'list' ? '목록' : '그래프'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => { setDailyHistStart(dateRelative(7)); setDailyHistEnd(todayStr); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600">1주일</button>
                  <button onClick={() => { setDailyHistStart(dateRelative(30)); setDailyHistEnd(todayStr); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600">1개월</button>
                  <span className="text-gray-300">|</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={dailyHistStart} onChange={e => setDailyHistStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={dailyHistEnd} onChange={e => setDailyHistEnd(e.target.value)} />
                  {(dailyHistStart || dailyHistEnd) && (
                    <button onClick={() => { setDailyHistStart(''); setDailyHistEnd(''); }}
                      className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                </div>
              </div>

              {/* ── 목록 뷰 ── */}
              {dailyHistView === 'list' && (
                <div className="space-y-2">
                  {filteredDailyDates.map(date => {
                    const dayScores = dbTestScores.filter(t => t.classId === classId && t.date === date && t.type === 'daily');
                    const avg = dayScores.length > 0 ? (dayScores.reduce((s, t) => s + t.score / t.maxScore * 100, 0) / dayScores.length).toFixed(1) : '-';
                    const gradeAvg = getGradeAvg(date, 'daily');
                    const schoolAvg = getSchoolAvg(date, 'daily');
                    return (
                      <div key={date} className="rounded-lg border border-gray-100 overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 flex items-center justify-between flex-wrap gap-1">
                          <span className="text-sm font-semibold text-gray-700">{date}</span>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="text-blue-600 font-medium">반평균 {avg}%</span>
                            {gradeAvg && <span className="text-purple-600">학년평균 {gradeAvg}%</span>}
                            {schoolAvg && <span className="text-green-600">학교평균 {schoolAvg}%</span>}
                          </div>
                        </div>
                        <div className="px-3 py-2 flex flex-wrap gap-1.5">
                          {dayScores.map(t => {
                            const s = students.find(st => st.id === t.studentId);
                            const pct = Math.round(t.score / t.maxScore * 100);
                            const color = pct >= 80 ? { bg:'#DBEAFE', text:'#1D4ED8' }
                                        : pct >= 60 ? { bg:'#D1FAE5', text:'#065F46' }
                                        :             { bg:'#FEE2E2', text:'#DC2626' };
                            return s ? (
                              <span key={t.studentId} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: color.bg, color: color.text }}>
                                {s.name}: {t.score}/{t.maxScore} ({pct}%)
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filteredDailyDates.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">해당 기간의 기록이 없습니다</p>
                  )}
                </div>
              )}

              {/* ── 그래프 뷰 ── */}
              {dailyHistView === 'chart' && (() => {
                // 오래된 순(왼→오른)으로 정렬된 차트 데이터
                const chartDates = [...filteredDailyDates].reverse();
                const chartData = chartDates.map(date => {
                  const row: Record<string, number | string | null> = { date: date.slice(5) };
                  const allPcts: number[] = [];
                  students.forEach(s => {
                    const sc = dbTestScores.find(t => t.studentId === s.id && t.classId === classId && t.date === date && t.type === 'daily');
                    const pct = sc ? Math.round(sc.score / sc.maxScore * 100) : null;
                    row[s.name] = pct;
                    if (pct !== null) allPcts.push(pct);
                  });
                  row['반평균'] = allPcts.length > 0 ? Math.round(allPcts.reduce((a,b) => a+b,0) / allPcts.length) : null;
                  return row;
                });

                // 선택된 학생 ('' = 전체)
                const selStu = students.find(s => s.id === dailyHistStu);
                const visStudents = selStu ? [selStu] : students;

                return (
                  <div>
                    {/* 학생 선택 */}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <button
                        onClick={() => setDailyHistStu('')}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={dailyHistStu === ''
                          ? { background:'#475569', color:'#fff' }
                          : { background:'#F1F5F9', color:'#64748B' }}>
                        전체
                      </button>
                      {students.map((s, si) => (
                        <button key={s.id}
                          onClick={() => setDailyHistStu(prev => prev === s.id ? '' : s.id)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                          style={dailyHistStu === s.id
                            ? { background: COLORS[si % COLORS.length], color:'#fff' }
                            : { background:'#F1F5F9', color:'#64748B' }}>
                          {s.name}
                        </button>
                      ))}
                    </div>

                    {chartDates.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">해당 기간의 기록이 없습니다</p>
                    ) : (
                      <>
                        {/* 선택 학생 상세 통계 */}
                        {selStu && (() => {
                          const stuScores = chartDates.map(date =>
                            dbTestScores.find(t => t.studentId === selStu.id && t.classId === classId && t.date === date && t.type === 'daily')
                          ).filter(Boolean);
                          const pcts = stuScores.map(t => Math.round(t!.score / t!.maxScore * 100));
                          const avg = pcts.length > 0 ? (pcts.reduce((a,b) => a+b,0) / pcts.length).toFixed(1) : '-';
                          const max = pcts.length > 0 ? Math.max(...pcts) : '-';
                          const min = pcts.length > 0 ? Math.min(...pcts) : '-';
                          const siIdx = students.findIndex(s => s.id === selStu.id);
                          return (
                            <div className="flex gap-3 mb-3 flex-wrap">
                              {[
                                { label:'평균', value:`${avg}%` },
                                { label:'최고', value:`${max}%` },
                                { label:'최저', value:`${min}%` },
                                { label:'응시', value:`${pcts.length}회` },
                              ].map(item => (
                                <div key={item.label} className="flex-1 min-w-[60px] rounded-xl px-3 py-2 text-center"
                                  style={{ background: COLORS[siIdx % COLORS.length] + '18', border:`1px solid ${COLORS[siIdx % COLORS.length]}40` }}>
                                  <div className="text-[10px] text-gray-400 mb-0.5">{item.label}</div>
                                  <div className="text-sm font-bold" style={{ color: COLORS[siIdx % COLORS.length] }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={chartData} margin={{ left: -10, right: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                            <Tooltip
                              formatter={(value, name) => value !== null ? [`${value}%`, name] : ['미응시', name]}
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                            {/* 학생 라인 */}
                            {visStudents.map((s) => {
                              const siIdx = students.findIndex(st => st.id === s.id);
                              return (
                                <Line key={s.id} type="monotone" dataKey={s.name}
                                  stroke={COLORS[siIdx % COLORS.length]}
                                  strokeWidth={selStu ? 2.5 : 1.5}
                                  dot={{ r: selStu ? 4 : 2.5, fill: COLORS[siIdx % COLORS.length] }}
                                  activeDot={{ r: 6 }}
                                  connectNulls={false}
                                />
                              );
                            })}
                            {/* 반평균 (점선) */}
                            <Line type="monotone" dataKey="반평균"
                              stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5"
                              dot={false} activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: 주간/월간 시험 ── */}
      {activeTab === 'exam' && (
        <div className="space-y-4">
          {/* 성적표 생성 버튼 */}
          <div className="flex justify-end">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
              style={{ background: '#4F46E5', color: '#fff' }}
              onClick={() => { setReportGenerated(true); setReportChecked(Object.fromEntries(students.map(s => [s.id, true]))); setActiveTab('report_card'); }}
            >
              📜 성적표 생성
            </button>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 mb-3">시험 등록</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">시험명</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="예: 4월 3주 주간테스트"
                  value={examName} onChange={e => setExamName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">시험 유형</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={examType} onChange={e => setExamType(e.target.value as 'weekly' | 'monthly')}>
                  <option value="weekly">주간</option>
                  <option value="monthly">월간</option>
                </select>
              </div>
            </div>

            {/* ── 시험 분야 설정 ── */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  시험 분야 설정
                  <span className="ml-1 text-xs text-gray-400 font-normal">(선택 — 분야별 점수를 따로 입력할 경우 추가)</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  📌 반별 자동 저장
                </span>
              </div>
              <div className="flex gap-2 mt-1.5">
                <input
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="예: 단어, 듣기, 읽기 — 쉼표 구분 또는 Enter"
                  value={examFieldInput}
                  onChange={e => setExamFieldInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && examFieldInput.trim()) {
                      const fs = examFieldInput.split(/[,，\s]+/).map(f => f.trim()).filter(Boolean);
                      setExamFields(prev => [...new Set([...prev, ...fs])]);
                      setExamFieldInput('');
                    }
                  }}
                />
                <button
                  className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100"
                  onClick={() => {
                    if (!examFieldInput.trim()) return;
                    const fs = examFieldInput.split(/[,，\s]+/).map(f => f.trim()).filter(Boolean);
                    setExamFields(prev => [...new Set([...prev, ...fs])]);
                    setExamFieldInput('');
                  }}
                >추가</button>
              </div>
              {examFields.length > 0 && (
                <div
                  className="flex gap-2 flex-wrap mt-2 items-center"
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIdx(null); }}
                >
                  <p className="w-full text-[10px] text-gray-400 -mb-0.5">⠿ 드래그로 순서 변경 &nbsp;·&nbsp; 이름 더블클릭으로 수정</p>
                  {examFields.map((f, i) => {
                    const bg     = COLORS[i % COLORS.length];
                    const isEdit = editingFieldIdx === i;
                    const isDrag = dragFieldIdx === i;
                    const isOver = dragOverIdx === i && dragFieldIdx !== i;
                    return (
                      <div
                        key={i}
                        draggable={!isEdit}
                        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragFieldIdx(i); }}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverIdx(i); }}
                        onDrop={e => {
                          e.preventDefault();
                          if (dragFieldIdx !== null && dragFieldIdx !== i) {
                            setExamFields(prev => {
                              const arr = [...prev];
                              const [moved] = arr.splice(dragFieldIdx, 1);
                              arr.splice(i, 0, moved);
                              return arr;
                            });
                          }
                          setDragFieldIdx(null); setDragOverIdx(null);
                        }}
                        onDragEnd={() => { setDragFieldIdx(null); setDragOverIdx(null); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-semibold select-none transition-all duration-150"
                        style={{
                          background: bg,
                          opacity:    isDrag ? 0.3 : 1,
                          cursor:     isEdit ? 'default' : 'grab',
                          outline:    isOver ? '2.5px solid #6366f1' : 'none',
                          outlineOffset: '2px',
                          transform:  isOver ? 'scale(1.06)' : 'scale(1)',
                          boxShadow:  isOver ? `0 0 0 4px ${bg}44` : '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      >
                        {/* 드래그 핸들 */}
                        {!isEdit && <span className="text-white/50 mr-0.5 text-[13px] leading-none">⠿</span>}

                        {/* 이름 / 편집 input */}
                        {isEdit ? (
                          <>
                            <input
                              className="text-xs w-16 rounded px-1 py-0.5 font-semibold outline-none text-gray-800"
                              style={{ background: 'rgba(255,255,255,0.92)' }}
                              value={editingFieldValue}
                              autoFocus
                              onChange={e => setEditingFieldValue(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const v = editingFieldValue.trim();
                                  if (v) setExamFields(prev => prev.map((x, idx) => idx === i ? v : x));
                                  setEditingFieldIdx(null);
                                }
                                if (e.key === 'Escape') setEditingFieldIdx(null);
                              }}
                            />
                            <button
                              className="text-white/90 hover:text-white font-bold text-[11px] px-0.5"
                              onClick={e => { e.stopPropagation(); const v = editingFieldValue.trim(); if (v) setExamFields(prev => prev.map((x, idx) => idx === i ? v : x)); setEditingFieldIdx(null); }}
                            >✓</button>
                            <button
                              className="text-white/60 hover:text-white text-[11px]"
                              onClick={e => { e.stopPropagation(); setEditingFieldIdx(null); }}
                            >✗</button>
                          </>
                        ) : (
                          <span
                            className="px-0.5 cursor-pointer"
                            title="더블클릭으로 이름 수정"
                            onDoubleClick={e => { e.stopPropagation(); setEditingFieldIdx(i); setEditingFieldValue(f); }}
                          >{f}</span>
                        )}

                        {/* 삭제 */}
                        {!isEdit && (
                          <button
                            className="text-white/60 hover:text-white ml-0.5 text-sm font-bold leading-none"
                            onClick={e => { e.stopPropagation(); setExamFields(prev => prev.filter((_, idx) => idx !== i)); }}
                          >×</button>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => { if (window.confirm('시험 분야를 모두 삭제하시겠습니까? 이 반의 분야 설정이 초기화됩니다.')) { setExamFields([]); setExamSubScores({}); } }}
                    className="px-2.5 py-1.5 bg-gray-100 text-gray-400 rounded-xl text-xs hover:bg-red-50 hover:text-red-400 font-medium"
                  >전체삭제</button>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">점수 입력</h3>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">{examFields.length > 0 ? '분야별 만점' : '만점'}</label>
                <input type="number" min={1}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                  value={examMaxScore} onChange={e => setExamMaxScore(e.target.value)} />
                <span className="text-xs text-gray-400">점</span>
              </div>
            </div>

            {examFields.length > 0 ? (
              /* ── 분야별 점수 입력 테이블 ── */
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 rounded-tl-lg">학생</th>
                      {examFields.map(f => (
                        <th key={f} className="px-2 py-2 text-center text-xs font-semibold text-indigo-700 min-w-[72px]">
                          {f}<br /><span className="font-normal text-gray-400">/{examMaxScore || 100}</span>
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 rounded-tr-lg">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, si) => {
                      const subTotal = examFields.reduce((sum, f) => sum + Number(examSubScores[student.id]?.[f] || 0), 0);
                      const maxTotal = examFields.length * (Number(examMaxScore) || 100);
                      const pct = maxTotal > 0 ? Math.round(subTotal / maxTotal * 100) : 0;
                      return (
                        <tr key={student.id} className="border-t border-gray-50">
                          <td className="px-2 py-2">
                            <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                          </td>
                          {examFields.map(f => (
                            <td key={f} className="px-2 py-1.5">
                              <input
                                type="number" min={0} max={Number(examMaxScore) || 100}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:border-indigo-400 focus:outline-none"
                                placeholder="—"
                                value={examSubScores[student.id]?.[f] ?? ''}
                                onChange={e => setExamSubScores(prev => ({
                                  ...prev,
                                  [student.id]: { ...(prev[student.id] ?? {}), [f]: e.target.value },
                                }))}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center">
                            <span className="font-bold text-gray-800">{subTotal}</span>
                            <span className="text-xs text-gray-400 ml-1">/ {maxTotal}</span>
                            <div className="text-[10px] text-indigo-500 font-medium">{pct}%</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* ── 단일 점수 입력 (기존) ── */
              <div className="space-y-2">
                {students.map((student, si) => (
                  <div key={student.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                    <span className="text-xs text-gray-400 flex-shrink-0">{student.grade}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={Number(examMaxScore) || 100}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center"
                        placeholder="점수"
                        value={examScores[student.id] ?? ''}
                        onChange={e => setExamScores(p => ({ ...p, [student.id]: e.target.value }))} />
                      <span className="text-sm text-gray-400">/ {examMaxScore || 100}</span>
                    </div>
                  </div>
                ))}
                {(() => {
                  const scores = Object.values(examScores).filter(v => v !== '').map(Number);
                  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
                  return avg ? (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-center justify-between text-sm text-blue-700">
                      <span>반 평균: <strong>{avg}점</strong> / {examMaxScore || 100}점</span>
                      <span className="text-xs">({scores.length}명 입력)</span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            <button className="btn-primary mt-3 w-full" onClick={handleSaveExam}>점수 저장</button>
          </div>

          {allExamDates.length > 0 && (
            <div className="card p-4">
              {/* ── 헤더: 제목 + 뷰 토글 + 기간 필터 ── */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">이전 시험 기록</h3>
                  <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
                    {(['list', 'chart'] as const).map(v => (
                      <button key={v} onClick={() => setExamHistView(v)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${examHistView === v ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}>
                        {v === 'list' ? '목록' : '그래프'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => { setExamHistStart(dateRelative(7)); setExamHistEnd(todayStr); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-600">1주일</button>
                  <button onClick={() => { setExamHistStart(dateRelative(30)); setExamHistEnd(todayStr); }}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-600">1개월</button>
                  <span className="text-gray-300">|</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={examHistStart} onChange={e => setExamHistStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    value={examHistEnd} onChange={e => setExamHistEnd(e.target.value)} />
                  {(examHistStart || examHistEnd) && (
                    <button onClick={() => { setExamHistStart(''); setExamHistEnd(''); }}
                      className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                </div>
              </div>

              {/* ── 목록 뷰 ── */}
              {examHistView === 'list' && (
                <div className="space-y-2">
                  {filteredExamDates.map(date => {
                    const dayScores = dbTestScores.filter(t => t.classId === classId && t.date === date && (t.type === 'weekly' || t.type === 'monthly'));
                    const first = dayScores[0];
                    const avg = dayScores.length > 0 ? (dayScores.reduce((s, t) => s + t.score / t.maxScore * 100, 0) / dayScores.length).toFixed(1) : '-';
                    const gradeAvg = getGradeAvg(date, first?.type ?? 'weekly');
                    const schoolAvg = getSchoolAvg(date, first?.type ?? 'weekly');
                    return (
                      <div key={date} className="rounded-lg border overflow-hidden transition-all"
                        style={{ borderColor: editingExamDate === date ? '#A5B4FC' : '#f3f4f6' }}>
                        {/* 클릭 가능한 헤더 행 */}
                        <div
                          className="px-3 py-2 bg-gray-50 flex items-center justify-between flex-wrap gap-1 cursor-pointer hover:bg-indigo-50 transition-colors"
                          onClick={() => openEditExam(date)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">{first?.testName ?? date}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: first?.type === 'monthly' ? '#EDE9FE' : '#DBEAFE', color: first?.type === 'monthly' ? '#5B21B6' : '#1D4ED8' }}>
                              {first?.type === 'monthly' ? '월간' : '주간'}
                            </span>
                            <span className="text-[10px] text-gray-400">{date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="text-purple-600 font-medium">반평균 {avg}%</span>
                            {gradeAvg && <span className="text-blue-600">학년평균 {gradeAvg}%</span>}
                            {schoolAvg && <span className="text-green-600">학교평균 {schoolAvg}%</span>}
                            <span className="text-indigo-400 text-[10px]">{editingExamDate === date ? '▲ 닫기' : '✏️ 수정'}</span>
                          </div>
                        </div>
                        {/* 점수 요약 */}
                        <div className="px-3 py-2 flex flex-wrap gap-1.5">
                          {dayScores.map(t => {
                            const s = students.find(st => st.id === t.studentId);
                            const pct = Math.round(t.score / t.maxScore * 100);
                            const color = pct >= 80 ? { bg:'#EDE9FE', text:'#5B21B6' }
                                        : pct >= 60 ? { bg:'#D1FAE5', text:'#065F46' }
                                        :             { bg:'#FEE2E2', text:'#DC2626' };
                            return s ? (
                              <span key={t.studentId} className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: color.bg, color: color.text }}>
                                {s.name}: {t.score}/{t.maxScore} ({pct}%)
                              </span>
                            ) : null;
                          })}
                        </div>
                        {/* ── 인라인 편집 패널 ── */}
                        {editingExamDate === date && (() => {
                          const hasFields = Array.isArray(first?.fields) && (first.fields as string[]).length > 0;
                          const fields = hasFields ? (first.fields as string[]) : [];
                          const perMax = Number(editExamMaxScore) || 100;
                          return (
                            <div className="border-t border-indigo-100 bg-indigo-50/30 px-3 py-3 space-y-3">
                              {/* 시험명/유형/만점 */}
                              <div className="flex gap-2 flex-wrap items-end">
                                <div className="flex-1 min-w-[120px]">
                                  <label className="text-[10px] text-gray-500 block mb-0.5">시험명</label>
                                  <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                                    value={editExamName} onChange={e => setEditExamName(e.target.value)} />
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 block mb-0.5">유형</label>
                                  <select className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                                    value={editExamType} onChange={e => setEditExamType(e.target.value as 'weekly' | 'monthly')}>
                                    <option value="weekly">주간</option>
                                    <option value="monthly">월간</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-gray-500 block mb-0.5">{hasFields ? '분야별 만점' : '만점'}</label>
                                  <input type="number" min={1} className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center bg-white"
                                    value={editExamMaxScore} onChange={e => setEditExamMaxScore(e.target.value)} />
                                </div>
                              </div>
                              {/* 점수 입력 */}
                              {hasFields ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm border-collapse">
                                    <thead>
                                      <tr className="bg-white">
                                        <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-500">학생</th>
                                        {fields.map(f => (
                                          <th key={f} className="px-2 py-1.5 text-center text-xs font-semibold text-indigo-700 min-w-[64px]">
                                            {f}<br /><span className="font-normal text-gray-400">/{perMax}</span>
                                          </th>
                                        ))}
                                        <th className="px-2 py-1.5 text-center text-xs font-semibold text-gray-700">합계</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {students.map((student, si) => {
                                        const subTotal = fields.reduce((sum, f) => sum + Number(editExamSubScores[student.id]?.[f] || 0), 0);
                                        const maxTotal = fields.length * perMax;
                                        const pct2 = maxTotal > 0 ? Math.round(subTotal / maxTotal * 100) : 0;
                                        return (
                                          <tr key={student.id} className="border-t border-gray-100">
                                            <td className="px-2 py-1.5">
                                              <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                                            </td>
                                            {fields.map(f => (
                                              <td key={f} className="px-1 py-1">
                                                <input type="number" min={0} max={perMax}
                                                  className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm text-center bg-white focus:border-indigo-400 focus:outline-none"
                                                  placeholder="—"
                                                  value={editExamSubScores[student.id]?.[f] ?? ''}
                                                  onChange={e => setEditExamSubScores(prev => ({
                                                    ...prev,
                                                    [student.id]: { ...(prev[student.id] ?? {}), [f]: e.target.value },
                                                  }))} />
                                              </td>
                                            ))}
                                            <td className="px-2 py-1.5 text-center">
                                              <span className="font-bold text-gray-800">{subTotal}</span>
                                              <span className="text-xs text-gray-400 ml-1">/ {maxTotal}</span>
                                              <div className="text-[10px] text-indigo-500">{pct2}%</div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {students.map((student, si) => (
                                    <div key={student.id} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                                      <StudentNamePill student={student} index={si} onClick={() => setSelectedStudentId(student.id)} />
                                      <div className="flex-1" />
                                      <input type="number" min={0} max={perMax}
                                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center"
                                        placeholder="점수"
                                        value={editExamScores[student.id] ?? ''}
                                        onChange={e => setEditExamScores(p => ({ ...p, [student.id]: e.target.value }))} />
                                      <span className="text-xs text-gray-400">/ {perMax}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                                  onClick={() => handleSaveEditExam(date)}>수정 저장</button>
                                <button className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm hover:bg-gray-200"
                                  onClick={() => setEditingExamDate(null)}>취소</button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                  {filteredExamDates.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">해당 기간의 기록이 없습니다</p>
                  )}
                </div>
              )}

              {/* ── 그래프 뷰 ── */}
              {examHistView === 'chart' && (() => {
                // 오래된 순(왼→오른)으로 정렬
                const chartDates = [...filteredExamDates].reverse();
                const chartData = chartDates.map(date => {
                  const dayScores = dbTestScores.filter(t => t.classId === classId && t.date === date && (t.type === 'weekly' || t.type === 'monthly'));
                  const first = dayScores[0];
                  const row: Record<string, number | string | null> = {
                    date: (first?.testName ?? date).replace(/^.*?\s/, ''),   // 시험명 간략화
                    fullLabel: first?.testName ?? date,
                    examType: first?.type ?? 'weekly',
                  };
                  const allPcts: number[] = [];
                  students.forEach(s => {
                    const sc = dayScores.find(t => t.studentId === s.id);
                    const pct = sc ? Math.round(sc.score / sc.maxScore * 100) : null;
                    row[s.name] = pct;
                    if (pct !== null) allPcts.push(pct);
                  });
                  row['반평균'] = allPcts.length > 0 ? Math.round(allPcts.reduce((a,b) => a+b,0) / allPcts.length) : null;
                  return row;
                });

                const selStu = students.find(s => s.id === examHistStu);
                const visStudents = selStu ? [selStu] : students;

                return (
                  <div>
                    {/* 학생 선택 */}
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <button onClick={() => setExamHistStu('')}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                        style={examHistStu === ''
                          ? { background:'#475569', color:'#fff' }
                          : { background:'#F1F5F9', color:'#64748B' }}>
                        전체
                      </button>
                      {students.map((s, si) => (
                        <button key={s.id}
                          onClick={() => setExamHistStu(prev => prev === s.id ? '' : s.id)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                          style={examHistStu === s.id
                            ? { background: COLORS[si % COLORS.length], color:'#fff' }
                            : { background:'#F1F5F9', color:'#64748B' }}>
                          {s.name}
                        </button>
                      ))}
                    </div>

                    {chartDates.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-8">해당 기간의 기록이 없습니다</p>
                    ) : (
                      <>
                        {/* 선택 학생 통계 카드 */}
                        {selStu && (() => {
                          const siIdx = students.findIndex(s => s.id === selStu.id);
                          const pcts = chartDates.map(date => {
                            const sc = dbTestScores.find(t => t.studentId === selStu.id && t.classId === classId && t.date === date && (t.type === 'weekly' || t.type === 'monthly'));
                            return sc ? Math.round(sc.score / sc.maxScore * 100) : null;
                          }).filter((v): v is number => v !== null);
                          const avg  = pcts.length > 0 ? (pcts.reduce((a,b) => a+b,0) / pcts.length).toFixed(1) : '-';
                          const max  = pcts.length > 0 ? Math.max(...pcts) : '-';
                          const min  = pcts.length > 0 ? Math.min(...pcts) : '-';
                          const clr  = COLORS[siIdx % COLORS.length];
                          return (
                            <div className="flex gap-3 mb-3 flex-wrap">
                              {[
                                { label:'평균', value:`${avg}%` },
                                { label:'최고', value:`${max}%` },
                                { label:'최저', value:`${min}%` },
                                { label:'응시', value:`${pcts.length}회` },
                              ].map(item => (
                                <div key={item.label} className="flex-1 min-w-[60px] rounded-xl px-3 py-2 text-center"
                                  style={{ background:`${clr}18`, border:`1px solid ${clr}40` }}>
                                  <div className="text-[10px] text-gray-400 mb-0.5">{item.label}</div>
                                  <div className="text-sm font-bold" style={{ color: clr }}>{item.value}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={chartData} margin={{ left: -10, right: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={0}
                              tickFormatter={(v: string) => v.length > 8 ? v.slice(0, 8) + '…' : v} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                            <Tooltip
                              labelFormatter={(label, payload) => {
                                const full = payload?.[0]?.payload?.fullLabel ?? label;
                                const type = payload?.[0]?.payload?.examType;
                                return `${full}${type ? ` (${type === 'monthly' ? '월간' : '주간'})` : ''}`;
                              }}
                              formatter={(value, name) => value !== null ? [`${value}%`, name] : ['미응시', name]}
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                            {visStudents.map((s) => {
                              const siIdx = students.findIndex(st => st.id === s.id);
                              return (
                                <Line key={s.id} type="monotone" dataKey={s.name}
                                  stroke={COLORS[siIdx % COLORS.length]}
                                  strokeWidth={selStu ? 2.5 : 1.5}
                                  dot={{ r: selStu ? 4 : 2.5, fill: COLORS[siIdx % COLORS.length] }}
                                  activeDot={{ r: 6 }}
                                  connectNulls={false}
                                />
                              );
                            })}
                            <Line type="monotone" dataKey="반평균"
                              stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="5 5"
                              dot={false} activeDot={{ r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: 성적표 (모바일 최적화, 19.5:9) ── */}
      {activeTab === 'report_card' && (() => {
        // ── 선택 월 기간 계산 ──────────────────────────────────────────────
        const [rptY, rptM] = reportMonth.split('-').map(Number);
        const rptMonthStart = `${reportMonth}-01`;
        const rptMonthEnd   = `${reportMonth}-${String(new Date(rptY, rptM, 0).getDate()).padStart(2, '0')}`;

        // 월간 평가: 선택월 포함 최근 3개월 시작
        const m3StartDate = new Date(rptY, rptM - 3, 1);
        const m3Start = `${m3StartDate.getFullYear()}-${String(m3StartDate.getMonth() + 1).padStart(2, '0')}-01`;

        // ── 데이터 필터링 ──────────────────────────────────────────────────
        // 데일리·주간: 선택 월 전체
        const clsDailyAll  = dbTestScores.filter(t => t.classId === classId && t.type === 'daily'   && t.date >= rptMonthStart && t.date <= rptMonthEnd);
        const clsWeekly    = dbTestScores.filter(t => t.classId === classId && t.type === 'weekly'  && t.date >= rptMonthStart && t.date <= rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));
        // 월간: 선택월 포함 최근 3개월
        const clsMonthly   = dbTestScores.filter(t => t.classId === classId && t.type === 'monthly' && t.date >= m3Start && t.date <= rptMonthEnd).sort((a,b)=>a.date.localeCompare(b.date));
        // 출석·과제: 선택 월
        const clsAtt       = dbAttendance.filter(a => a.classId === classId && a.date >= rptMonthStart && a.date <= rptMonthEnd);
        const clsHw        = dbHomework.filter(h => h.classId === classId && h.date >= rptMonthStart && h.date <= rptMonthEnd);

        // 선택 월 전체 날짜 (slice 없음) / 월간은 최근 3개월
        const dailyDates   = [...new Set(clsDailyAll.map(t=>t.date))].sort();
        const weeklyDates  = [...new Set(clsWeekly.map(t=>t.date))].sort();
        const monthlyDates = [...new Set(clsMonthly.map(t=>t.date))].sort().slice(-3);

        // ── 반 평균 (날짜별) ──────────────────────────────────────────────
        const clsDailyAvgMap: Record<string, number> = Object.fromEntries(
          dailyDates.map(d => {
            const s = clsDailyAll.filter(x => x.date === d);
            return [d, s.length ? Math.round(s.reduce((a, b) => a + b.score, 0) / s.length) : 0];
          })
        );
        const clsWeeklyAvgMap: Record<string, number> = Object.fromEntries(
          weeklyDates.map(d => {
            const s = clsWeekly.filter(x => x.date === d);
            return [d, s.length ? Math.round(s.reduce((a, b) => a + b.score, 0) / s.length) : 0];
          })
        );
        const clsMonthlyAvgMap: Record<string, number> = Object.fromEntries(
          monthlyDates.map(d => {
            const s = clsMonthly.filter(x => x.date === d);
            return [d, s.length ? Math.round(s.reduce((a, b) => a + b.score, 0) / s.length) : 0];
          })
        );
        const clsFieldAvgFn = (date: string, fields: string[]) => {
          const s = clsWeekly.filter(x => x.date === date && x.subScores);
          return Object.fromEntries(fields.map(f => [
            f, s.length ? Math.round(s.reduce((a, t) => a + (t.subScores?.[f] ?? 0), 0) / s.length) : 0,
          ]));
        };

        // 분야 목록 (주간 or 월간 중 가장 최근 것에서)
        const latestWithFields = [...clsWeekly, ...clsMonthly].filter(t=>t.fields?.length).sort((a,b)=>b.date.localeCompare(a.date))[0];
        const FIELDS = latestWithFields?.fields ?? [];
        const FIELD_MAX = latestWithFields ? Math.round((latestWithFields.maxScore ?? 100) / (FIELDS.length || 1)) : 20;
        const FIELD_COLORS = ['#6366F1','#3B82F6','#10B981','#F59E0B','#EF4444'];

        const SC = (v:number,max:number):React.CSSProperties => {
          const p=max>0?v/max*100:0;
          if(p>=90) return {backgroundColor:'#DCFCE7',color:'#15803D'};
          if(p>=75) return {backgroundColor:'#DBEAFE',color:'#1D4ED8'};
          if(p>=60) return {backgroundColor:'#FEF9C3',color:'#92400E'};
          return {backgroundColor:'#FEE2E2',color:'#DC2626'};
        };
        const attC:Record<string,React.CSSProperties> = {
          present:{backgroundColor:'#DCFCE7',color:'#15803D'}, absent:{backgroundColor:'#FEE2E2',color:'#DC2626'},
          late:{backgroundColor:'#FEF9C3',color:'#CA8A04'},    early_leave:{backgroundColor:'#FFEDD5',color:'#EA580C'},
        };
        const attLbl:Record<string,string> = { present:'출석', absent:'결석', late:'지각', early_leave:'조퇴' };
        const hwC:Record<string,React.CSSProperties> = {
          excellent:{backgroundColor:'#DBEAFE',color:'#1D4ED8'}, good:{backgroundColor:'#D1FAE5',color:'#065F46'},
          poor:{backgroundColor:'#FFEDD5',color:'#C2410C'},      not_submitted:{backgroundColor:'#F3F4F6',color:'#6B7280'},
        };
        // hwLbl reserved for future use

        const allChecked = students.length > 0 && students.every(s=>reportChecked[s.id]);

        const handleSendReport = async () => {
          if (!webhookUrl.trim()) { alert('웹훅 URL을 입력해주세요.'); return; }
          const targets = students.filter(s=>reportChecked[s.id]);
          if (!targets.length) { alert('발송할 학생을 선택해주세요.'); return; }
          setSendingReport(true);
          try {
            for (const stu of targets) {
              await fetch(webhookUrl, { method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                  student: stu.name, class: cls.name, period:`${rptMonthStart}~${rptMonthEnd}`, reportMonth,
                  weekly: weeklyDates.map(d=>{ const t=clsWeekly.find(x=>x.studentId===stu.id&&x.date===d); return {date:d,name:t?.testName,score:t?.score,subScores:t?.subScores}; }),
                  monthly: monthlyDates.map(d=>{ const t=clsMonthly.find(x=>x.studentId===stu.id&&x.date===d); return {date:d,name:t?.testName,score:t?.score,subScores:t?.subScores}; }),
                  comment: reportComments[stu.id]??'',
                }),
              });
            }
            alert(`${targets.length}명 성적표 발송 완료!`);
          } catch { alert('발송 중 오류가 발생했습니다.'); }
          finally { setSendingReport(false); }
        };

        return (
          <div className="space-y-4">
            {/* ── 컨트롤 패널 ── */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="rc-all" className="w-4 h-4 accent-indigo-600"
                    checked={allChecked}
                    onChange={e=>setReportChecked(Object.fromEntries(students.map(s=>[s.id,e.target.checked])))} />
                  <label htmlFor="rc-all" className="text-sm font-semibold text-gray-700 cursor-pointer">
                    전체 선택 ({students.filter(s=>reportChecked[s.id]).length}/{students.length}명)
                  </label>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 월 선택기 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500">📅 기준 월</span>
                    <input type="month"
                      className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold"
                      style={{ color: '#4F46E5' }}
                      value={reportMonth}
                      onChange={e => setReportMonth(e.target.value)} />
                  </div>
                  <button onClick={handleSendReport} disabled={sendingReport}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-50"
                    style={{background:'#059669',color:'#fff'}}>
                    {sendingReport ? '⏳ 발송 중...' : '📤 성적표 발송'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">웹훅 URL</span>
                <input className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                  placeholder="https://hooks.example.com/..."
                  value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} />
              </div>
              <div className="text-xs text-gray-400">
                데일리 {dailyDates.length}회 · 주간 {weeklyDates.length}회 · 월간(3개월) {monthlyDates.length}회 · 출석/과제 {reportMonth}
              </div>
            </div>

            {/* ── 학생별 성적표 (모바일 카드: max-w-sm 중앙정렬) ── */}
            <div className="flex flex-wrap gap-6 justify-center">
            {students.map((stu, si) => {
              const stuColor   = COLORS[si % COLORS.length];
              const stuDaily   = dailyDates.map(d=>({date:d, t:clsDailyAll.find(x=>x.studentId===stu.id&&x.date===d)}));
              const stuWeekly  = weeklyDates.map(d=>({date:d, t:clsWeekly.find(x=>x.studentId===stu.id&&x.date===d)}));
              const stuMonthly = monthlyDates.map(d=>({date:d, t:clsMonthly.find(x=>x.studentId===stu.id&&x.date===d)}));
              const stuAtt     = clsAtt.filter(a=>a.studentId===stu.id).sort((a,b)=>a.date.localeCompare(b.date));
              const stuHw      = clsHw.filter(h=>h.studentId===stu.id);
              const attCnt     = {present:stuAtt.filter(a=>a.status==='present').length, absent:stuAtt.filter(a=>a.status==='absent').length, late:stuAtt.filter(a=>a.status==='late').length, early_leave:stuAtt.filter(a=>a.status==='early_leave').length};
              const hwCnt      = {excellent:stuHw.filter(h=>h.result==='excellent').length, good:stuHw.filter(h=>h.result==='good').length, poor:stuHw.filter(h=>h.result==='poor').length, not_submitted:stuHw.filter(h=>h.result==='not_submitted').length};

              // 차트 데이터 (반 평균 포함)
              const dailyChartData = stuDaily.filter(x=>x.t).map(x=>({ name: x.date.slice(5), 점수: x.t!.score, 반평균: clsDailyAvgMap[x.date] ?? null }));
              const weeklyChartData = stuWeekly.filter(x=>x.t).map(x=>({ name: x.t!.testName.replace('주간테스트','').trim(), 점수: x.t!.score, 반평균: clsWeeklyAvgMap[x.date] ?? null }));
              const monthlyChartData = stuMonthly.filter(x=>x.t).map(x=>({ name: x.t!.testName.replace('월간평가','').trim(), 점수: x.t!.score, 반평균: clsMonthlyAvgMap[x.date] ?? null }));

              // 최신 주간 분야별 레이더 + 반 평균
              const latestWeekly = stuWeekly.filter(x=>x.t&&x.t.subScores&&x.t.fields).slice(-1)[0]?.t;
              const clsFieldAvgs = FIELDS.length && latestWeekly ? clsFieldAvgFn(latestWeekly.date, FIELDS) : {};
              const radarData = FIELDS.length && latestWeekly?.subScores
                ? FIELDS.map(f=>({ field:f, 점수: latestWeekly.subScores![f]??0, 반평균: clsFieldAvgs[f]??0, 만점: FIELD_MAX }))
                : [];

              // 월간 분야별 꺾은선 (최근 3개월)
              const monthlyFieldData = monthlyDates.map(d=>{
                const t = clsMonthly.find(x=>x.studentId===stu.id&&x.date===d);
                const row: Record<string,number|string> = { name: t?.testName?.replace('월간평가','').trim() ?? d.slice(0,7) };
                FIELDS.forEach(f=>{ row[f] = t?.subScores?.[f] ?? 0; });
                return row;
              });

              // 과제 도넛용 pie 데이터
              const hwPieData = [
                { name:'우수', value:hwCnt.excellent,  fill:'#6366F1' },
                { name:'보통', value:hwCnt.good,        fill:'#22C55E' },
                { name:'미흡', value:hwCnt.poor,        fill:'#F97316' },
                { name:'미제출',value:hwCnt.not_submitted,fill:'#9CA3AF'},
              ].filter(d=>d.value>0);

              // 출석 도넛
              const attPieData = [
                { name:'출석', value:attCnt.present,     fill:'#22C55E' },
                { name:'결석', value:attCnt.absent,      fill:'#EF4444' },
                { name:'지각', value:attCnt.late,        fill:'#EAB308' },
                { name:'조퇴', value:attCnt.early_leave, fill:'#F97316' },
              ].filter(d=>d.value>0);

              return (
                <div key={stu.id}
                  className="rounded-3xl overflow-hidden shadow-xl flex flex-col"
                  style={{
                    width: 390, minWidth: 320, maxWidth: 420,
                    border: reportChecked[stu.id] ? `3px solid ${stuColor}` : '3px solid #E2E8F0',
                    background: '#FAFBFF',
                  }}>

                  {/* ── 헤더 ── */}
                  <div className="px-5 pt-5 pb-4 relative" style={{ background: `linear-gradient(135deg, ${stuColor}ee, ${stuColor}99)` }}>
                    <div className="flex items-center gap-3 mb-1">
                      <input type="checkbox" className="w-5 h-5 accent-white rounded"
                        checked={!!reportChecked[stu.id]}
                        onChange={e=>setReportChecked(p=>({...p,[stu.id]:e.target.checked}))} />
                      <div>
                        <div className="text-white font-bold text-xl leading-tight">{stu.name}</div>
                        <div className="text-white/75 text-sm">{stu.grade} · {cls.name}</div>
                      </div>
                    </div>
                    <div className="text-white/60 text-xs mt-2">
                      재원기간 {stu.enrollDate} ~ {stu.withdrawDate ?? todayStr}
                      <span className="ml-2 opacity-70">({reportMonth.replace('-', '년 ')}월 기준)</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto" style={{maxHeight: 820}}>
                  <div className="p-4 space-y-5">

                    {/* ① 데일리 테스트 추이 — 꺾은선 */}
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
                        {/* 점수 칩 */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {stuDaily.map(({date,t})=>(
                            <div key={date} className="text-center">
                              <div className="text-[9px] text-gray-400">{date.slice(5)}</div>
                              <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg" style={t ? SC(t.score,t.maxScore):{backgroundColor:'#F3F4F6',color:'#9CA3AF'}}>
                                {t ? t.score : '—'}
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
                        {/* 총점 바차트 */}
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
                        {/* 분야별 점수 테이블 */}
                        {FIELDS.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr>
                                  <th className="text-left text-gray-400 font-medium pb-1 pr-2">영역</th>
                                  {stuWeekly.filter(x=>x.t).map(({t})=>(
                                    <th key={t!.date} className="text-center text-gray-400 font-medium pb-1 px-1">
                                      {t!.testName.replace('주간테스트','').trim()}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {FIELDS.map((f,fi)=>(
                                  <tr key={f}>
                                    <td className="pr-2 py-1 font-semibold" style={{color: FIELD_COLORS[fi%FIELD_COLORS.length]}}>{f}</td>
                                    {stuWeekly.filter(x=>x.t).map(({t})=>{
                                      const v = t!.subScores?.[f];
                                      return (
                                        <td key={t!.date} className="text-center py-1 px-1">
                                          {v != null
                                            ? <span className="font-bold px-1.5 py-0.5 rounded-md text-xs" style={SC(v,FIELD_MAX)}>{v}</span>
                                            : <span className="text-gray-300">—</span>}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                                <tr className="border-t border-gray-100">
                                  <td className="pr-2 py-1 font-bold text-gray-600">합계</td>
                                  {stuWeekly.filter(x=>x.t).map(({t})=>(
                                    <td key={t!.date} className="text-center py-1 px-1 font-bold" style={SC(t!.score,t!.maxScore)}>
                                      {t!.score}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {/* 최신 주간 레이더 */}
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
                        {/* 총점 추이 */}
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
                        {/* 분야별 꺾은선 (3개월) */}
                        {FIELDS.length > 0 && monthlyFieldData.length > 0 && (
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
                        {/* 분야별 점수 테이블 (월간) */}
                        {FIELDS.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr>
                                  <th className="text-left text-gray-400 font-medium pb-1 pr-2">영역</th>
                                  {stuMonthly.filter(x=>x.t).map(({t})=>(
                                    <th key={t!.date} className="text-center text-gray-400 font-medium pb-1 px-1">
                                      {t!.testName.replace('월간평가','').trim()}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {FIELDS.map((f,fi)=>(
                                  <tr key={f}>
                                    <td className="pr-2 py-1 font-semibold" style={{color:FIELD_COLORS[fi%FIELD_COLORS.length]}}>{f}</td>
                                    {stuMonthly.filter(x=>x.t).map(({t},mi)=>{
                                      const v = t!.subScores?.[f];
                                      const prev = mi>0 ? stuMonthly.filter(x=>x.t)[mi-1].t?.subScores?.[f] : null;
                                      const arrow = (prev!=null&&v!=null) ? (v>prev?'↑':v<prev?'↓':'') : '';
                                      const arrowColor = arrow==='↑'?'#16A34A':arrow==='↓'?'#DC2626':'#94A3B8';
                                      return (
                                        <td key={t!.date} className="text-center py-1 px-1">
                                          {v!=null
                                            ? <span className="font-bold">{v}<span className="text-[9px] ml-0.5" style={{color:arrowColor}}>{arrow}</span></span>
                                            : <span className="text-gray-300">—</span>}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                                <tr className="border-t border-gray-100">
                                  <td className="pr-2 py-1 font-bold text-gray-600">합계</td>
                                  {stuMonthly.filter(x=>x.t).map(({t},mi)=>{
                                    const prev = mi>0?stuMonthly.filter(x=>x.t)[mi-1].t?.score:null;
                                    const diff = (prev!=null)?t!.score-prev:null;
                                    return (
                                      <td key={t!.date} className="text-center py-1 px-1">
                                        <span className="font-bold px-1.5 py-0.5 rounded-md" style={SC(t!.score,t!.maxScore)}>{t!.score}</span>
                                        {diff!=null && <div className="text-[9px]" style={{color:diff>0?'#16A34A':diff<0?'#DC2626':'#94A3B8'}}>{diff>0?`+${diff}`:diff}</div>}
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

                    {/* ④ 출석 & 과제 — 도넛 2개 나란히 */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><span>📋</span> 출석 & 과제 현황</div>
                      <div className="flex gap-2">
                        {/* 출석 */}
                        <div className="flex-1 text-center">
                          <div className="text-[10px] text-gray-400 mb-1">✅ 출석 ({stuAtt.length}회)</div>
                          {attPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={120}>
                              <PieChart>
                                <Pie data={attPieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3}>
                                  {attPieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                                </Pie>
                                <Tooltip formatter={(v:unknown,n:unknown)=>[`${v as number}회`, String(n)]} contentStyle={{fontSize:10,borderRadius:8}} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <div className="h-[120px] flex items-center justify-center text-xs text-gray-300">기록 없음</div>}
                          <div className="flex flex-wrap justify-center gap-1 mt-1">
                            {attPieData.map(d=>(
                              <div key={d.name} className="flex items-center gap-0.5 text-[9px]">
                                <div className="w-2 h-2 rounded-full" style={{background:d.fill}}/>
                                <span>{d.name} {d.value}</span>
                              </div>
                            ))}
                          </div>
                          {/* 출석 미니 달력 */}
                          {stuAtt.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2 justify-center">
                              {stuAtt.map(a=>(
                                <div key={a.date} className="flex flex-col items-center">
                                  <div className="text-[8px] text-gray-400">{a.date.slice(5)}</div>
                                  <div className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center" style={attC[a.status]}>
                                    {a.status==='present'?'✓':a.status==='absent'?'✗':attLbl[a.status][0]}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* 과제 */}
                        <div className="flex-1 text-center">
                          <div className="text-[10px] text-gray-400 mb-1">📋 과제 ({stuHw.length}회)</div>
                          {hwPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={120}>
                              <PieChart>
                                <Pie data={hwPieData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={50} paddingAngle={3}>
                                  {hwPieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                                </Pie>
                                <Tooltip formatter={(v:unknown,n:unknown)=>[`${v as number}회`, String(n)]} contentStyle={{fontSize:10,borderRadius:8}} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : <div className="h-[120px] flex items-center justify-center text-xs text-gray-300">기록 없음</div>}
                          <div className="flex flex-wrap justify-center gap-1 mt-1">
                            {hwPieData.map(d=>(
                              <div key={d.name} className="flex items-center gap-0.5 text-[9px]">
                                <div className="w-2 h-2 rounded-full" style={{background:d.fill}}/>
                                <span className="px-1 py-0.5 rounded text-[9px]" style={hwC[d.name==='우수'?'excellent':d.name==='보통'?'good':d.name==='미흡'?'poor':'not_submitted']}>{d.name} {d.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ⑤ 선생님 총평 */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><span>✍️</span> 선생님 총평</div>
                      <textarea rows={4}
                        className="w-full px-3 py-2 rounded-xl text-sm resize-none border focus:outline-none"
                        style={{borderColor:'#E2E8F0', background:'#F8FAFC'}}
                        placeholder="학생에 대한 총평을 입력하세요..."
                        value={reportComments[stu.id]??''}
                        onChange={e=>setReportComments(p=>({...p,[stu.id]:e.target.value}))}
                      />
                    </div>

                  </div>
                  </div>
                </div>
              );
            })}
            </div>

            {!reportGenerated && (
              <div className="card p-8 text-center text-gray-400">
                <div className="text-4xl mb-3">📜</div>
                <p className="font-medium">주간/월간시험 탭에서 <strong>성적표 생성</strong> 버튼을 눌러주세요.</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── TAB: 현황그래프 ── */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          {radarData.some(r => r.axes.some(a => a.value > 0)) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">학생별 종합 역량 (방사형)</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([['month', `${currentMonth.slice(5)}월`], ['3m', '최근 3개월']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => handleRadarPreset(val)}
                      className="text-xs px-2 py-0.5 rounded-lg font-semibold transition-all"
                      style={!radarDateStart && !radarDateEnd && radarPeriod === val
                        ? { background: '#6366F1', color: '#fff' }
                        : { background: '#F1F5F9', color: '#64748B' }}>
                      {label}
                    </button>
                  ))}
                  <span className="text-gray-300 text-xs">|</span>
                  <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs"
                    value={radarDateStart} onChange={e => setRadarDateStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs"
                    value={radarDateEnd} onChange={e => setRadarDateEnd(e.target.value)} />
                  {(radarDateStart || radarDateEnd) && (
                    <button onClick={() => { setRadarDateStart(''); setRadarDateEnd(''); }}
                      className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">초기화</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">시험: 기간 내 최근 점수 · 과제: 기간 평균 · 출석률: 기간 비율 (100점 환산)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {radarData.map(student => (
                  <div key={student.name}>
                    <div className="text-xs font-bold text-center mb-1" style={{ color: student.color }}>{student.name}</div>
                    <ResponsiveContainer width="100%" height={170}>
                      <RadarChart data={student.axes}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: '#64748B' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="value" fill={student.color} fillOpacity={0.25} stroke={student.color} strokeWidth={2} />
                        <Tooltip formatter={(v) => `${v}점`} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dbHomework.some(r => r.classId === classId) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">과제 수행 전체 분포 (도넛형)</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[['1달', 1], ['3달', 3]] .map(([label, months]) => (
                    <button key={label as string} onClick={() => setHwPiePeriod(months as number)}
                      className="px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">{label}</button>
                  ))}
                  <span className="text-gray-300 text-xs">|</span>
                  <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs"
                    value={hwPieStart} onChange={e => setHwPieStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs"
                    value={hwPieEnd} onChange={e => setHwPieEnd(e.target.value)} />
                  {(hwPieStart || hwPieEnd) && (
                    <button onClick={() => { setHwPieStart(''); setHwPieEnd(''); }}
                      className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">{hwPieStart || hwPieEnd ? `${hwPieStart || '시작'}~${hwPieEnd || '현재'} 과제 수행 결과 분포` : '전 기간 누적 과제 수행 결과 분포'}</p>
              {hwPieData.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={170}>
                    <PieChart>
                      <Pie data={hwPieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {hwPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}건`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {hwPieData.map(d => {
                      const total = hwPieData.reduce((s, x) => s + x.value, 0);
                      return (
                        <div key={d.name} className="flex items-center gap-2 text-sm">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-gray-600 text-xs">{d.name}</span>
                          <span className="font-bold text-gray-800 text-xs">{d.value}건</span>
                          <span className="text-gray-400 text-xs">({Math.round(d.value / total * 100)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">선택 기간의 과제 데이터가 없습니다</p>
              )}
            </div>
          )}

          {/* 데일리테스트 성적 추이 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <h3 className="font-semibold text-gray-800">데일리테스트 성적 추이</h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button onClick={() => setChartPeriod(1)}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">1달</button>
                <button onClick={() => setChartPeriod(3)}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">3달</button>
                <span className="text-gray-300">|</span>
                <input type="date" className="px-2 py-1 border border-gray-200 rounded text-xs"
                  value={chartDailyStart} onChange={e => setChartDailyStart(e.target.value)} />
                <span className="text-xs text-gray-400">~</span>
                <input type="date" className="px-2 py-1 border border-gray-200 rounded text-xs"
                  value={chartDailyEnd} onChange={e => setChartDailyEnd(e.target.value)} />
                {(chartDailyStart || chartDailyEnd) && (
                  <button onClick={() => { setChartDailyStart(''); setChartDailyEnd(''); }}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-500 text-xs">초기화</button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2">50~100% 구간 표시 · 점선 = 반평균 · 이름 클릭으로 개인 표시/숨김</p>
            <div className="flex gap-1 flex-wrap mb-2">
              {students.map((s, i) => (
                <button key={s.id}
                  onClick={() => toggleStudent(setChartDailyStudents, s.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    chartDailyStudents.length === 0 || chartDailyStudents.includes(s.id)
                      ? 'text-white border-transparent'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                  style={chartDailyStudents.length === 0 || chartDailyStudents.includes(s.id)
                    ? { background: COLORS[i % COLORS.length] } : {}}>
                  {s.name}
                </button>
              ))}
              {chartDailyStudents.length > 0 && (
                <button onClick={() => setChartDailyStudents([])}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">전체</button>
              )}
            </div>
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyChartData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<LineChartTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  {students.filter(s => visibleDailyStudents.includes(s.id)).map((s, i) => (
                    <Line key={s.id} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                  <Line type="monotone" dataKey="반평균" stroke="#1E293B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">데이터가 없습니다</p>
            )}
          </div>

          {/* 주간시험 성적 추이 | 월간시험 성적 추이 — 2열 나란히 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 주간시험 성적 추이 */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <h3 className="font-semibold text-gray-800 text-sm">주간시험 성적 추이</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  <button onClick={() => { const e=new Date(); const s=new Date(); s.setMonth(s.getMonth()-1); setChartWeeklyStart(fmtDate(s)); setChartWeeklyEnd(fmtDate(e)); }}
                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">1달</button>
                  <button onClick={() => { const e=new Date(); const s=new Date(); s.setMonth(s.getMonth()-3); setChartWeeklyStart(fmtDate(s)); setChartWeeklyEnd(fmtDate(e)); }}
                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">3달</button>
                  <span className="text-gray-300 text-xs">|</span>
                  <input type="date" className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-28"
                    value={chartWeeklyStart} onChange={e => setChartWeeklyStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-28"
                    value={chartWeeklyEnd} onChange={e => setChartWeeklyEnd(e.target.value)} />
                  {(chartWeeklyStart || chartWeeklyEnd) && (
                    <button onClick={() => { setChartWeeklyStart(''); setChartWeeklyEnd(''); }}
                      className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">✕</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-1.5">50~100% 구간 · 점선=반평균 · 이름 클릭=개인필터</p>
              <div className="flex gap-1 flex-wrap mb-1.5">
                {students.map((s, i) => (
                  <button key={s.id}
                    onClick={() => toggleStudent(setChartWeeklyStudents, s.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      chartWeeklyStudents.length === 0 || chartWeeklyStudents.includes(s.id)
                        ? 'text-white border-transparent'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                    style={chartWeeklyStudents.length === 0 || chartWeeklyStudents.includes(s.id)
                      ? { background: COLORS[i % COLORS.length] } : {}}>
                    {s.name}
                  </button>
                ))}
                {chartWeeklyStudents.length > 0 && (
                  <button onClick={() => setChartWeeklyStudents([])}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">전체</button>
                )}
              </div>
              {weeklyOnlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyOnlyData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<LineChartTooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    {students.filter(s => visibleWeeklyStudents.includes(s.id)).map((s, i) => (
                      <Line key={s.id} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
                    ))}
                    <Line type="monotone" dataKey="반평균" stroke="#1E293B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">주간 시험 데이터가 없습니다</p>
              )}
            </div>

            {/* 월간시험 성적 추이 */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <h3 className="font-semibold text-gray-800 text-sm">월간시험 성적 추이</h3>
                <div className="flex items-center gap-1 flex-wrap">
                  <button onClick={() => { const e=new Date(); const s=new Date(); s.setMonth(s.getMonth()-3); setChartMonthlyStart(fmtDate(s)); setChartMonthlyEnd(fmtDate(e)); }}
                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">3달</button>
                  <button onClick={() => { const e=new Date(); const s=new Date(); s.setMonth(s.getMonth()-6); setChartMonthlyStart(fmtDate(s)); setChartMonthlyEnd(fmtDate(e)); }}
                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">6달</button>
                  <span className="text-gray-300 text-xs">|</span>
                  <input type="date" className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-28"
                    value={chartMonthlyStart} onChange={e => setChartMonthlyStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-28"
                    value={chartMonthlyEnd} onChange={e => setChartMonthlyEnd(e.target.value)} />
                  {(chartMonthlyStart || chartMonthlyEnd) && (
                    <button onClick={() => { setChartMonthlyStart(''); setChartMonthlyEnd(''); }}
                      className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">✕</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-1.5">50~100% 구간 · 점선=반평균 · 이름 클릭=개인필터</p>
              <div className="flex gap-1 flex-wrap mb-1.5">
                {students.map((s, i) => (
                  <button key={s.id}
                    onClick={() => toggleStudent(setChartMonthlyStudents, s.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                      chartMonthlyStudents.length === 0 || chartMonthlyStudents.includes(s.id)
                        ? 'text-white border-transparent'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                    style={chartMonthlyStudents.length === 0 || chartMonthlyStudents.includes(s.id)
                      ? { background: COLORS[i % COLORS.length] } : {}}>
                    {s.name}
                  </button>
                ))}
                {chartMonthlyStudents.length > 0 && (
                  <button onClick={() => setChartMonthlyStudents([])}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">전체</button>
                )}
              </div>
              {monthlyOnlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={monthlyOnlyData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<LineChartTooltip />} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                    {students.filter(s => visibleMonthlyStudents.includes(s.id)).map((s, i) => (
                      <Line key={s.id} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 2 }} />
                    ))}
                    <Line type="monotone" dataKey="반평균" stroke="#1E293B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">월간 시험 데이터가 없습니다</p>
              )}
            </div>
          </div>

          {/* ── 분야별 성취도 + 학생점수 비교 (주간/월간 분리, 각각 2열) ── */}
          {(['weekly', 'monthly'] as const).map(examType => {
            const typeLabel = examType === 'weekly' ? '주간' : '월간';
            const fStart = examType === 'weekly' ? fieldWeeklyStart : fieldMonthlyStart;
            const fEnd   = examType === 'weekly' ? fieldWeeklyEnd   : fieldMonthlyEnd;
            const setFStart = examType === 'weekly' ? setFieldWeeklyStart : setFieldMonthlyStart;
            const setFEnd   = examType === 'weekly' ? setFieldWeeklyEnd   : setFieldMonthlyEnd;
            const compStudents    = examType === 'weekly' ? fieldWeeklyCompStudents  : fieldMonthlyCompStudents;
            const setCompStudents = examType === 'weekly' ? setFieldWeeklyCompStudents : setFieldMonthlyCompStudents;
            const visibleComp     = compStudents.length > 0 ? compStudents : students.map(s => s.id);

            // 해당 타입·기간의 시험 (분야 있는 것만)
            const typeExams = dbTestScores.filter(t =>
              t.classId === classId && t.type === examType &&
              Array.isArray(t.fields) && (t.fields as string[]).length > 0 &&
              (!fStart || t.date >= fStart) && (!fEnd || t.date <= fEnd)
            );
            if (typeExams.length === 0) return null;

            // 분야 목록 (해당 타입만)
            const typeFields = [...new Set(typeExams.flatMap(t => (t.fields as string[]) ?? []))];

            // 학생별 기간 내 분야 평균 (레이더)
            const studentFieldAvg = students.map((s, si) => {
              const studentExams = typeExams.filter(t => t.studentId === s.id);
              if (studentExams.length === 0) return null;
              const axes = typeFields.map(f => {
                const vals = studentExams
                  .filter(t => (t.subScores as Record<string,number>)?.[f] != null)
                  .map(t => {
                    const pm = t.maxScore / ((t.fields as string[]).length || 1);
                    return Math.round((t.subScores as Record<string,number>)[f] / pm * 100);
                  });
                return { axis: f, value: vals.length > 0 ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0 };
              });
              return { name: s.name, color: COLORS[si % COLORS.length], axes };
            }).filter(Boolean) as { name: string; color: string; axes: { axis: string; value: number }[] }[];

            // 분야별 반 평균 (툴팁용)
            const fieldClassAvg: Record<string, number> = {};
            typeFields.forEach(f => {
              const allVals = typeExams
                .filter(t => (t.subScores as Record<string,number>)?.[f] != null)
                .map(t => {
                  const pm = t.maxScore / ((t.fields as string[]).length || 1);
                  return Math.round((t.subScores as Record<string,number>)[f] / pm * 100);
                });
              fieldClassAvg[f] = allVals.length > 0 ? Math.round(allVals.reduce((a,b)=>a+b,0)/allVals.length) : 0;
            });

            // 분야별 학생점수 비교 데이터 (기간 평균)
            const fieldBarData = typeFields.map(f => {
              const row: Record<string, string | number> = { field: f };
              students.forEach(s => {
                const sExams = typeExams.filter(t => t.studentId === s.id && (t.subScores as Record<string,number>)?.[f] != null);
                if (sExams.length > 0) {
                  const avg = sExams.map(t => {
                    const pm = t.maxScore / ((t.fields as string[]).length || 1);
                    return Math.round((t.subScores as Record<string,number>)[f] / pm * 100);
                  });
                  row[s.name] = Math.round(avg.reduce((a,b)=>a+b,0)/avg.length);
                } else {
                  row[s.name] = 0;
                }
              });
              const allStudentScores = students.flatMap(s => {
                const sExams = typeExams.filter(t => t.studentId === s.id && (t.subScores as Record<string,number>)?.[f] != null);
                return sExams.map(t => {
                  const pm = t.maxScore / ((t.fields as string[]).length || 1);
                  return Math.round((t.subScores as Record<string,number>)[f] / pm * 100);
                });
              });
              row['반평균'] = allStudentScores.length > 0 ? Math.round(allStudentScores.reduce((a,b)=>a+b,0)/allStudentScores.length) : 0;
              return row;
            });

            const periodBtns = examType === 'weekly'
              ? [[1,'1달'],[3,'3달']] as [number,string][]
              : [[3,'3달'],[6,'6달']] as [number,string][];

            // 공통 기간 컨트롤 UI
            const PeriodCtrl = () => (
              <div className="flex items-center gap-1 flex-wrap">
                {periodBtns.map(([months, label]) => (
                  <button key={label} onClick={() => setFieldPeriod(examType, months)}
                    className="px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">{label}</button>
                ))}
                <span className="text-gray-300 text-xs">|</span>
                <input type="date" className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-28"
                  value={fStart} onChange={e => setFStart(e.target.value)} />
                <span className="text-xs text-gray-400">~</span>
                <input type="date" className="px-1.5 py-0.5 border border-gray-200 rounded text-xs w-28"
                  value={fEnd} onChange={e => setFEnd(e.target.value)} />
                {(fStart || fEnd) && (
                  <button onClick={() => { setFStart(''); setFEnd(''); }}
                    className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">✕</button>
                )}
              </div>
            );

            return (
              /* 성취도(60%) | 학생점수비교(40%) 비율 레이아웃 */
              <div key={examType} className="flex gap-4">
                {/* 분야별 성취도 (기간 평균 방사형) — 넓게 */}
                <div className="card p-4" style={{ flex: '3' }}>
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{typeLabel}시험 분야별 성취도</h3>
                    <PeriodCtrl />
                  </div>
                  <p className="text-xs text-gray-400 mb-3">기간 내 분야별 평균 · 오버 시 반평균 비교</p>
                  {studentFieldAvg.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {studentFieldAvg.map(student => (
                        <div key={student.name}>
                          <div className="text-xs font-bold text-center mb-1" style={{ color: student.color }}>{student.name}</div>
                          <ResponsiveContainer width="100%" height={150}>
                            <RadarChart data={student.axes}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 8, fill: '#64748B' }} />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar dataKey="value" fill={student.color} fillOpacity={0.25} stroke={student.color} strokeWidth={2} />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (!active || !payload?.[0]) return null;
                                  const { axis, value } = payload[0].payload as { axis: string; value: number };
                                  const avg = fieldClassAvg[axis] ?? 0;
                                  return (
                                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                                      <p style={{ fontWeight: 700, color: '#374151', marginBottom: 3 }}>{axis}</p>
                                      <p style={{ color: student.color }}>평균: <strong>{value}점</strong></p>
                                      <p style={{ color: '#94A3B8' }}>반평균: <strong>{avg}점</strong></p>
                                    </div>
                                  );
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">선택 기간의 분야별 시험 데이터가 없습니다</p>
                  )}
                </div>

                {/* 분야별 학생점수 비교 (기간 평균) */}
                <div className="card p-4" style={{ flex: '2' }}>
                  <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{typeLabel}시험 분야별 학생점수 비교</h3>
                    <PeriodCtrl />
                  </div>
                  {/* 좌상단 학생 선택 필터 */}
                  <div className="flex gap-1 flex-wrap mb-1.5">
                    {students.map((s, i) => (
                      <button key={s.id}
                        onClick={() => toggleStudent(setCompStudents, s.id)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                          compStudents.length === 0 || compStudents.includes(s.id)
                            ? 'text-white border-transparent'
                            : 'bg-gray-100 text-gray-400 border-gray-200'
                        }`}
                        style={compStudents.length === 0 || compStudents.includes(s.id)
                          ? { background: COLORS[i % COLORS.length] } : {}}>
                        {s.name}
                      </button>
                    ))}
                    {compStudents.length > 0 && (
                      <button onClick={() => setCompStudents([])}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">전체</button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-1">기간 내 분야별 평균 · 점선=반평균</p>
                  {fieldBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={fieldBarData} margin={{ left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="field" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}점`} />
                        <Tooltip formatter={(v) => `${v}점`} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                        {students.filter(s => visibleComp.includes(s.id)).map((s, i) => (
                          <Line key={s.id} type="monotone" dataKey={s.name}
                            stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                            dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        ))}
                        <Line type="monotone" dataKey="반평균" stroke="#1E293B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-6">선택 기간의 분야별 시험 데이터가 없습니다</p>
                  )}
                </div>
              </div>
            );
          })}

          {dbHomework.some(r => r.classId === classId) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">과제 제출 일별 현황</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => setHwChartPeriod(1)}
                    className="px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">1달</button>
                  <button onClick={() => setHwChartPeriod(3)}
                    className="px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600">3달</button>
                  <span className="text-gray-300 text-xs">|</span>
                  <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs"
                    value={hwChartStart} onChange={e => setHwChartStart(e.target.value)} />
                  <span className="text-xs text-gray-400">~</span>
                  <input type="date" className="px-2 py-0.5 border border-gray-200 rounded text-xs"
                    value={hwChartEnd} onChange={e => setHwChartEnd(e.target.value)} />
                  {(hwChartStart || hwChartEnd) && (
                    <button onClick={() => { setHwChartStart(''); setHwChartEnd(''); }}
                      className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs">초기화</button>
                  )}
                </div>
              </div>
              {hwChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hwChartData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const ORDER = [
                        { key: 'excellent',     name: '우수',   color: '#3b82f6' },
                        { key: 'good',          name: '보통',   color: '#10b981' },
                        { key: 'poor',          name: '미흡',   color: '#f97316' },
                        { key: 'not_submitted', name: '미제출', color: '#9ca3af' },
                      ];
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2" style={{ fontSize: 11 }}>
                          <p className="font-bold text-gray-700 mb-1">{label}</p>
                          {ORDER.map(({ key, name, color }) => {
                            const item = payload.find(p => p.dataKey === key);
                            return <p key={key} style={{ color }}>{name} : {item?.value ?? 0}</p>;
                          })}
                        </div>
                      );
                    }}
                  />
                  <Legend
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    content={() => (
                      <div className="flex justify-center gap-4 mt-1">
                        {[
                          { name: '우수',   color: '#3b82f6' },
                          { name: '보통',   color: '#10b981' },
                          { name: '미흡',   color: '#f97316' },
                          { name: '미제출', color: '#9ca3af' },
                        ].map(({ name, color }) => (
                          <div key={name} className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                            <span style={{ fontSize: 11, color: '#6B7280' }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  <Bar dataKey="not_submitted" name="미제출" stackId="hw" fill="#9ca3af" />
                  <Bar dataKey="poor"          name="미흡"   stackId="hw" fill="#f97316" />
                  <Bar dataKey="good"          name="보통"   stackId="hw" fill="#10b981" />
                  <Bar dataKey="excellent"     name="우수"   stackId="hw" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">선택 기간의 과제 데이터가 없습니다</p>
              )}
            </div>
          )}

          {dailyChartData.length === 0 && weeklyExamData.length === 0 && hwPieData.length === 0 && (
            <div className="card p-10 text-center text-gray-400 text-sm">아직 그래프를 그릴 데이터가 없습니다.</div>
          )}
        </div>
      )}

      {/* ── 지각/조퇴 확인 모달 ── */}
      {attConfirm && (() => {
        const isLate   = attConfirm.status === 'late';
        const label    = isLate ? '지각' : '조퇴';
        const icon     = isLate ? '⏰' : '🚪';
        const accentBg = isLate ? '#FEFCE8' : '#FFF7ED';
        const accentBd = isLate ? '#FDE68A' : '#FDBA74';
        const accentTx = isLate ? '#92400E' : '#9A3412';
        return (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
            onClick={e => { if (e.target === e.currentTarget) setAttConfirm(null); }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-80 mx-4 overflow-hidden">
              {/* 상단 컬러 헤더 */}
              <div className="px-6 pt-6 pb-4 text-center" style={{ background: accentBg, borderBottom: `1px solid ${accentBd}` }}>
                <div className="text-4xl mb-2">{icon}</div>
                <h3 className="text-base font-bold" style={{ color: accentTx }}>{label} 처리 및 알림 발송</h3>
              </div>
              {/* 본문 */}
              <div className="px-6 py-5 text-center">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-gray-900">{attConfirm.studentName}</span> 학생을{' '}
                  <span className="font-semibold" style={{ color: accentTx }}>'{label}'</span> 처리하고<br />
                  학부모에게 알림을 발송하시겠습니까?
                </p>
                {!webhookUrl.trim() && (
                  <p className="mt-2 text-[11px] text-orange-500 bg-orange-50 rounded-lg px-3 py-1.5">
                    ⚠ 웹훅 URL이 설정되지 않아 알림은 발송되지 않습니다.
                  </p>
                )}
              </div>
              {/* 버튼 */}
              <div className="flex border-t border-gray-100">
                <button
                  className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                  onClick={() => setAttConfirm(null)}
                >
                  취소
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  className="flex-1 py-3 text-sm font-semibold transition-colors"
                  style={{ color: accentTx }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = accentBg}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                  onClick={handleAttConfirm}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 학생 상세 모달 ── */}
      {selectedStudentId && (() => {
        const stu = dbStudents.find(s => s.id === selectedStudentId);
        if (!stu) return null;
        const stuIdx = students.findIndex(s => s.id === selectedStudentId);
        const stuColor = COLORS[stuIdx >= 0 ? stuIdx % COLORS.length : 0];

        // 수강반 목록
        const stuClasses = dbClasses.filter(c => (c.studentIds as string[]).includes(selectedStudentId));

        // 재원 기간
        const enrollDuration = (() => {
          const start = new Date(stu.enrollDate);
          const now = new Date();
          const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
          return months >= 1 ? `${months}개월` : '1개월 미만';
        })();

        // 출결: 월별 집계
        const stuAtt = dbAttendance.filter(a => a.studentId === selectedStudentId);
        const attMonthKeys = [...new Set(stuAtt.map(a => a.date.slice(0, 7)))].sort();
        const attMonthData = attMonthKeys.map(m => {
          const records = stuAtt.filter(a => a.date.startsWith(m));
          return {
            month: m.slice(5),
            출석: records.filter(a => a.status === 'present').length,
            결석: records.filter(a => a.status === 'absent').length,
            지각: records.filter(a => a.status === 'late').length,
            조퇴: records.filter(a => a.status === 'early_leave').length,
          };
        });
        const totalAtt   = stuAtt.length;
        const presentCnt = stuAtt.filter(a => a.status === 'present').length;
        const attRate    = totalAtt > 0 ? Math.round(presentCnt / totalAtt * 100) : 0;

        // 최근 진도 기록 (현재 반 기준, 최근 5개)
        const stuProgress = dbProgress
          .filter(p => p.classId === classId)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5);

        // 관찰 기록 (현재 반 + 이 학생, 최근 5개)
        const stuObs = dbObservations
          .filter(o => o.classId === classId && o.studentId === selectedStudentId)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5);

        // 과제
        const stuHw = dbHomework.filter(r => r.studentId === selectedStudentId).sort((a, b) => b.date.localeCompare(a.date));
        const hwCounts = { excellent: 0, good: 0, poor: 0, not_submitted: 0 };
        stuHw.forEach(r => { hwCounts[r.result as keyof typeof hwCounts]++; });
        const hwTotal        = stuHw.length;
        const hwSubmittedCnt = hwTotal - hwCounts.not_submitted;
        const hwRate         = hwTotal > 0 ? Math.round(hwSubmittedCnt / hwTotal * 100) : 0;

        // 데일리테스트
        const dailyTests = dbTestScores
          .filter(t => t.studentId === selectedStudentId && t.type === 'daily')
          .sort((a, b) => a.date.localeCompare(b.date));
        const dailyLineData = dailyTests.map(t => ({ date: t.date.slice(5), 점수: Math.round(t.score / t.maxScore * 100) }));
        const avgDaily = dailyTests.length > 0
          ? Math.round(dailyTests.reduce((sum, t) => sum + t.score / t.maxScore * 100, 0) / dailyTests.length) : null;

        // 주간/월간시험
        const examTests = dbTestScores
          .filter(t => t.studentId === selectedStudentId && (t.type === 'weekly' || t.type === 'monthly'))
          .sort((a, b) => a.date.localeCompare(b.date));
        const examLineData = examTests.map(t => ({ date: t.date.slice(5), 점수: Math.round(t.score / t.maxScore * 100) }));
        const avgExam = examTests.length > 0
          ? Math.round(examTests.reduce((sum, t) => sum + t.score / t.maxScore * 100, 0) / examTests.length) : null;

        // 분야별 레이더 (최근 시험)
        const examWithFields = examTests.filter(t => Array.isArray(t.fields) && (t.fields as string[]).length > 0);
        const latestFieldExam = examWithFields.length > 0 ? examWithFields[examWithFields.length - 1] : null;
        const fieldRadarData = latestFieldExam
          ? (latestFieldExam.fields as string[]).map(f => ({
              axis: f,
              value: (latestFieldExam.subScores as Record<string,number>)?.[f] != null
                ? Math.round((latestFieldExam.subScores as Record<string,number>)[f] /
                    (latestFieldExam.maxScore / (latestFieldExam.fields as string[]).length) * 100)
                : 0,
            }))
          : [];

        // AI 인사이트
        const insights: string[] = [];
        if (attRate >= 95) insights.push(`출석률이 ${attRate}%로 매우 우수합니다.`);
        else if (attRate >= 80) insights.push(`출석률 ${attRate}% — 꾸준한 참석을 권장합니다.`);
        else if (totalAtt > 0) insights.push(`출석률이 ${attRate}%로 낮습니다. 원인 파악 및 상담이 필요합니다.`);

        if (hwRate >= 90) insights.push(`과제 제출률 ${hwRate}% — 성실하게 참여하고 있습니다.`);
        else if (hwRate >= 70) insights.push(`과제 제출률 ${hwRate}% — 미제출 ${hwCounts.not_submitted}건, 제출 습관 개선이 필요합니다.`);
        else if (hwTotal > 0) insights.push(`과제 제출률이 ${hwRate}%로 저조합니다. 적극적인 지도가 필요합니다.`);

        if (avgDaily != null) {
          if (avgDaily >= 90) insights.push(`데일리테스트 평균 ${avgDaily}점 — 학습 이해도가 높습니다.`);
          else if (avgDaily >= 75) insights.push(`데일리테스트 평균 ${avgDaily}점 — 양호한 수준입니다.`);
          else insights.push(`데일리테스트 평균 ${avgDaily}점 — 기초 개념 보강이 필요합니다.`);
        }

        if (avgExam != null && examTests.length >= 4) {
          const half     = Math.floor(examTests.length / 2);
          const firstAvg = examTests.slice(0, half).reduce((sum, t) => sum + t.score / t.maxScore * 100, 0) / half;
          const lastAvg  = examTests.slice(half).reduce((sum, t) => sum + t.score / t.maxScore * 100, 0) / (examTests.length - half);
          if (lastAvg > firstAvg + 5)
            insights.push(`주간/월간시험 성적이 상승 추세입니다 (${firstAvg.toFixed(0)}% → ${lastAvg.toFixed(0)}%).`);
          else if (lastAvg < firstAvg - 5)
            insights.push(`주간/월간시험 성적이 하락 추세입니다 (${firstAvg.toFixed(0)}% → ${lastAvg.toFixed(0)}%). 집중 관리가 필요합니다.`);
          else
            insights.push(`주간/월간시험 성적이 ${avgExam}% 수준으로 유지되고 있습니다.`);
        }

        const weakField = fieldRadarData.length > 0 ? [...fieldRadarData].sort((a, b) => a.value - b.value)[0] : null;
        if (weakField && weakField.value < 70)
          insights.push(`약점 분야: '${weakField.axis}' (${weakField.value}점) — 집중 보완 학습을 권장합니다.`);

        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4"
            onClick={e => { if (e.target === e.currentTarget) setSelectedStudentId(null); }}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              {/* 헤더 */}
              <div className="flex items-center gap-3 p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: stuColor }}>{stu.name[0]}</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{stu.name}</h2>
                  <p className="text-xs text-gray-400">{stu.school} · {stu.grade}</p>
                </div>
                <button onClick={() => setSelectedStudentId(null)}
                  className="ml-auto p-2 hover:bg-gray-100 rounded-lg text-gray-400 text-xl leading-none">×</button>
              </div>

              <div className="p-5 space-y-6">
                {/* 1. 기본정보 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">👤 기본정보</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '학교',       value: stu.school },
                      { label: '학년',       value: stu.grade },
                      { label: '학생 연락처', value: stu.studentPhone ?? '-' },
                      { label: '부모 연락처', value: stu.parentPhone },
                      { label: '등록일',     value: stu.enrollDate },
                      { label: '재원기간',   value: enrollDuration },
                    ].map(item => (
                      <div key={item.label} className="bg-gray-50 rounded-xl px-3 py-2">
                        <div className="text-[10px] text-gray-400">{item.label}</div>
                        <div className="text-sm font-semibold text-gray-800 truncate">{item.value}</div>
                      </div>
                    ))}
                    {/* 수강반 — 반이름 + 선생님 이름 */}
                    <div className="col-span-2 bg-gray-50 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-gray-400">수강반</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                        {stuClasses.length > 0 ? stuClasses.map(c => {
                          const t = dbUsers.find(u => u.id === c.teacherId);
                          return (
                            <span key={c.id} className="text-sm font-semibold text-gray-800">
                              {c.name}{t ? ` · ${t.name} 선생님` : ''}
                            </span>
                          );
                        }) : <span className="text-sm font-semibold text-gray-800">-</span>}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. 출결정보 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    📅 출결정보
                    {totalAtt > 0 && <span className="text-xs text-gray-400 font-normal">출석률 {attRate}%</span>}
                  </h3>
                  {attMonthData.length > 0 ? (
                    <>
                      {/* 커스텀 범례 — 중앙 정렬, recharts Legend 미사용(역순 버그 회피) */}
                      <div className="flex gap-3 items-center mb-1.5 flex-wrap justify-center">
                        {[
                          { label: '출석', color: '#22c55e' },
                          { label: '결석', color: '#ef4444' },
                          { label: '지각', color: '#eab308' },
                          { label: '조퇴', color: '#f97316' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                            <span className="text-[10px] text-gray-500">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      <ResponsiveContainer width="100%" height={165}>
                        <BarChart data={attMonthData} margin={{ left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                          {/* 커스텀 툴팁 — 출석·결석·지각·조퇴 고정 순서 */}
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload || payload.length === 0) return null;
                              const ORDER = ['출석', '결석', '지각', '조퇴'] as const;
                              const COLOR: Record<string, string> = { 출석: '#22c55e', 결석: '#ef4444', 지각: '#eab308', 조퇴: '#f97316' };
                              return (
                                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2" style={{ fontSize: 11 }}>
                                  <p className="font-bold text-gray-700 mb-1">{label}</p>
                                  {ORDER.map(key => {
                                    const item = payload.find(p => p.dataKey === key);
                                    return (
                                      <p key={key} style={{ color: COLOR[key] }}>{key} : {item?.value ?? 0}</p>
                                    );
                                  })}
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="출석" stackId="a" fill="#22c55e" />
                          <Bar dataKey="결석" stackId="a" fill="#ef4444" />
                          <Bar dataKey="지각" stackId="a" fill="#eab308" />
                          <Bar dataKey="조퇴" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">출결 데이터 없음</p>
                  )}
                </section>

                {/* 3. 과제정보 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    📋 과제정보
                    {hwTotal > 0 && <span className="text-xs text-gray-400 font-normal">제출률 {hwRate}%</span>}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { label: '우수',   count: hwCounts.excellent,     color: '#3b82f6' },
                      { label: '보통',   count: hwCounts.good,          color: '#10b981' },
                      { label: '미흡',   count: hwCounts.poor,          color: '#f97316' },
                      { label: '미제출', count: hwCounts.not_submitted,  color: '#9ca3af' },
                    ] as { label: string; count: number; color: string }[]).map(item => (
                      <div key={item.label} className="rounded-xl p-3 text-center"
                        style={{ background: `${item.color}18`, border: `1px solid ${item.color}30` }}>
                        <div className="text-xl font-bold" style={{ color: item.color }}>{item.count}</div>
                        <div className="text-[10px] text-gray-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. 데일리테스트 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    🎯 데일리테스트
                    {avgDaily != null && <span className="text-xs text-gray-400 font-normal">평균 {avgDaily}점</span>}
                  </h3>
                  {dailyLineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={dailyLineData} margin={{ left: -15, top: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis domain={[40, 108]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}`} />
                        <Tooltip formatter={(v) => [`${v}점`, '점수']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Line type="monotone" dataKey="점수" stroke={stuColor} strokeWidth={2.5}
                          dot={{ r: 3, fill: stuColor }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">데이터 없음</p>
                  )}
                </section>

                {/* 5. 주간/월간시험 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    📊 주간/월간시험
                    {avgExam != null && <span className="text-xs text-gray-400 font-normal">평균 {avgExam}점</span>}
                  </h3>
                  {examLineData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={examLineData} margin={{ left: -15, top: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                          <YAxis domain={[40, 108]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}점`, '점수']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                          <Line type="monotone" dataKey="점수" stroke="#8b5cf6" strokeWidth={2.5}
                            dot={{ r: 3, fill: '#8b5cf6' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                      {fieldRadarData.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] text-gray-400 mb-1 text-center">분야별 성취도 (최근 시험 기준)</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={fieldRadarData}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: '#64748B' }} />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar dataKey="value" fill={stuColor} fillOpacity={0.25} stroke={stuColor} strokeWidth={2} />
                              <Tooltip formatter={(v) => `${v}점`} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">데이터 없음</p>
                  )}
                </section>

                {/* 3-b. 최근 진도 기록 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    📖 최근 진도 기록
                    <span className="text-xs text-gray-400 font-normal">({cls?.name ?? ''} 기준)</span>
                  </h3>
                  {stuProgress.length > 0 ? (
                    <div className="space-y-2">
                      {stuProgress.map(p => (
                        <div key={p.date} className="rounded-xl border border-gray-100 px-3 py-2">
                          <div className="text-[10px] text-gray-400 mb-0.5">{p.date}</div>
                          {p.content && <div className="text-xs text-gray-700 leading-relaxed">📌 {p.content}</div>}
                          {p.homework && <div className="text-xs text-blue-600 mt-0.5">📚 과제: {p.homework}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">진도 기록 없음</p>
                  )}
                </section>

                {/* 3-c. 관찰 기록 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    🔍 관찰 기록
                    {stuObs.length > 0 && <span className="text-xs text-gray-400 font-normal">{stuObs.length}건</span>}
                  </h3>
                  {stuObs.length > 0 ? (
                    <div className="space-y-2">
                      {stuObs.map(o => (
                        <div key={o.id ?? o.date} className="rounded-xl border border-gray-100 px-3 py-2">
                          <div className="text-[10px] text-gray-400 mb-0.5">{o.date}</div>
                          {o.note && (
                            <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mb-1">
                              🔒 {o.note}
                            </div>
                          )}
                          {o.parentNote && (
                            <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                              📱 {o.parentNote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">관찰 기록 없음</p>
                  )}
                </section>

                {/* AI 인사이트 */}
                <section>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">🤖 AI 인사이트</h3>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 space-y-2">
                    {insights.length > 0 ? insights.map((ins, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                        <span>{ins}</span>
                      </div>
                    )) : (
                      <p className="text-xs text-gray-400">데이터가 쌓이면 인사이트가 표시됩니다.</p>
                    )}
                  </div>
                </section>
              </div>

              {/* ── 하단 탭 이동 버튼 ── */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 rounded-b-2xl">
                <p className="text-[10px] text-gray-400 mb-2 text-center">해당 탭으로 바로 이동</p>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { tab: 'attendance'  as Tab, icon: '✅', label: '출석체크' },
                    { tab: 'progress'    as Tab, icon: '📖', label: '진도/과제' },
                    { tab: 'observation' as Tab, icon: '📝', label: '학생관찰' },
                    { tab: 'homework'    as Tab, icon: '📋', label: '과제수행' },
                  ]).map(({ tab, icon, label }) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setSelectedStudentId(null); }}
                      className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-center transition-all"
                      style={{ background: activeTab === tab ? '#EEF2FF' : '#F8FAFC', color: activeTab === tab ? '#4F46E5' : '#64748B' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLElement).style.color = '#4F46E5'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = activeTab === tab ? '#EEF2FF' : '#F8FAFC'; (e.currentTarget as HTMLElement).style.color = activeTab === tab ? '#4F46E5' : '#64748B'; }}
                    >
                      <span className="text-base">{icon}</span>
                      <span className="text-[10px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      </div>{/* /스크롤 영역 */}
    </div>
  );
}
