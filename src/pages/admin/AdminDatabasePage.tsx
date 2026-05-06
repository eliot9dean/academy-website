import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DB_INIT, useDB } from '../../hooks/useTableData';
import {
  mockUsers, mockStudents, mockClasses, mockAttendance,
  mockDailyProgress, mockHomeworkResults, mockTestScores,
  mockScheduleEvents, mockConsultations, mockFinancials, mockDailyReports,
  mockClassHistory, mockEnrollmentMgmt, mockObservations,
} from '../../data/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────
type ColType = 'bool' | 'array' | 'number' | 'select' | 'multiselect' | 'time' | 'month' | 'textarea' | 'date';

// 10분 간격 시간 옵션 (00:00 ~ 23:50)
const TIME_OPTIONS: string[] = Array.from({ length: 24 * 6 }, (_, i) => {
  const h = Math.floor(i / 6);
  const m = (i % 6) * 10;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

// 학년 옵션 (초1~초6, 중1~중3, 고1~고3)
const GRADE_OPTIONS = ['초1','초2','초3','초4','초5','초6','중1','중2','중3','고1','고2','고3'];

interface ColDef {
  key: string;
  label: string;
  type?: ColType;
  options?: string[];
  /** 다른 테이블에서 이름을 가져옴. e.g. { table:'users', display:'name' } */
  resolveFrom?: { table: string; display: string };
  /** array 타입인데 다른 테이블에서 이름 배열 */
  resolveArrayFrom?: { table: string; display: string };
  /** 편집 시 표시할 안내 메시지 */
  info?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

interface TableDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  columns: ColDef[];
  data: Row[];
  /** 연월 필터를 사용할 테이블 */
  monthFilter?: boolean;
  /** monthFilter 시 사용할 필드명 (기본: 'date') */
  monthFilterKey?: string;
}

// ── Tables ────────────────────────────────────────────────────────────────────
const TABLES: TableDef[] = [
  {
    id: 'users', label: '사용자(Users)', icon: '👤', color: '#4F46E5',
    columns: [
      { key: 'id',      label: 'ID' },
      { key: 'name',    label: '이름' },
      { key: 'role',    label: '역할', type: 'select', options: ['admin','teacher','staff','parent'] },
      { key: 'phone',   label: '연락처' },
      { key: 'email',   label: '이메일', info: '앱 표시용 이메일입니다. 실제 로그인 이메일(Supabase Auth)은 별도 관리되므로 여기서 변경해도 로그인에는 영향 없습니다.' },
      { key: 'ssn',        label: '주민등록번호' },
      { key: 'address',    label: '주소' },
      { key: 'joinDate',   label: '입사일', type: 'date' },
      { key: 'resignDate', label: '퇴사일', type: 'date' },
    ],
    data: mockUsers,
  },
  {
    id: 'students', label: '학생(Students)', icon: '🎓', color: '#0891B2',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '이름' },
      { key: 'grade', label: '학년', type: 'select', options: GRADE_OPTIONS },
      { key: 'school', label: '학교' },
      { key: 'parentName', label: '학부모명' },
      { key: 'studentPhone', label: '학생연락처' },
      { key: 'parentPhone', label: '학부모연락처' },
      { key: 'enrollDate', label: '등록일', type: 'date' },
      { key: 'status', label: '상태', type: 'select', options: ['enrolled','withdrawn'] },
      { key: 'withdrawDate', label: '퇴원일', type: 'date' },
      { key: 'withdrawReason', label: '퇴원사유' },
      { key: 'classIds', label: '수강반', resolveArrayFrom: { table: 'classes', display: 'name' } },
      { key: 'tuitionPaid', label: '납부', type: 'bool' },
      { key: 'tuitionDueDate', label: '납부기한', type: 'date' },
    ],
    data: mockStudents,
  },
  {
    id: 'classes', label: '반(Classes)', icon: '📚', color: '#7C3AED',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: '반 이름' },
      { key: 'teacherId', label: '담당 선생님', resolveFrom: { table: 'users', display: 'name' } },
      { key: 'subject', label: '과목', type: 'select', options: ['영어', '수학', '국어', '과학', '사회', '역사', '기타'] },
      { key: 'days', label: '반 요일', type: 'multiselect', options: ['월', '화', '수', '목', '금', '토', '일'] },
      { key: 'startTime', label: '시작', type: 'time' },
      { key: 'endTime', label: '종료', type: 'time' },
      { key: 'studentIds', label: '수강 학생', resolveArrayFrom: { table: 'students', display: 'name' } },
      { key: 'grade', label: '학년', type: 'select', options: GRADE_OPTIONS },
    ],
    data: mockClasses,
  },
  {
    id: 'attendance', label: '출석(Attendance)', icon: '✅', color: '#16A34A',
    columns: [
      { key: 'studentId', label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'status', label: '상태', type: 'select', options: ['present','absent','late','early_leave'] },
      { key: 'note', label: '메모' },
    ],
    data: mockAttendance,
  },
  {
    id: 'dailyProgress', label: '반 일지(DailyProgress)', icon: '📝', color: '#0D9488',
    columns: [
      { key: 'classId', label: '반', resolveFrom: { table: 'classes', display: 'name' } },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'content', label: '반 내용', type: 'textarea' },
      { key: 'homework', label: '과제', type: 'textarea' },
      { key: 'teacherNote', label: '선생님 메모', type: 'textarea' },
      { key: 'parentMessage', label: '학부모 메시지', type: 'textarea' },
    ],
    data: mockDailyProgress,
  },
  {
    id: 'homework', label: '과제결과(HomeworkResults)', icon: '📋', color: '#B45309',
    columns: [
      { key: 'studentId', label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'classId', label: '반', resolveFrom: { table: 'classes', display: 'name' } },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'result', label: '결과', type: 'select', options: ['excellent','good','poor','not_submitted'] },
    ],
    data: mockHomeworkResults,
  },
  {
    id: 'testScores', label: '시험성적(TestScores)', icon: '📊', color: '#BE185D',
    columns: [
      { key: 'studentId', label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'classId', label: '반', resolveFrom: { table: 'classes', display: 'name' } },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'type', label: '유형', type: 'select', options: ['daily','weekly','monthly'] },
      { key: 'testName', label: '시험명' },
      { key: 'score', label: '점수', type: 'number' },
      { key: 'maxScore', label: '만점', type: 'number' },
      // virtual columns — computed at render
      { key: '__classAvg', label: '반평균' },
      { key: '__gradeAvg', label: '학년평균' },
      { key: '__schoolAvg', label: '학원평균' },
    ],
    data: mockTestScores,
  },
  {
    id: 'observations', label: '학생관찰(Observations)', icon: '🔍', color: '#7C3AED',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'classId', label: '반', resolveFrom: { table: 'classes', display: 'name' } },
      { key: 'studentId', label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'note', label: '관찰 메모', type: 'textarea' },
      { key: 'parentNote', label: '학부모 메시지', type: 'textarea' },
    ],
    data: mockObservations,
  },
  {
    id: 'schedule', label: '일정(ScheduleEvents)', icon: '📅', color: '#2563EB',
    monthFilter: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: '제목' },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'startTime', label: '시작', type: 'time' },
      { key: 'endTime', label: '종료', type: 'time' },
      { key: 'type', label: '종류', type: 'select', options: ['consultation','meeting','event','external'] },
      { key: 'personName', label: '상담자' },
      { key: 'personType', label: '구분', type: 'select', options: ['학부모','강사','외부업체','기타'] },
      { key: 'phone', label: '연락처' },
      { key: 'content', label: '내용', type: 'textarea' },
    ],
    data: mockScheduleEvents,
  },
  {
    id: 'consultations', label: '상담(Consultations)', icon: '💬', color: '#6D28D9',
    monthFilter: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'studentName', label: '학생명' },
      { key: 'parentName', label: '학부모' },
      { key: 'phone', label: '연락처' },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'result', label: '결과', type: 'select', options: ['registered','pending','declined'] },
      { key: 'source', label: '유입경로', type: 'select', options: ['지인 추천','인터넷 검색','인스타그램','현수막','기타'] },
      { key: 'contactForEvents', label: '연락동의', type: 'bool' },
      { key: 'notes', label: '상담내용', type: 'textarea' },
    ],
    data: mockConsultations,
  },
  {
    id: 'financials', label: '재무(Financials)', icon: '💰', color: '#15803D',
    monthFilter: true,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'type', label: '유형', type: 'select', options: ['income','fixed_expense','variable_expense'] },
      { key: 'category', label: '카테고리' },
      { key: 'amount', label: '금액', type: 'number' },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'description', label: '설명' },
    ],
    data: mockFinancials,
  },
  {
    id: 'dailyReports', label: '데일리리포트(DailyReports)', icon: '📨', color: '#0369A1',
    columns: [
      { key: 'classId', label: '반', resolveFrom: { table: 'classes', display: 'name' } },
      { key: 'date', label: '날짜', type: 'date' },
      { key: 'studentId', label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'sent', label: '발송', type: 'bool' },
      { key: 'sentAt', label: '발송시간' },
      { key: 'parentPhone', label: '학부모 연락처' },
      { key: 'note', label: '특이사항' },
    ],
    data: mockDailyReports,
  },
  {
    id: 'classHistory', label: '반이동이력(ClassHistory)', icon: '🔄', color: '#0F766E',
    columns: [
      { key: 'id',        label: 'ID' },
      { key: 'studentId', label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'classId',   label: '반 ID' },
      { key: 'className', label: '반 이름' },
      { key: 'startDate', label: '시작일', type: 'date' },
      { key: 'endDate',   label: '종료일', type: 'date' },
    ],
    data: mockClassHistory,
  },
  {
    id: 'enrollmentMgmt', label: '수강관리(EnrollmentMgmt)', icon: '📒', color: '#7C3AED',
    monthFilter: true,
    monthFilterKey: 'paymentMonth',
    columns: [
      { key: 'id',              label: 'ID' },
      { key: 'studentId',       label: '학생', resolveFrom: { table: 'students', display: 'name' } },
      { key: 'classId',         label: '반',   resolveFrom: { table: 'classes',  display: 'name' } },
      { key: 'enrollStartDate', label: '수강 시작일', type: 'date' },
      { key: 'enrollEndDate',   label: '수강 종료일', type: 'date' },
      { key: 'paymentMonth',    label: '납부 월', type: 'month' },
      { key: 'tuitionFee',      label: '수강료', type: 'number' },
      { key: 'tuitionDueDate',  label: '납부 기한', type: 'date' },
      { key: 'tuitionPaid',     label: '수강료 납부', type: 'bool' },
      { key: 'tuitionPaidDate', label: '납부일', type: 'date' },
      { key: 'textbookName',    label: '교재명' },
      { key: 'textbookPublisher', label: '출판사' },
      { key: 'textbookFee',     label: '교재비', type: 'number' },
      { key: 'textbookPaid',    label: '교재비 납부', type: 'bool' },
      { key: 'textbookPaidDate', label: '교재비 납부일', type: 'date' },
      { key: 'memo',            label: '메모' },
    ],
    data: mockEnrollmentMgmt,
  },
];

// ── Status / badge styles ─────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  enrolled: { bg: '#DCFCE7', text: '#15803D' }, withdrawn: { bg: '#FEE2E2', text: '#DC2626' },
  present: { bg: '#DCFCE7', text: '#15803D' }, absent: { bg: '#FEE2E2', text: '#DC2626' },
  late: { bg: '#FEF9C3', text: '#A16207' }, early_leave: { bg: '#FFF7ED', text: '#C2410C' },
  registered: { bg: '#DBEAFE', text: '#1D4ED8' }, pending: { bg: '#FEF9C3', text: '#92400E' },
  declined: { bg: '#FEE2E2', text: '#991B1B' },
  income: { bg: '#DCFCE7', text: '#15803D' }, fixed_expense: { bg: '#FFEDD5', text: '#C2410C' },
  variable_expense: { bg: '#FEF9C3', text: '#A16207' },
  admin: { bg: '#EDE9FE', text: '#5B21B6' }, teacher: { bg: '#DBEAFE', text: '#1D4ED8' },
  staff: { bg: '#F0FDF4', text: '#15803D' }, parent: { bg: '#FFF7ED', text: '#C2410C' },
  excellent: { bg: '#DCFCE7', text: '#15803D' }, good: { bg: '#DBEAFE', text: '#1D4ED8' },
  poor: { bg: '#FEF9C3', text: '#A16207' }, not_submitted: { bg: '#FEE2E2', text: '#DC2626' },
  daily: { bg: '#F0FDF4', text: '#15803D' }, weekly: { bg: '#DBEAFE', text: '#1D4ED8' }, monthly: { bg: '#EDE9FE', text: '#5B21B6' },
  consultation: { bg: '#DBEAFE', text: '#1D4ED8' }, meeting: { bg: '#EDE9FE', text: '#5B21B6' },
  event: { bg: '#DCFCE7', text: '#15803D' }, external: { bg: '#FFEDD5', text: '#C2410C' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function resolveName(tableData: Record<string, Row[]>, table: string, id: string, display: string): string {
  const row = (tableData[table] ?? []).find(r => r.id === id);
  return row ? String(row[display] ?? id) : id;
}

function resolveNames(tableData: Record<string, Row[]>, table: string, ids: string[], display: string): string {
  return ids.map(id => resolveName(tableData, table, id, display)).join(', ');
}

// ── Read-only cell ────────────────────────────────────────────────────────────
function CellValue({ value, col, tableData }: { value: unknown; col: ColDef; tableData: Record<string, Row[]> }) {
  if (col.key.startsWith('__')) return null; // virtual computed — handled separately

  if (value === undefined || value === null || value === '') {
    return <span style={{ color: '#CBD5E1' }}>—</span>;
  }

  // ID → name resolution (single)
  if (col.resolveFrom && typeof value === 'string') {
    const name = resolveName(tableData, col.resolveFrom.table, value, col.resolveFrom.display);
    return <span style={{ color: '#475569' }}>{name}</span>;
  }

  // ID array → name array resolution
  if (col.resolveArrayFrom && Array.isArray(value)) {
    const names = resolveNames(tableData, col.resolveArrayFrom.table, value as string[], col.resolveArrayFrom.display);
    return (
      <div className="flex flex-wrap gap-1">
        {names.split(', ').map((n, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#F1F5F9', color: '#475569' }}>{n}</span>
        ))}
      </div>
    );
  }

  if (col.type === 'bool') {
    return value
      ? <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>
      : <span style={{ color: '#CBD5E1' }}>✗</span>;
  }

  if (col.type === 'array' && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {(value as string[]).map((v, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#F1F5F9', color: '#475569' }}>{v}</span>
        ))}
      </div>
    );
  }

  if (col.type === 'number') {
    return <span style={{ color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{Number(value).toLocaleString('ko-KR')}</span>;
  }

  const str = String(value);
  const badge = STATUS_STYLE[str];
  if (badge) {
    return <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: badge.bg, color: badge.text }}>{str}</span>;
  }
  if (str.length > 28) {
    return <span title={str} style={{ color: '#475569' }}>{str.slice(0, 26)}…</span>;
  }
  return <span style={{ color: '#475569' }}>{str}</span>;
}

// ── Editable cell ─────────────────────────────────────────────────────────────
function EditCell({ value, col, onChange, tableData }: {
  value: unknown; col: ColDef; onChange: (v: unknown) => void; tableData: Record<string, Row[]>;
}) {
  if (col.key.startsWith('__')) return null;

  if (col.type === 'bool') {
    return <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-indigo-500" />;
  }

  // Single ID resolver → select with names
  if (col.resolveFrom) {
    const options = (tableData[col.resolveFrom.table] ?? []);
    return (
      <select className="form-select text-xs py-0.5 w-full"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>{String(o[col.resolveFrom!.display] ?? o.id)}</option>
        ))}
      </select>
    );
  }

  // Array ID resolver → comma-separated names that map back to IDs
  if (col.resolveArrayFrom) {
    const options = (tableData[col.resolveArrayFrom.table] ?? []);
    const currentIds = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
        {options.map(o => (
          <label key={o.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input type="checkbox"
              checked={currentIds.includes(o.id)}
              onChange={e => {
                const next = e.target.checked
                  ? [...currentIds, o.id]
                  : currentIds.filter(id => id !== o.id);
                onChange(next);
              }}
              className="w-3 h-3 accent-indigo-500" />
            <span style={{ color: '#475569' }}>{String(o[col.resolveArrayFrom!.display] ?? o.id)}</span>
          </label>
        ))}
      </div>
    );
  }

  if (col.type === 'select' && col.options) {
    return (
      <select className="form-select text-xs py-0.5 w-full"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {col.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  // 다중 선택 (요일 등 predefined 옵션 배열)
  if (col.type === 'multiselect' && col.options) {
    const current = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="flex flex-wrap gap-1">
        {col.options.map(opt => {
          const checked = current.includes(opt);
          return (
            <label key={opt} className="flex items-center gap-0.5 text-xs cursor-pointer select-none">
              <input type="checkbox"
                checked={checked}
                onChange={e => {
                  const next = e.target.checked
                    ? [...current, opt]
                    : current.filter(v => v !== opt);
                  onChange(next);
                }}
                className="w-3 h-3 accent-indigo-500" />
              <span style={{ color: '#475569' }}>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // 10분 간격 시간 선택
  if (col.type === 'time') {
    return (
      <select className="form-select text-xs py-0.5 w-24"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}>
        <option value="">—</option>
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    );
  }

  if (col.type === 'number') {
    return <input type="number" className="form-input text-xs py-0.5 w-20"
      value={String(value ?? '')} onChange={e => onChange(Number(e.target.value))} />;
  }
  if (col.type === 'textarea') {
    return <textarea className="form-input text-xs py-0.5 resize-none w-44" rows={2}
      value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
  }
  if (col.type === 'date') {
    return <input type="date" className="form-input text-xs py-0.5 w-32"
      value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
  }
  if (col.type === 'month') {
    return <input type="month" className="form-input text-xs py-0.5 w-28"
      value={String(value ?? '')} onChange={e => onChange(e.target.value)} />;
  }
  if (col.type === 'array') {
    const arr = Array.isArray(value) ? (value as string[]).join(', ') : String(value ?? '');
    return <input className="form-input text-xs py-0.5 w-32"
      value={arr} onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />;
  }
  // 기본 텍스트 입력 (+ info 안내 메시지)
  const inputNode = (
    <input className="form-input text-xs py-0.5 w-28"
      value={String(value ?? '')} onChange={e => onChange(e.target.value)} />
  );
  if (col.info) {
    return (
      <div className="flex flex-col gap-0.5">
        {inputNode}
        <p className="text-[10px] leading-tight" style={{ color: '#B45309' }}>ℹ️ {col.info}</p>
      </div>
    );
  }
  return inputNode;
}

// ── Trash icon ────────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 1.5A.5.5 0 0 1 6 1h4a.5.5 0 0 1 .5.5V2H11v-.5A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5V2h.5v-.5z"/>
      <path d="M2.5 3h11a.5.5 0 0 1 .5.5l-.867 9.742A2 2 0 0 1 11.138 15H4.862a2 2 0 0 1-1.995-1.758L2 3.5a.5.5 0 0 1 .5-.5zm3 2a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V5zm3 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V5zm3 0a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V5z"/>
    </svg>
  );
}

// 테이블별 추가 폼 초기값
const EMPTY_ROWS: Record<string, Row> = {
  users:         { id: '', name: '', role: 'teacher', phone: '', email: '', ssn: '', address: '', joinDate: '', resignDate: '' },
  students:      { id: '', name: '', grade: '중1', school: '', parentName: '', studentPhone: '', parentPhone: '', enrollDate: new Date().toISOString().slice(0,10), status: 'enrolled', classIds: [], tuitionPaid: false, tuitionDueDate: '' },
  classes:       { id: '', name: '', teacherId: '', subject: '', days: [], startTime: '', endTime: '', grade: '중1', studentIds: [] },
  dailyProgress: { classId: '', date: new Date().toISOString().slice(0,10), content: '', homework: '', teacherNote: '', parentMessage: '' },
  observations:  { id: '', classId: '', studentId: '', date: new Date().toISOString().slice(0,10), note: '', parentNote: '' },
};
const ADD_TABLES = Object.keys(EMPTY_ROWS); // 추가 버튼을 표시할 테이블 목록

// 오늘 연월 (YYYY-MM)
function todayYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDatabasePage() {
  const [activeTable, setActiveTable] = useState('users');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  // 전역 DB 스토어 (useTableData와 동일한 스토어 공유)
  const [tableData, setTableData] = useDB();

  // 아카이브 저장소
  const [archived, setArchived] = useLocalStorage<Record<string, Row[]>>('ams_db_archived', {});

  // 아카이브 보기 토글
  const [showArchived, setShowArchived] = useState(false);

  // 인라인 편집
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Row>({});

  // 추가 폼 (테이블 공통)
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<Row>({});

  // 컬럼 필터
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  // 정렬
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // 테이블 영역 ref (클릭 외부 감지)
  const tableAreaRef = useRef<HTMLDivElement>(null);

  // 연월 필터 (schedule/consultations/financials)
  const [monthSel, setMonthSel] = useState(todayYM());

  // 새 테이블 초기화 sync
  useEffect(() => {
    setTableData(prev => {
      const next = { ...prev };
      let changed = false;
      TABLES.forEach(t => {
        if (!next[t.id]) { next[t.id] = t.data.map(r => ({ ...r })); changed = true; }
      });
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC → 편집 취소
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setEditingIdx(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 테이블 영역 외부 클릭 → 편집 취소
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (editingIdx !== null && tableAreaRef.current && !tableAreaRef.current.contains(e.target as Node)) {
        setEditingIdx(null);
      }
    };
    document.addEventListener('mousedown', onMouse);
    return () => document.removeEventListener('mousedown', onMouse);
  }, [editingIdx]);

  const tableDef = TABLES.find(t => t.id === activeTable)!;
  const rows: Row[] = tableData[activeTable] ?? [];

  // 연월 필터 적용
  const monthFiltered = useMemo(() => {
    if (!tableDef.monthFilter) return rows;
    const key = tableDef.monthFilterKey ?? 'date';
    return rows.filter(r => String(r[key] ?? '').startsWith(monthSel));
  }, [rows, tableDef.monthFilter, tableDef.monthFilterKey, monthSel]);

  // 전역 검색
  const searched = useMemo(() => {
    if (!search) return monthFiltered;
    const q = search.toLowerCase();
    return monthFiltered.filter(row =>
      Object.values(row).some(v =>
        Array.isArray(v) ? v.some(i => String(i).toLowerCase().includes(q))
          : String(v).toLowerCase().includes(q),
      ),
    );
  }, [monthFiltered, search]);

  // 컬럼별 필터 (가상 컬럼 제외, resolveFrom은 이름으로 비교)
  const filtered = useMemo(() => {
    return searched.filter(row =>
      Object.entries(colFilters).every(([key, fv]) => {
        if (!fv) return true;
        const col = tableDef.columns.find(c => c.key === key);
        const val = row[key];
        if (col?.resolveFrom) {
          const name = resolveName(tableData, col.resolveFrom.table, String(val ?? ''), col.resolveFrom.display);
          return name.toLowerCase().includes(fv.toLowerCase());
        }
        if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(fv.toLowerCase()));
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      }),
    );
  }, [searched, colFilters, tableDef.columns, tableData]);

  // 시험성적 가상 평균 계산
  const avgMap = useMemo(() => {
    if (activeTable !== 'testScores') return new Map<string, { classAvg: number; gradeAvg: number; schoolAvg: number }>();
    const map = new Map<string, { classAvg: number; gradeAvg: number; schoolAvg: number }>();
    const allScores = tableData.testScores ?? [];
    allScores.forEach(row => {
      const key = `${row.studentId}-${row.classId}-${row.testName}-${row.date}`;
      // 반 평균
      const clsScores = allScores.filter(r => r.classId === row.classId && r.testName === row.testName && r.maxScore === row.maxScore);
      // 학년 평균 — via class
      const clsRow = (tableData.classes ?? []).find(c => c.id === row.classId);
      const grade = clsRow?.grade;
      const gradeClsIds = grade ? (tableData.classes ?? []).filter(c => c.grade === grade).map(c => c.id) : [];
      const gradeScores = allScores.filter(r => gradeClsIds.includes(r.classId) && r.testName === row.testName && r.maxScore === row.maxScore);
      // 학원 전체 평균
      const schoolScores = allScores.filter(r => r.testName === row.testName && r.maxScore === row.maxScore);
      const avg = (arr: Row[]) => arr.length ? Math.round(arr.reduce((s, r) => s + r.score, 0) / arr.length * 10) / 10 : 0;
      map.set(key, { classAvg: avg(clsScores), gradeAvg: avg(gradeScores), schoolAvg: avg(schoolScores) });
    });
    return map;
  }, [activeTable, tableData]);

  // 정렬 적용
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const aStr = Array.isArray(av) ? av.join(',') : String(av ?? '');
      const bStr = Array.isArray(bv) ? bv.join(',') : String(bv ?? '');
      const cmp = isNaN(Number(aStr)) || isNaN(Number(bStr))
        ? aStr.localeCompare(bStr, 'ko')
        : Number(aStr) - Number(bStr);
      const primary = sortDir === 'asc' ? cmp : -cmp;
      if (primary !== 0) return primary;
      // 출석 테이블: 날짜 같을 때 학생명 내림차순 2차 정렬
      if (activeTable === 'attendance' && sortKey === 'date') {
        const aName = resolveName(tableData, 'students', String(a['studentId'] ?? ''), 'name');
        const bName = resolveName(tableData, 'students', String(b['studentId'] ?? ''), 'name');
        return -aName.localeCompare(bName, 'ko');
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir, activeTable, tableData]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // 아카이브된 행
  const archivedRows: Row[] = archived[activeTable] ?? [];

  const handleTableChange = (id: string) => {
    setActiveTable(id);
    setSearch('');
    setPage(0);
    setEditingIdx(null);
    setShowAddForm(false);
    setAddForm({});
    setColFilters({});
    setShowArchived(false);
    // 날짜 기본 정렬: 최근일자 순 (내림차순)
    const DATE_SORT_KEY: Record<string, string> = {
      attendance:     'date',
      dailyProgress:  'date',
      homework:       'date',
      testScores:     'date',
      observations:   'date',
      schedule:       'date',
      consultations:  'date',
      financials:     'date',
      dailyReports:   'date',
      classHistory:   'startDate',
      enrollmentMgmt: 'enrollStartDate',
    };
    if (DATE_SORT_KEY[id]) {
      setSortKey(DATE_SORT_KEY[id]);
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir('asc');
    }
  };

  const handleSort = (key: string) => {
    if (key.startsWith('__')) return;
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  // 행 클릭 → 편집 모드 진입
  const handleRowClick = (globalIdx: number) => {
    if (editingIdx === globalIdx) return;
    setEditingIdx(globalIdx);
    setEditRow({ ...rows[globalIdx] });
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    setTableData(prev => {
      const next = { ...prev };
      const oldRow = prev[activeTable][editingIdx];
      next[activeTable] = prev[activeTable].map((r, i) => i === editingIdx ? { ...editRow } : r);

      // ── 양방향 연동: students.classIds ↔ classes.studentIds ──────────
      if (activeTable === 'students') {
        const sid = editRow.id as string;
        const oldIds: string[] = (oldRow.classIds as string[]) ?? [];
        const newIds: string[] = (editRow.classIds as string[]) ?? [];
        const removed = oldIds.filter(id => !newIds.includes(id));
        const added   = newIds.filter(id => !oldIds.includes(id));
        next.classes = (prev.classes ?? []).map(cls => {
          const sids: string[] = [...((cls.studentIds as string[]) ?? [])];
          if (removed.includes(cls.id as string) && sids.includes(sid))
            return { ...cls, studentIds: sids.filter(id => id !== sid) };
          if (added.includes(cls.id as string) && !sids.includes(sid))
            return { ...cls, studentIds: [...sids, sid] };
          return cls;
        });
      }

      if (activeTable === 'classes') {
        const cid = editRow.id as string;
        const oldIds: string[] = (oldRow.studentIds as string[]) ?? [];
        const newIds: string[] = (editRow.studentIds as string[]) ?? [];
        const removed = oldIds.filter(id => !newIds.includes(id));
        const added   = newIds.filter(id => !oldIds.includes(id));
        next.students = (prev.students ?? []).map(stu => {
          const cids: string[] = [...((stu.classIds as string[]) ?? [])];
          if (removed.includes(stu.id as string) && cids.includes(cid))
            return { ...stu, classIds: cids.filter(id => id !== cid) };
          if (added.includes(stu.id as string) && !cids.includes(cid))
            return { ...stu, classIds: [...cids, cid] };
          return stu;
        });
      }

      return next;
    });
    setEditingIdx(null);
  };

  const moveToArchive = (globalIdx: number) => {
    if (!window.confirm('이 항목을 아카이브로 이동하시겠습니까?\n(아카이브에서 복구할 수 있습니다)')) return;
    const row = rows[globalIdx];
    setArchived(prev => ({
      ...prev,
      [activeTable]: [...(prev[activeTable] ?? []), { ...row, _archivedAt: new Date().toISOString().slice(0, 10) }],
    }));
    setTableData(prev => ({
      ...prev,
      [activeTable]: prev[activeTable].filter((_, i) => i !== globalIdx),
    }));
    if (editingIdx === globalIdx) setEditingIdx(null);
  };

  const restoreFromArchive = (archIdx: number) => {
    const row = { ...archivedRows[archIdx] };
    delete row._archivedAt;
    setTableData(prev => ({
      ...prev,
      [activeTable]: [...(prev[activeTable] ?? []), row],
    }));
    setArchived(prev => ({
      ...prev,
      [activeTable]: (prev[activeTable] ?? []).filter((_, i) => i !== archIdx),
    }));
  };

  const addRecord = () => {
    // id가 있는 테이블은 중복 체크
    if ('id' in addForm && String(addForm.id ?? '').trim() === '') { alert('ID는 필수입니다.'); return; }
    if ('name' in addForm && String(addForm.name ?? '').trim() === '') { alert('이름은 필수입니다.'); return; }
    if ('id' in addForm && rows.some((r: Row) => r.id === String(addForm.id).trim())) { alert('이미 사용 중인 ID입니다.'); return; }

    const newRow = { ...addForm };
    if ('id' in newRow) newRow.id = String(newRow.id).trim();

    setTableData(prev => {
      const next = { ...prev, [activeTable]: [...(prev[activeTable] ?? []), newRow] };
      // 수업 추가 시 학생 classIds에도 반영
      if (activeTable === 'classes' && Array.isArray(newRow.studentIds)) {
        const cid = newRow.id as string;
        next.students = (prev.students ?? []).map(stu => {
          if ((newRow.studentIds as string[]).includes(stu.id as string)) {
            const cids: string[] = (stu.classIds as string[]) ?? [];
            return cids.includes(cid) ? stu : { ...stu, classIds: [...cids, cid] };
          }
          return stu;
        });
      }
      // 학생 추가 시 수업 studentIds에도 반영
      if (activeTable === 'students' && Array.isArray(newRow.classIds)) {
        const sid = newRow.id as string;
        next.classes = (prev.classes ?? []).map(cls => {
          if ((newRow.classIds as string[]).includes(cls.id as string)) {
            const sids: string[] = (cls.studentIds as string[]) ?? [];
            return sids.includes(sid) ? cls : { ...cls, studentIds: [...sids, sid] };
          }
          return cls;
        });
      }
      return next;
    });
    setAddForm({ ...EMPTY_ROWS[activeTable] });
    setShowAddForm(false);
  };

  const getGlobalIdx = (row: Row) => rows.indexOf(row);

  // 가시 컬럼 (가상 컬럼 포함 여부: testScores일 때만 표시)
  const visibleCols = tableDef.columns.filter(c => !c.key.startsWith('__') || activeTable === 'testScores');

  // td 클래스 결정 — 긴 텍스트 컬럼은 cell-wrap, 배열/resolve 컬럼은 기본
  const tdCls = (col: ColDef) => {
    if (col.key.startsWith('__')) return 'text-xs text-center';
    const longKeys = ['address','notes','description','content','parentMessage','teacherNote','homework','note','title'];
    if (col.type === 'textarea' || longKeys.includes(col.key)) return 'text-xs cell-wrap';
    if (col.resolveArrayFrom) return 'text-xs cell-wrap';
    return 'text-xs';
  };

  // 필터 입력 폭: 긴 텍스트 컬럼은 넓게, 나머지는 좁게
  const filterInputWidth = (col: ColDef): number => {
    if (col.type === 'bool' || col.key.startsWith('__')) return 0;
    const wideKeys = ['address','email','notes','description','content','parentMessage','teacherNote','homework'];
    if (col.type === 'textarea' || wideKeys.includes(col.key)) return 140;
    if (col.type === 'select') return 90;
    if (col.key === 'date' || col.type === 'date') return 110;
    if (['name','studentName','parentName','phone','studentPhone','parentPhone','school'].includes(col.key)) return 90;
    return 70;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">DB 관리</h1>
        <p className="page-subtitle">전체 데이터베이스 조회 · 편집 — 모든 페이지와 실시간 연동</p>
      </div>

      <div className="flex gap-4">
        {/* ── Sidebar ── */}
        <aside className="w-52 flex-shrink-0">
          <div className="card overflow-hidden">
            <div className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider"
              style={{ background: '#F8FAFC', borderBottom: '1px solid #EEF2F7', color: '#94A3B8' }}>
              테이블 ({TABLES.length})
            </div>
            <nav className="py-1">
              {TABLES.map(t => (
                <button key={t.id} onClick={() => handleTableChange(t.id)}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all"
                  style={activeTable === t.id
                    ? { background: '#EEF2FF', color: t.color, borderLeft: `3px solid ${t.color}` }
                    : { color: '#64748B', borderLeft: '3px solid transparent' }}>
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label.split('(')[0]}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: activeTable === t.id ? t.color + '22' : '#F1F5F9', color: activeTable === t.id ? t.color : '#94A3B8' }}>
                    {(tableData[t.id] ?? []).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main panel ── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xl">{tableDef.icon}</span>
              <h2 className="font-bold text-sm" style={{ color: '#1E293B' }}>{tableDef.label}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: tableDef.color + '18', color: tableDef.color }}>
                {sorted.length}행{search ? ` / ${rows.length}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* 연월 필터 (schedule / consultations / financials) */}
              {tableDef.monthFilter && (
                <input type="month" className="form-select text-xs py-1"
                  value={monthSel}
                  onChange={e => { setMonthSel(e.target.value); setPage(0); }} />
              )}
              {ADD_TABLES.includes(activeTable) && (
                <button
                  onClick={() => {
                    const next = !showAddForm;
                    setShowAddForm(next);
                    if (next) { setAddForm({ ...EMPTY_ROWS[activeTable] }); setPage(0); }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={showAddForm ? { background: '#4F46E5', color: '#fff' } : { background: '#EEF2FF', color: '#4F46E5' }}>
                  {showAddForm ? '✕ 닫기' : `+ ${tableDef.label.split('(')[0]} 추가`}
                </button>
              )}
              {/* 목 데이터로 초기화 */}
              <button
                onClick={() => {
                  if (!window.confirm(`"${tableDef.label.split('(')[0]}" 테이블을 목 데이터로 초기화하시겠습니까?\n현재 변경 사항이 모두 사라집니다.`)) return;
                  setTableData(prev => ({
                    ...prev,
                    [activeTable]: (DB_INIT[activeTable] ?? []).map(r => ({ ...r })),
                  }));
                  setPage(0); setSearch(''); setColFilters({});
                }}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
                title="현재 테이블을 목 초기 데이터로 리셋합니다"
              >
                🔄 초기화
              </button>
              <input className="form-input text-xs py-1.5 w-44" placeholder="전체 검색..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>

          {/* Table */}
          <div className="card-section overflow-x-auto" ref={tableAreaRef}>
            <table className="data-table" style={{ minWidth: '100%', tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th style={{ width: 30, color: '#CBD5E1' }}>#</th>
                  {visibleCols.map(col => {
                    const isSorted = sortKey === col.key;
                    const sortable = !col.key.startsWith('__');
                    return (
                      <th key={col.key}
                        onClick={() => sortable && handleSort(col.key)}
                        style={{ cursor: sortable ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}>
                        <span className="flex items-center gap-1">
                          {col.label}
                          {sortable && (
                            <span style={{ fontSize: 10, color: isSorted ? tableDef.color : '#CBD5E1', fontWeight: 700 }}>
                              {isSorted ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                  <th className="text-center" style={{ width: 88 }}>관리</th>
                </tr>
                {/* ── 컬럼 필터 행 ── */}
                <tr style={{ background: '#F8FAFC' }}>
                  <td />
                  {visibleCols.map(col => {
                    const fw = filterInputWidth(col);
                    return (
                      <td key={col.key} className="px-1 py-1">
                        {fw === 0 ? <span /> : col.type === 'select' && col.options ? (
                          <select className="text-[10px] py-0.5 rounded border"
                            style={{ borderColor: '#E2E8F0', color: '#64748B', width: fw }}
                            value={colFilters[col.key] ?? ''}
                            onChange={e => { setColFilters(p => ({ ...p, [col.key]: e.target.value })); setPage(0); }}>
                            <option value="">전체</option>
                            {col.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (col.key === 'date' || col.type === 'date') ? (
                          <input type="date" className="text-[10px] py-0.5 px-1 rounded border"
                            style={{ borderColor: '#E2E8F0', color: '#64748B', width: fw }}
                            value={colFilters[col.key] ?? ''}
                            onChange={e => { setColFilters(p => ({ ...p, [col.key]: e.target.value })); setPage(0); }} />
                        ) : (
                          <input className="text-[10px] py-0.5 px-1.5 rounded border"
                            style={{ borderColor: '#E2E8F0', color: '#64748B', width: fw }}
                            placeholder="필터..."
                            value={colFilters[col.key] ?? ''}
                            onChange={e => { setColFilters(p => ({ ...p, [col.key]: e.target.value })); setPage(0); }} />
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-1">
                    {Object.values(colFilters).some(Boolean) && (
                      <button onClick={() => { setColFilters({}); setPage(0); }}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: '#FEF2F2', color: '#DC2626' }}>초기화</button>
                    )}
                  </td>
                </tr>
              </thead>
              <tbody>
                {showAddForm && ADD_TABLES.includes(activeTable) && (
                  <tr style={{ background: '#F5F3FF', borderBottom: '2px solid #C7D2FE' }}>
                    <td className="text-xs text-center font-bold" style={{ color: '#4F46E5' }}>NEW</td>
                    {visibleCols.map(col => (
                      <td key={col.key} className="px-2 py-1.5">
                        {col.key.startsWith('__') ? null : (
                          <EditCell
                            value={addForm[col.key]}
                            col={col}
                            tableData={tableData}
                            onChange={v => setAddForm(prev => ({ ...prev, [col.key]: v }))}
                          />
                        )}
                      </td>
                    ))}
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 justify-center">
                        <button onClick={addRecord}
                          style={{ background: '#4F46E5', color: '#fff', fontSize: '10px', padding: '2px 10px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          저장
                        </button>
                        <button onClick={() => { setShowAddForm(false); setAddForm({}); }}
                          style={{ background: '#F1F5F9', color: '#64748B', fontSize: '10px', padding: '2px 7px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCols.length + 2} className="text-center py-10">
                      <div className="text-2xl mb-2">🔍</div>
                      <p className="text-xs" style={{ color: '#CBD5E1' }}>결과가 없습니다</p>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row, ri) => {
                    const globalIdx = getGlobalIdx(row);
                    const isEditing = editingIdx === globalIdx;
                    const avgKey = `${row.studentId}-${row.classId}-${row.testName}-${row.date}`;
                    const avgs = avgMap.get(avgKey);

                    return (
                      <tr key={ri}
                        onClick={() => !isEditing && handleRowClick(globalIdx)}
                        style={{
                          background: isEditing ? '#F0F4FF' : undefined,
                          cursor: isEditing ? 'default' : 'pointer',
                        }}
                        onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                        onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = ''; }}>
                        <td className="text-xs text-center" style={{ color: '#CBD5E1' }}>
                          {page * PAGE_SIZE + ri + 1}
                        </td>
                        {visibleCols.map(col => {
                          // 가상 컬럼 처리 (시험성적 평균)
                          if (col.key === '__classAvg')  return <td key={col.key} className="text-xs text-center font-semibold" style={{ color: '#1D4ED8' }}>{avgs ? avgs.classAvg : '—'}</td>;
                          if (col.key === '__gradeAvg')  return <td key={col.key} className="text-xs text-center font-semibold" style={{ color: '#7C3AED' }}>{avgs ? avgs.gradeAvg : '—'}</td>;
                          if (col.key === '__schoolAvg') return <td key={col.key} className="text-xs text-center font-semibold" style={{ color: '#15803D' }}>{avgs ? avgs.schoolAvg : '—'}</td>;

                          return (
                            <td key={col.key} className={tdCls(col)}>
                              {isEditing
                                ? <EditCell value={editRow[col.key]} col={col} tableData={tableData}
                                    onChange={v => setEditRow(prev => ({ ...prev, [col.key]: v }))} />
                                : <CellValue value={row[col.key]} col={col} tableData={tableData} />
                              }
                            </td>
                          );
                        })}
                        {/* 관리 버튼 */}
                        <td className="text-center" style={{ whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          {isEditing ? (
                            <div className="flex gap-1 justify-center" style={{ flexWrap: 'nowrap' }}>
                              <button onClick={saveEdit} className="font-semibold transition-all"
                                style={{ background: '#DCFCE7', color: '#15803D', fontSize: '10px', padding: '2px 10px', borderRadius: '4px', lineHeight: '1.7', whiteSpace: 'nowrap' }}>
                                저장
                              </button>
                              <button onClick={() => setEditingIdx(null)}
                                style={{ background: '#F1F5F9', color: '#64748B', fontSize: '10px', padding: '2px 7px', borderRadius: '4px', lineHeight: '1.7', whiteSpace: 'nowrap' }}>
                                취소
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => moveToArchive(globalIdx)}
                              className="transition-all hover:opacity-80"
                              style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 5px', borderRadius: '4px', lineHeight: '1.7', display: 'inline-flex', alignItems: 'center' }}
                              title="아카이브로 이동">
                              <TrashIcon />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs" style={{ color: '#64748B' }}>
              <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} / {filtered.length}행</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-1 rounded-md"
                  style={{ background: '#F1F5F9', color: page === 0 ? '#CBD5E1' : '#475569' }}>«</button>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-2 py-1 rounded-md"
                  style={{ background: '#F1F5F9', color: page === 0 ? '#CBD5E1' : '#475569' }}>‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)} className="px-2.5 py-1 rounded-md font-medium"
                      style={page === p ? { background: '#4F46E5', color: '#fff' } : { background: '#F1F5F9', color: '#475569' }}>
                      {p + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-2 py-1 rounded-md"
                  style={{ background: '#F1F5F9', color: page >= totalPages - 1 ? '#CBD5E1' : '#475569' }}>›</button>
                <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2 py-1 rounded-md"
                  style={{ background: '#F1F5F9', color: page >= totalPages - 1 ? '#CBD5E1' : '#475569' }}>»</button>
              </div>
            </div>
          )}

          {/* ── 아카이브 토글 버튼 ── */}
          <div className="mt-4">
            <button
              onClick={() => setShowArchived(v => !v)}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg w-full transition-all"
              style={showArchived
                ? { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
                : { background: '#F8FAFC', color: '#94A3B8', border: '1px solid #EEF2F7' }}>
              <span>🗄</span>
              <span>아카이브 ({archivedRows.length}건)</span>
              <span className="ml-auto">{showArchived ? '▲ 닫기' : '▼ 펼치기'}</span>
            </button>

            {showArchived && archivedRows.length > 0 && (
              <div className="card-section overflow-x-auto mt-2" style={{ border: '1px solid #FDE68A' }}>
                <div className="px-4 py-2 text-xs font-bold" style={{ background: '#FFFBEB', color: '#92400E', borderBottom: '1px solid #FDE68A' }}>
                  🗄 아카이브 — {tableDef.label}
                </div>
                <table className="data-table" style={{ minWidth: '100%', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      {visibleCols.filter(c => !c.key.startsWith('__')).map(col => <th key={col.key}>{col.label}</th>)}
                      <th style={{ width: 48 }}>보관일</th>
                      <th style={{ width: 60 }}>복구</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedRows.map((row, i) => (
                      <tr key={i} style={{ background: '#FFFBEB', opacity: 0.8 }}>
                        {visibleCols.filter(c => !c.key.startsWith('__')).map(col => (
                          <td key={col.key} className={tdCls(col)}>
                            <CellValue value={row[col.key]} col={col} tableData={tableData} />
                          </td>
                        ))}
                        <td className="text-xs" style={{ color: '#B45309' }}>{row._archivedAt ?? '—'}</td>
                        <td className="text-center">
                          <button onClick={() => restoreFromArchive(i)}
                            className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{ background: '#DCFCE7', color: '#15803D', fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>
                            복구
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showArchived && archivedRows.length === 0 && (
              <div className="text-center py-5 text-xs mt-2 rounded-lg" style={{ background: '#F8FAFC', color: '#CBD5E1', border: '1px solid #EEF2F7' }}>
                아카이브된 항목이 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
