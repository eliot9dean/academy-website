import { useState, useMemo } from 'react';
import { useTableData } from '../../hooks/useTableData';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, LabelList,
} from 'recharts';
import type { FinancialRecord, Student, ClassInfo, User, ConsultationRecord } from '../../types';

type PeriodType = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

const formatKRW = (n: number) => n.toLocaleString('ko-KR') + '원';
const formatMan = (n: number) => `${(n / 10000).toFixed(0)}만`;
const fmtDelta  = (n: number) => (n >= 0 ? '+' : '') + formatKRW(n);

function buildRange(type: PeriodType, sel: string, year: number): { start: string; end: string; months: string[] } {
  if (type === 'monthly') {
    const [y, m] = sel.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return { start: `${sel}-01`, end: `${sel}-${last}`, months: [sel] };
  }
  if (type === 'quarterly') {
    const q = Number(sel);
    const sm = (q - 1) * 3 + 1;
    const months = [0, 1, 2].map(i => `${year}-${String(sm + i).padStart(2, '0')}`);
    const last = new Date(year, sm + 2, 0).getDate();
    return { start: `${year}-${String(sm).padStart(2, '0')}-01`, end: `${year}-${String(sm + 2).padStart(2, '0')}-${last}`, months };
  }
  if (type === 'semiannual') {
    const h = Number(sel);
    const sm = (h - 1) * 6 + 1;
    const months = Array.from({ length: 6 }, (_, i) => `${year}-${String(sm + i).padStart(2, '0')}`);
    const last = new Date(year, sm + 5, 0).getDate();
    return { start: `${year}-${String(sm).padStart(2, '0')}-01`, end: `${year}-${String(sm + 5).padStart(2, '0')}-${last}`, months };
  }
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  return { start: `${year}-01-01`, end: `${year}-12-31`, months };
}

function buildPrevRange(type: PeriodType, sel: string, year: number): { start: string; end: string } {
  if (type === 'monthly') {
    const [y, m] = sel.split('-').map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    const prev = `${py}-${String(pm).padStart(2, '0')}`;
    const last = new Date(py, pm, 0).getDate();
    return { start: `${prev}-01`, end: `${prev}-${last}` };
  }
  if (type === 'quarterly') {
    const q = Number(sel);
    if (q === 1) return { start: `${year - 1}-10-01`, end: `${year - 1}-12-31` };
    const sm = (q - 2) * 3 + 1;
    const last = new Date(year, sm + 2, 0).getDate();
    return { start: `${year}-${String(sm).padStart(2, '0')}-01`, end: `${year}-${String(sm + 2).padStart(2, '0')}-${last}` };
  }
  if (type === 'semiannual') {
    const h = Number(sel);
    if (h === 1) return { start: `${year - 1}-07-01`, end: `${year - 1}-12-31` };
    return { start: `${year}-01-01`, end: `${year}-06-30` };
  }
  return { start: `${year - 1}-01-01`, end: `${year - 1}-12-31` };
}

const INSIGHT_ICON  = { good: '✅', warn: '⚠️', bad: '🔴', info: 'ℹ️' };
const INSIGHT_COLOR = { good: '#15803D', warn: '#92400E', bad: '#991B1B', info: '#1D4ED8' };
const INSIGHT_BG    = { good: '#F0FDF4', warn: '#FFFBEB', bad: '#FEF2F2', info: '#EFF6FF' };

interface InsightCriteria {
  marginGood: number;   // 영업이익률 양호 기준 (이상)
  marginWarn: number;   // 영업이익률 주의 기준 (이상, 미만이면 위험)
  fixedWarn: number;    // 고정비 비율 주의 기준 (초과)
  fixedBad: number;     // 고정비 비율 위험 기준 (초과)
  withdrawInfo: number; // 이탈률 양호→주의 기준 (이하 양호)
  withdrawWarn: number; // 이탈률 주의→위험 기준 (이하 주의)
}
const DEFAULT_CRITERIA: InsightCriteria = {
  marginGood: 20, marginWarn: 10,
  fixedWarn: 55,  fixedBad: 70,
  withdrawInfo: 5, withdrawWarn: 15,
};

const INCOME_CATEGORIES   = ['수강료', '기타수입'];
const FIXED_CATEGORIES    = ['임대료', '강사 급여', '인터넷/전화', '보험료', '스탭 급여'];
const VARIABLE_CATEGORIES = ['교재비', '문구/소모품', '마케팅', '공과금', '기타'];

function getCatOptions(type: FinancialRecord['type']) {
  return type === 'income' ? INCOME_CATEGORIES : type === 'fixed_expense' ? FIXED_CATEGORIES : VARIABLE_CATEGORIES;
}

export default function StaffFinancePage() {
  const [financials, setFinancials] = useTableData<FinancialRecord>('financials');
  const [students]      = useTableData<Student>('students');
  const [classes]       = useTableData<ClassInfo>('classes');
  const [users]         = useTableData<User>('users');
  const [consultations] = useTableData<ConsultationRecord>('consultations');

  // ── 기간 선택 상태 ──────────────────────────────────────────────────────
  const [year,       setYear]       = useState(2026);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [monthSel,   setMonthSel]   = useState('2026-04');
  const [quarterSel, setQuarterSel] = useState('2');
  const [halfSel,    setHalfSel]    = useState('1');

  // ── 내역 추가 모달 ──────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord]       = useState<Partial<FinancialRecord>>({ type: 'income', date: monthSel + '-01' });

  // ── 총평 ────────────────────────────────────────────────────────────────
  const [comment, setComment]               = useLocalStorage<string>('ams_finance_comment', '');
  const [editingComment, setEditingComment] = useState(false);
  const [draftComment, setDraftComment]     = useState('');

  // ── 인라인 편집 상태 ────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftEdit, setDraftEdit] = useState<Partial<FinancialRecord>>({});

  // ── 인사이트 기준 ────────────────────────────────────────────────────────
  const [criteria, setCriteria]                     = useLocalStorage<InsightCriteria>('ams_insight_criteria', DEFAULT_CRITERIA);
  const [showCriteriaTooltip, setShowCriteriaTooltip] = useState(false);
  const [showCriteriaEdit, setShowCriteriaEdit]       = useState(false);
  const [draftCriteria, setDraftCriteria]             = useState<InsightCriteria>(DEFAULT_CRITERIA);

  const sel = periodType === 'monthly' ? monthSel
    : periodType === 'quarterly' ? quarterSel
    : periodType === 'semiannual' ? halfSel
    : 'annual';

  const { start, end, months } = useMemo(() => buildRange(periodType, sel, year), [periodType, sel, year]);
  const { start: prevStart, end: prevEnd } = useMemo(() => buildPrevRange(periodType, sel, year), [periodType, sel, year]);

  // ── 재무 집계 ────────────────────────────────────────────────────────────
  const periodFin = useMemo(() => financials.filter(f => f.date >= start && f.date <= end), [financials, start, end]);
  const prevFin   = useMemo(() => financials.filter(f => f.date >= prevStart && f.date <= prevEnd), [financials, prevStart, prevEnd]);

  const income   = periodFin.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
  const fixed    = periodFin.filter(f => f.type === 'fixed_expense').reduce((s, f) => s + f.amount, 0);
  const variable = periodFin.filter(f => f.type === 'variable_expense').reduce((s, f) => s + f.amount, 0);
  const net      = income - fixed - variable;
  const margin   = income > 0 ? Math.round(net / income * 100) : 0;

  const prevIncome   = prevFin.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
  const prevFixed    = prevFin.filter(f => f.type === 'fixed_expense').reduce((s, f) => s + f.amount, 0);
  const prevVariable = prevFin.filter(f => f.type === 'variable_expense').reduce((s, f) => s + f.amount, 0);
  const prevNet      = prevIncome - prevFixed - prevVariable;

  const momIncome   = prevIncome   > 0 ? Math.round((income   - prevIncome)   / prevIncome   * 100) : null;
  const momFixed    = prevFixed    > 0 ? Math.round((fixed    - prevFixed)    / prevFixed    * 100) : null;
  const momVariable = prevVariable > 0 ? Math.round((variable - prevVariable) / prevVariable * 100) : null;
  const momNet      = prevNet !== 0   ? Math.round((net - prevNet) / Math.abs(prevNet) * 100) : null;

  // ── 월별 차트 ────────────────────────────────────────────────────────────
  const monthlyChart = useMemo(() => months.map(m => {
    const recs = financials.filter(f => f.date.startsWith(m));
    const inc  = recs.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
    const fix  = recs.filter(f => f.type === 'fixed_expense').reduce((s, f) => s + f.amount, 0);
    const vari = recs.filter(f => f.type === 'variable_expense').reduce((s, f) => s + f.amount, 0);
    return { month: m.slice(5) + '월', 수입: inc, 고정비: fix, 변동비: vari, 순이익: inc - fix - vari };
  }), [months, financials]);

  // ── 재원생 지표 ─────────────────────────────────────────────────────────
  const enrolled          = students.filter(s => s.status === 'enrolled');
  const newInPeriod       = students.filter(s => s.enrollDate >= start && s.enrollDate <= end);
  const withdrawnInPeriod = students.filter(s => s.withdrawDate && s.withdrawDate >= start && s.withdrawDate <= end);
  const unpaidList        = enrolled.filter(s => !s.tuitionPaid);
  const enrolledCount     = enrolled.length;
  const arpu              = enrolledCount > 0 ? Math.round(income / enrolledCount) : 0;
  const netChange         = newInPeriod.length - withdrawnInPeriod.length;
  const withdrawalRate    = (enrolledCount + withdrawnInPeriod.length) > 0
    ? Math.round(withdrawnInPeriod.length / (enrolledCount + withdrawnInPeriod.length) * 100) : 0;

  // ── 강사 효율 ────────────────────────────────────────────────────────────
  const teachers = users.filter(u => u.role === 'teacher').sort((a, b) => (a.joinDate ?? '').localeCompare(b.joinDate ?? ''));
  const teacherRows = teachers.map(t => {
    const tClasses = classes.filter(c => c.teacherId === t.id);
    const stuIds   = new Set(tClasses.flatMap(c => c.studentIds as string[]));
    return { name: t.name, classes: tClasses.length, students: stuIds.size };
  });

  // ── 반별 인원 현황 ──────────────────────────────────────────────────────
  const classRows = [...classes]
    .sort((a, b) => (b.studentIds as string[]).length - (a.studentIds as string[]).length)
    .map(cls => ({
      name: cls.name, students: (cls.studentIds as string[]).length,
      teacher: users.find(u => u.id === cls.teacherId)?.name ?? '-',
    }));

  // ── 손익분기점 ──────────────────────────────────────────────────────────
  const incomePerStu    = enrolledCount > 0 ? income / enrolledCount : 0;
  const breakEvenCount  = incomePerStu > 0 ? Math.ceil(fixed / incomePerStu) : 0;
  const breakEvenStatus = enrolledCount >= breakEvenCount && breakEvenCount > 0;

  // ── 마케팅 효율 ─────────────────────────────────────────────────────────
  const periodConsultations = consultations.filter(c => c.date >= start && c.date <= end);
  const sourceData = useMemo(() => {
    const map: Record<string, { total: number; reg: number }> = {};
    periodConsultations.forEach(c => {
      if (!map[c.source]) map[c.source] = { total: 0, reg: 0 };
      map[c.source].total++;
      if (c.result === 'registered') map[c.source].reg++;
    });
    return Object.entries(map)
      .map(([source, v]) => ({ source, total: v.total, reg: v.reg, rate: Math.round(v.reg / v.total * 100) }))
      .sort((a, b) => b.reg - a.reg);
  }, [periodConsultations]);

  // ── 개선 시나리오 ────────────────────────────────────────────────────────
  const scenarios = useMemo(() => {
    if (income === 0) return [];
    return [
      { icon: '👥', title: '학생 5명 추가 모집', desc: `현 ARPU ${formatKRW(arpu)} 기준`, after: income + arpu * 5 - fixed - variable, delta: arpu * 5, color: '#2563EB', bg: '#EFF6FF' },
      { icon: '✂️', title: '변동비 10% 절감',   desc: `절감액 ${formatKRW(Math.round(variable * 0.1))}`,  after: income - fixed - variable * 0.9,   delta: Math.round(variable * 0.1),  color: '#7C3AED', bg: '#F5F3FF' },
      { icon: '📈', title: '수강료 5% 인상',    desc: `추가 수입 ${formatKRW(Math.round(income * 0.05))}`, after: income * 1.05 - fixed - variable, delta: Math.round(income * 0.05), color: '#16A34A', bg: '#F0FDF4' },
    ];
  }, [income, arpu, fixed, variable]);

  // ── 상세 레코드 ─────────────────────────────────────────────────────────
  const incRecs = useMemo(() => periodFin.filter(f => f.type === 'income').sort((a, b) => a.date.localeCompare(b.date)), [periodFin]);
  const fixRecs = useMemo(() => periodFin.filter(f => f.type === 'fixed_expense').sort((a, b) => a.date.localeCompare(b.date)), [periodFin]);
  const varRecs = useMemo(() => periodFin.filter(f => f.type === 'variable_expense').sort((a, b) => a.date.localeCompare(b.date)), [periodFin]);

  const startEdit  = (rec: FinancialRecord) => { setEditingId(rec.id); setDraftEdit({ ...rec }); };
  const cancelEdit = () => { setEditingId(null); setDraftEdit({}); };
  const saveEdit   = () => {
    if (!editingId) return;
    setFinancials(prev => prev.map(f => f.id === editingId ? { ...f, ...draftEdit } as FinancialRecord : f));
    setEditingId(null); setDraftEdit({});
  };
  const deleteRec = (id: string) => {
    if (window.confirm('이 내역을 삭제하시겠습니까?')) {
      setFinancials(prev => prev.filter(f => f.id !== id));
      if (editingId === id) { setEditingId(null); setDraftEdit({}); }
    }
  };
  const handleAddRecord = () => {
    if (!newRecord.category || !newRecord.amount || !newRecord.date) { alert('항목, 금액, 날짜를 모두 입력해주세요.'); return; }
    setFinancials(prev => [...prev, {
      id: `fin-${Date.now()}`,
      type: (newRecord.type as FinancialRecord['type']) ?? 'income',
      category: newRecord.category!, amount: newRecord.amount!,
      date: newRecord.date!, description: newRecord.description ?? '',
    }]);
    setShowAddModal(false);
    setNewRecord({ type: 'income', date: monthSel + '-01' });
  };

  // ── AI 인사이트 ─────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list: { type: 'good' | 'warn' | 'bad' | 'info'; text: string }[] = [];
    if (income === 0) { list.push({ type: 'info', text: '선택 기간에 재무 데이터가 없습니다. 내역 추가 버튼으로 데이터를 입력해 주세요.' }); return list; }
    if (margin >= criteria.marginGood) list.push({ type: 'good', text: `영업이익률 ${margin}% — 수익 구조가 안정적입니다.` });
    else if (margin >= criteria.marginWarn) list.push({ type: 'warn', text: `영업이익률 ${margin}% — 변동비(${formatKRW(variable)}) 절감을 검토하세요.` });
    else list.push({ type: 'bad', text: `영업이익률 ${margin}% — 고정비·변동비 전면 재검토가 필요합니다.` });
    if (momIncome !== null) {
      if (momIncome > 0) list.push({ type: 'good', text: `전기 대비 수입 +${momIncome}% 증가 (${formatKRW(prevIncome)} → ${formatKRW(income)}).` });
      else if (momIncome < 0) list.push({ type: 'warn', text: `전기 대비 수입 ${momIncome}% 감소 (${formatKRW(prevIncome)} → ${formatKRW(income)}). 신규 등록 강화 필요.` });
    }
    if (momFixed !== null && momFixed > 5) list.push({ type: 'warn', text: `전기 대비 고정비 +${momFixed}% 증가 (${formatKRW(prevFixed)} → ${formatKRW(fixed)}). 항목별 원인 파악 필요.` });
    if (momNet !== null && momNet < -10) list.push({ type: 'bad', text: `전기 대비 순이익 ${momNet}% 급감 (${formatKRW(prevNet)} → ${formatKRW(net)}). 원가 구조 점검 필요.` });
    if (breakEvenCount > 0) {
      if (breakEvenStatus) list.push({ type: 'good', text: `손익분기점 달성 ✓ — 재원생 ${enrolledCount}명 (기준 ${breakEvenCount}명).` });
      else list.push({ type: 'bad', text: `손익분기점 미달 — ${breakEvenCount - enrolledCount}명 추가 모집 시 흑자 전환 가능.` });
    }
    if (withdrawalRate === 0 && withdrawnInPeriod.length === 0) list.push({ type: 'good', text: '기간 내 퇴원생 없음 — 우수한 유지율입니다.' });
    else if (withdrawalRate <= criteria.withdrawInfo) list.push({ type: 'info', text: `이탈률 ${withdrawalRate}% — 양호한 수준이나 지속 모니터링이 필요합니다.` });
    else if (withdrawalRate <= criteria.withdrawWarn) list.push({ type: 'warn', text: `이탈률 ${withdrawalRate}% (${withdrawnInPeriod.length}명 퇴원) — 학부모 소통 강화를 권장합니다.` });
    else list.push({ type: 'bad', text: `이탈률 ${withdrawalRate}%로 위험 수준 — 즉각적인 원인 분석이 필요합니다.` });
    if (netChange > 0) list.push({ type: 'good', text: `학생 순증감 +${netChange}명 (신규 ${newInPeriod.length}명 / 퇴원 ${withdrawnInPeriod.length}명).` });
    else if (netChange < 0) list.push({ type: 'warn', text: `학생 순감소 ${netChange}명 — 신규 모집 강화가 필요합니다.` });
    if (arpu > 0) list.push({ type: 'info', text: `학생 1인당 평균 수강료(ARPU): ${formatKRW(arpu)}.` });
    if (unpaidList.length > 0) {
      const est = arpu > 0 ? unpaidList.length * arpu : 0;
      list.push({ type: 'warn', text: `수강료 미납 ${unpaidList.length}명 (${unpaidList.map(s => s.name).join(', ')})${est > 0 ? ` — 추정 미수금 ${formatKRW(est)}` : ''}.` });
    }
    if (sourceData.length > 0) {
      const top = sourceData[0];
      list.push({ type: 'info', text: `최고 효율 유입 채널: "${top.source}" — 전환율 ${top.rate}% (상담 ${top.total}건 → 등록 ${top.reg}명).` });
    }
    const fixedRatio = income > 0 ? Math.round(fixed / income * 100) : 0;
    if (fixedRatio > criteria.fixedBad) list.push({ type: 'bad', text: `고정비 비율 ${fixedRatio}% — 매우 높습니다. 인건비·임차료 구조 재검토를 권장합니다.` });
    else if (fixedRatio > criteria.fixedWarn) list.push({ type: 'warn', text: `고정비 비율 ${fixedRatio}% — 재원생 확대로 고정비 레버리지 효과를 노리세요.` });
    return list;
  }, [income, margin, fixed, variable, breakEvenStatus, breakEvenCount, enrolledCount, withdrawalRate,
      withdrawnInPeriod, newInPeriod, netChange, arpu, unpaidList, sourceData,
      momIncome, momFixed, momNet, prevIncome, prevFixed, prevNet, net, criteria]);

  const periodLabel = periodType === 'monthly' ? monthSel
    : periodType === 'quarterly' ? `${year}년 Q${quarterSel}`
    : periodType === 'semiannual' ? `${year}년 ${halfSel === '1' ? '상반기' : '하반기'}`
    : `${year}년 전체`;

  const prevLabel = periodType === 'monthly'
    ? (() => { const [y, m] = monthSel.split('-').map(Number); const pm = m === 1 ? 12 : m - 1; const py = m === 1 ? y - 1 : y; return `${py}-${String(pm).padStart(2,'0')}`; })()
    : periodType === 'quarterly' ? `${Number(quarterSel) === 1 ? year - 1 : year}년 Q${Number(quarterSel) === 1 ? 4 : Number(quarterSel) - 1}`
    : periodType === 'semiannual' ? (halfSel === '1' ? `${year - 1}년 하반기` : `${year}년 상반기`)
    : `${year - 1}년 전체`;

  // ── 상세내역 렌더링 ─────────────────────────────────────────────────────
  const renderDetailSection = (
    title: string, items: FinancialRecord[], total: number,
    hBg: string, hBorder: string, hTitle: string, hSub: string,
  ) => (
    <div className="card-section">
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: hBg, borderBottom: `1px solid ${hBorder}` }}>
        <div>
          <h3 className="font-bold text-sm" style={{ color: hTitle }}>{title}</h3>
          <p className="text-xs mt-0.5" style={{ color: hSub }}>{formatKRW(total)} · {items.length}건</p>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: hBorder, color: hTitle }}>클릭하여 편집</span>
      </div>
      <div className="divide-y" style={{ borderColor: '#F1F5F9' }}>
        {items.length === 0
          ? <div className="px-4 py-3 text-xs" style={{ color: '#CBD5E1' }}>내역 없음</div>
          : items.map(item => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="px-3 py-3" style={{ background: '#FAFBFF', borderLeft: '3px solid #4F46E5' }}>
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    <div>
                      <div className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>날짜</div>
                      <input type="date" className="w-full px-2 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid #C7D2FE', outline: 'none', color: '#334155' }}
                        value={draftEdit.date ?? ''} onChange={e => setDraftEdit(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>항목</div>
                      <select className="w-full px-2 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid #C7D2FE', outline: 'none', color: '#334155' }}
                        value={draftEdit.category ?? ''} onChange={e => setDraftEdit(p => ({ ...p, category: e.target.value }))}>
                        {getCatOptions(item.type).map(c => <option key={c} value={c}>{c}</option>)}
                        {draftEdit.category && !getCatOptions(item.type).includes(draftEdit.category) && (
                          <option value={draftEdit.category}>{draftEdit.category}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>금액 (원)</div>
                      <input type="number" className="w-full px-2 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid #C7D2FE', outline: 'none', color: '#334155' }}
                        value={draftEdit.amount ?? ''} onChange={e => setDraftEdit(p => ({ ...p, amount: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold mb-1" style={{ color: '#94A3B8' }}>설명</div>
                      <input className="w-full px-2 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid #C7D2FE', outline: 'none', color: '#334155' }}
                        value={draftEdit.description ?? ''} onChange={e => setDraftEdit(p => ({ ...p, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => deleteRec(item.id)} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: '#FEF2F2', color: '#EF4444' }}>삭제</button>
                    <button onClick={cancelEdit} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: '#F1F5F9', color: '#64748B' }}>취소</button>
                    <button onClick={saveEdit} className="text-[11px] px-3 py-1 rounded-lg font-semibold" style={{ background: '#4F46E5', color: '#fff' }}>저장</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => startEdit(item)}
                  className="flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium" style={{ color: '#374151' }}>{item.category}</span>
                    {item.description && <span className="ml-2 text-xs" style={{ color: '#94A3B8' }}>{item.description}</span>}
                    <span className="ml-2 text-[10px]" style={{ color: '#CBD5E1' }}>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: '#1E293B' }}>{formatKRW(item.amount)}</span>
                    <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6366F1' }}>✏️</span>
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">재무 관리</h1>
          <p className="page-subtitle">{periodLabel} · 수입/지출 입력 및 재무 현황 확인</p>
        </div>

        {/* 기간 선택 (우상단) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">+ 내역 추가</button>

          <select className="form-select text-xs font-semibold" value={year}
            onChange={e => { setYear(Number(e.target.value)); setMonthSel(`${e.target.value}-04`); }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>

          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: '#E2E8F0' }}>
            {(['monthly', 'quarterly', 'semiannual', 'annual'] as PeriodType[]).map(p => (
              <button key={p} onClick={() => setPeriodType(p)}
                className="text-xs font-medium px-3 py-1.5 transition-all"
                style={periodType === p ? { background: '#4F46E5', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
                {p === 'monthly' ? '월' : p === 'quarterly' ? '분기' : p === 'semiannual' ? '반기' : '연간'}
              </button>
            ))}
          </div>

          {periodType === 'monthly' && (
            <select className="form-select text-xs" value={monthSel} onChange={e => setMonthSel(e.target.value)}>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                <option key={m} value={`${year}-${m}`}>{year}년 {Number(m)}월</option>
              ))}
            </select>
          )}
          {periodType === 'quarterly' && (
            <select className="form-select text-xs" value={quarterSel} onChange={e => setQuarterSel(e.target.value)}>
              {[1,2,3,4].map(q => <option key={q} value={q}>Q{q} ({(q-1)*3+1}~{q*3}월)</option>)}
            </select>
          )}
          {periodType === 'semiannual' && (
            <select className="form-select text-xs" value={halfSel} onChange={e => setHalfSel(e.target.value)}>
              <option value="1">상반기 (1~6월)</option>
              <option value="2">하반기 (7~12월)</option>
            </select>
          )}
        </div>
      </div>

      {/* ── 핵심 지표 ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: '총 수입', value: formatKRW(income),  sub: `고정비+변동비 ${formatKRW(fixed + variable)}`, color: '#2563EB', mom: momIncome },
          { label: '고정비',  value: formatKRW(fixed),   sub: `수입 대비 ${income > 0 ? Math.round(fixed / income * 100) : 0}%`, color: '#F97316', mom: momFixed },
          { label: '변동비',  value: formatKRW(variable),sub: `수입 대비 ${income > 0 ? Math.round(variable / income * 100) : 0}%`, color: '#EAB308', mom: momVariable },
          { label: '순이익',  value: (net >= 0 ? '+' : '') + formatKRW(net), sub: `영업이익률 ${margin}%`, color: net >= 0 ? '#16A34A' : '#EF4444', mom: momNet },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>{item.label}</div>
            <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs" style={{ color: '#CBD5E1' }}>{item.sub}</div>
              {item.mom !== null && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: item.mom > 0 ? '#DCFCE7' : item.mom < 0 ? '#FEE2E2' : '#F1F5F9',
                    color: item.mom > 0 ? '#15803D' : item.mom < 0 ? '#991B1B' : '#64748B',
                  }}>
                  {item.mom > 0 ? '▲' : item.mom < 0 ? '▼' : '–'} {Math.abs(item.mom)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── 전기 대비 비교 ─────────────────────────────────────────────────── */}
      {prevIncome > 0 && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📊</span>
            <h3 className="text-sm font-bold" style={{ color: '#1E293B' }}>전기 대비 성과 비교</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#F1F5F9', color: '#64748B' }}>{prevLabel} 대비</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: '수입',  cur: income,   prev: prevIncome,   color: '#2563EB' },
              { label: '고정비', cur: fixed,   prev: prevFixed,    color: '#F97316' },
              { label: '변동비', cur: variable, prev: prevVariable, color: '#EAB308' },
              { label: '순이익', cur: net,     prev: prevNet,      color: net >= 0 ? '#16A34A' : '#EF4444' },
            ].map(c => {
              const delta = c.cur - c.prev;
              const pct = c.prev !== 0 ? Math.round(delta / Math.abs(c.prev) * 100) : null;
              return (
                <div key={c.label} className="rounded-xl p-3" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <div className="text-[11px] mb-1.5" style={{ color: '#94A3B8' }}>{c.label}</div>
                  <div className="text-sm font-bold" style={{ color: c.color }}>{formatKRW(c.cur)}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px]" style={{ color: '#CBD5E1' }}>{formatKRW(c.prev)}</span>
                    {pct !== null && (
                      <span className="text-[10px] font-semibold" style={{ color: pct > 0 ? '#16A34A' : pct < 0 ? '#EF4444' : '#94A3B8' }}>
                        {pct > 0 ? '▲' : pct < 0 ? '▼' : '–'}{Math.abs(pct)}%
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] mt-0.5 font-medium" style={{ color: delta >= 0 ? '#16A34A' : '#EF4444' }}>
                    {fmtDelta(delta)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 재원생 지표 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: '현 재원생', value: `${enrolledCount}명`,                    color: '#334155' },
          { label: '신규 등록', value: `+${newInPeriod.length}명`,              color: '#2563EB' },
          { label: '퇴원',      value: `${withdrawnInPeriod.length}명`,         color: '#EF4444' },
          { label: '순증감',    value: `${netChange >= 0 ? '+' : ''}${netChange}명`, color: netChange >= 0 ? '#16A34A' : '#EF4444' },
          { label: 'ARPU',      value: arpu > 0 ? formatKRW(arpu) : '—',       color: '#7C3AED' },
          { label: '미납',      value: `${unpaidList.length}명`,                color: unpaidList.length > 0 ? '#F59E0B' : '#16A34A' },
        ].map(item => (
          <div key={item.label} className="card p-3 text-center">
            <div className="text-base font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* ── AI 재무 인사이트 ───────────────────────────────────────────────── */}
      <div className="card p-4 mb-5" style={{ borderLeft: '4px solid #4F46E5' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <h3 className="text-sm font-bold" style={{ color: '#1E293B' }}>AI 재무 인사이트</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#EEF2FF', color: '#4F46E5' }}>{periodLabel}</span>
            {/* ? 버튼 + 툴팁 */}
            <div className="relative">
              <span
                onClick={() => setShowCriteriaTooltip(v => !v)}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold cursor-pointer select-none"
                style={{ background: showCriteriaTooltip ? '#4F46E5' : '#E2E8F0', color: showCriteriaTooltip ? '#fff' : '#94A3B8' }}>?</span>
              {showCriteriaTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 top-6 z-50 w-[340px] rounded-xl shadow-xl p-4 text-xs"
                  style={{ background: '#1E293B', color: '#F1F5F9' }}>
                  {/* 도출 근거 설명 */}
                  <div className="mb-3">
                    <div className="font-bold mb-1.5" style={{ color: '#A5B4FC' }}>📐 인사이트 도출 근거</div>
                    <ul className="space-y-1" style={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                      <li>• <b style={{ color: '#F1F5F9' }}>영업이익률</b> = (수입 − 고정비 − 변동비) ÷ 수입 × 100</li>
                      <li>• <b style={{ color: '#F1F5F9' }}>고정비 비율</b> = 고정비 ÷ 수입 × 100</li>
                      <li>• <b style={{ color: '#F1F5F9' }}>이탈률</b> = 퇴원 수 ÷ (재원생 + 퇴원 수) × 100</li>
                      <li>• <b style={{ color: '#F1F5F9' }}>손익분기점</b> = 고정비 ÷ 학생 1인당 수입(ARPU)</li>
                      <li>• <b style={{ color: '#F1F5F9' }}>전기 대비</b> = 직전 동일 기간 대비 증감률</li>
                    </ul>
                  </div>
                  {/* 평가 기준 표 */}
                  <div className="font-bold mb-1.5" style={{ color: '#A5B4FC' }}>📊 현재 적용 기준</div>
                  <table className="w-full border-collapse mb-3" style={{ fontSize: 10.5 }}>
                    <thead>
                      <tr style={{ color: '#94A3B8' }}>
                        <th className="text-left pb-1">지표</th>
                        <th className="text-center pb-1">🟢 양호</th>
                        <th className="text-center pb-1">🟡 주의</th>
                        <th className="text-center pb-1">🔴 위험</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: '#CBD5E1' }}>
                      <tr className="border-t border-white/10">
                        <td className="py-1 pr-2">영업이익률</td>
                        <td className="text-center">≥ {criteria.marginGood}%</td>
                        <td className="text-center">{criteria.marginWarn}~{criteria.marginGood}%</td>
                        <td className="text-center">&lt; {criteria.marginWarn}%</td>
                      </tr>
                      <tr className="border-t border-white/10">
                        <td className="py-1 pr-2">고정비 비율</td>
                        <td className="text-center">≤ {criteria.fixedWarn}%</td>
                        <td className="text-center">{criteria.fixedWarn}~{criteria.fixedBad}%</td>
                        <td className="text-center">&gt; {criteria.fixedBad}%</td>
                      </tr>
                      <tr className="border-t border-white/10">
                        <td className="py-1 pr-2">이탈률</td>
                        <td className="text-center">≤ {criteria.withdrawInfo}%</td>
                        <td className="text-center">{criteria.withdrawInfo}~{criteria.withdrawWarn}%</td>
                        <td className="text-center">&gt; {criteria.withdrawWarn}%</td>
                      </tr>
                      <tr className="border-t border-white/10">
                        <td className="py-1 pr-2">손익분기점</td>
                        <td className="text-center">달성</td>
                        <td className="text-center" colSpan={2}>미달성</td>
                      </tr>
                    </tbody>
                  </table>
                  {/* 기준 편집 버튼 */}
                  <button
                    onClick={() => { setDraftCriteria({ ...criteria }); setShowCriteriaEdit(true); setShowCriteriaTooltip(false); }}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: '#4F46E5', color: '#fff' }}>
                    ✏️ 평가 기준 수정하기
                  </button>
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45" style={{ background: '#1E293B' }} />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {insights.map((ins, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: INSIGHT_BG[ins.type] }}>
              <span className="flex-shrink-0 mt-0.5">{INSIGHT_ICON[ins.type]}</span>
              <span style={{ color: INSIGHT_COLOR[ins.type], lineHeight: 1.6 }}>{ins.text}</span>
            </div>
          ))}
        </div>

        {/* 총평 */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-semibold" style={{ color: '#94A3B8' }}>담당자 총평</div>
            {!editingComment ? (
              <button onClick={() => { setDraftComment(comment); setEditingComment(true); }}
                className="text-xs px-2.5 py-1 rounded-lg" style={{ background: '#EEF2FF', color: '#4F46E5' }}>✏️ 편집</button>
            ) : (
              <div className="flex gap-1.5">
                <button onClick={() => { setComment(draftComment); setEditingComment(false); }}
                  className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background: '#4F46E5', color: '#fff' }}>저장</button>
                <button onClick={() => setEditingComment(false)}
                  className="text-xs px-2.5 py-1 rounded-lg" style={{ background: '#F1F5F9', color: '#64748B' }}>취소</button>
              </div>
            )}
          </div>
          {editingComment ? (
            <textarea className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ border: '1px solid #C7D2FE', outline: 'none', minHeight: 72 }}
              placeholder="이번 기간 재무 현황에 대한 총평을 입력하세요..."
              value={draftComment} onChange={e => setDraftComment(e.target.value)} rows={3} autoFocus />
          ) : comment ? (
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#334155', lineHeight: 1.7 }}>{comment}</p>
          ) : (
            <p className="text-sm" style={{ color: '#CBD5E1' }}>총평을 입력하려면 편집 버튼을 클릭하세요.</p>
          )}
        </div>
      </div>

      {/* ── 수익 개선 시나리오 ─────────────────────────────────────────────── */}
      {scenarios.length > 0 && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🎯</span>
            <h3 className="text-sm font-bold" style={{ color: '#1E293B' }}>수익 개선 시나리오</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#FFF7ED', color: '#C2410C' }}>시뮬레이션</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {scenarios.map(sc => (
              <div key={sc.title} className="rounded-xl p-4" style={{ background: sc.bg }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{sc.icon}</span>
                  <div>
                    <div className="text-xs font-bold" style={{ color: sc.color }}>{sc.title}</div>
                    <div className="text-[10px]" style={{ color: '#94A3B8' }}>{sc.desc}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#64748B' }}>현재 순이익</span>
                    <span className="font-semibold" style={{ color: net >= 0 ? '#16A34A' : '#EF4444' }}>{formatKRW(net)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-1.5" style={{ borderColor: '#E2E8F0' }}>
                    <span style={{ color: '#64748B' }}>개선 후 순이익</span>
                    <span className="font-bold" style={{ color: sc.after >= 0 ? '#16A34A' : '#EF4444' }}>{formatKRW(Math.round(sc.after))}</span>
                  </div>
                  <div className="text-center text-xs font-bold py-1 rounded-lg mt-1" style={{ background: sc.color, color: '#fff' }}>
                    +{formatKRW(sc.delta)} 순이익 증가
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 차트 ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>월별 수입/지출 현황</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyChart} margin={{ left: -10, top: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={formatMan} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={v => formatKRW(Number(v))} />
              <Bar dataKey="수입"  fill="#3B82F6" radius={[4,4,0,0]}>
                <LabelList dataKey="수입" position="top" style={{ fontSize: 9, fill: '#64748B' }} formatter={(v: unknown) => Number(v) > 0 ? formatMan(Number(v)) : ''} />
              </Bar>
              <Bar dataKey="고정비" fill="#F97316" radius={[4,4,0,0]} />
              <Bar dataKey="변동비" fill="#EAB308" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {[{label:'수입',color:'#3B82F6'},{label:'고정비',color:'#F97316'},{label:'변동비',color:'#EAB308'}].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>월별 순이익 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyChart} margin={{ left: -10, top: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickFormatter={formatMan} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} formatter={v => formatKRW(Number(v))} />
              <Line type="monotone" dataKey="순이익" stroke="#10B981" strokeWidth={2.5}
                dot={{ r: 4, fill: '#10B981' }} label={{ position: 'top', fontSize: 10, fill: '#64748B', formatter: (v: unknown) => Number(v) !== 0 ? formatMan(Number(v)) : '' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 수익성 분석 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {/* 손익분기점 */}
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>손익분기점 분석</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>고정비</span><span className="font-semibold" style={{ color: '#F97316' }}>{formatKRW(fixed)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: '#64748B' }}>1인당 수익 (ARPU)</span><span className="font-semibold" style={{ color: '#2563EB' }}>{arpu > 0 ? formatKRW(arpu) : '—'}</span></div>
            <div className="flex justify-between text-sm border-t pt-3" style={{ borderColor: '#F1F5F9' }}>
              <span style={{ color: '#64748B' }}>BEP 학생 수</span>
              <span className="font-bold text-base" style={{ color: '#7C3AED' }}>{breakEvenCount > 0 ? `${breakEvenCount}명` : '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: '#64748B' }}>현재 재원생</span>
              <span className="font-bold text-base" style={{ color: breakEvenStatus ? '#16A34A' : '#EF4444' }}>{enrolledCount}명</span>
            </div>
            {breakEvenCount > 0 && (
              <div>
                <div className="h-2.5 rounded-full overflow-hidden mt-1" style={{ background: '#F1F5F9' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round(enrolledCount / breakEvenCount * 100))}%`, background: breakEvenStatus ? '#22C55E' : '#F59E0B' }} />
                </div>
                <div className="text-xs mt-1 text-right" style={{ color: '#94A3B8' }}>
                  {Math.round(enrolledCount / breakEvenCount * 100)}% 달성{!breakEvenStatus && ` · ${breakEvenCount - enrolledCount}명 부족`}
                </div>
              </div>
            )}
            {income > 0 && (
              <div className="pt-2 border-t" style={{ borderColor: '#F1F5F9' }}>
                <div className="text-[10px] font-semibold mb-1.5" style={{ color: '#94A3B8' }}>비용 구조 비율</div>
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div style={{ width: `${Math.round(fixed/income*100)}%`, background: '#F97316' }} />
                  <div style={{ width: `${Math.round(variable/income*100)}%`, background: '#EAB308' }} />
                  <div style={{ width: `${Math.max(0, Math.round(net/income*100))}%`, background: '#22C55E' }} />
                </div>
                <div className="flex justify-between text-[9px] mt-1" style={{ color: '#94A3B8' }}>
                  <span>고정비 {Math.round(fixed/income*100)}%</span>
                  <span>변동비 {Math.round(variable/income*100)}%</span>
                  <span style={{ color: net >= 0 ? '#16A34A' : '#EF4444' }}>이익 {margin}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 선생님 효율 */}
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>선생님 효율</h3>
          <div className="space-y-2.5">
            {teacherRows.length === 0 ? (
              <div className="text-xs" style={{ color: '#CBD5E1' }}>선생님 데이터 없음</div>
            ) : teacherRows.map(t => {
              const pct = enrolledCount > 0 ? Math.round(t.students / enrolledCount * 100) : 0;
              const stuIncome = arpu > 0 ? t.students * arpu : 0;
              return (
                <div key={t.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: '#1E293B' }}>{t.name}</span>
                    <span style={{ color: '#64748B' }}>담당반 {t.classes}개 · 학생 {t.students}명</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#6366F1' }} />
                  </div>
                  {stuIncome > 0 && <div className="text-[10px] mt-0.5 text-right" style={{ color: '#94A3B8' }}>담당 수강료 기여 {formatKRW(stuIncome)}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 반별 정원 현황 */}
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>반별 정원 현황</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {classRows.map(cls => (
              <div key={cls.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#8B5CF6' }} />
                <span className="flex-1 truncate font-medium" style={{ color: '#1E293B' }}>{cls.name}</span>
                <span style={{ color: '#64748B' }}>{cls.teacher}</span>
                <span className="font-bold" style={{ color: cls.students >= 8 ? '#16A34A' : cls.students >= 5 ? '#F59E0B' : '#EF4444' }}>{cls.students}명</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] mt-2" style={{ color: '#CBD5E1' }}>🟢 8명+ 양호  🟡 5~7명 보통  🔴 5명 미만 부족</div>
        </div>
      </div>

      {/* ── 마케팅 효율 ────────────────────────────────────────────────────── */}
      {sourceData.length > 0 && (
        <div className="card p-4 mb-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>마케팅 채널별 효율 (상담 기준)</h3>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead><tr><th>유입 채널</th><th className="text-center">상담 수</th><th className="text-center">등록 수</th><th className="text-center">전환율</th><th>효율 평가</th></tr></thead>
              <tbody>
                {sourceData.map(s => (
                  <tr key={s.source}>
                    <td className="font-medium text-xs" style={{ color: '#1E293B' }}>{s.source}</td>
                    <td className="text-center text-xs" style={{ color: '#64748B' }}>{s.total}건</td>
                    <td className="text-center text-xs font-semibold" style={{ color: '#2563EB' }}>{s.reg}명</td>
                    <td className="text-center">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: s.rate >= 50 ? '#DCFCE7' : s.rate >= 30 ? '#FEF9C3' : '#FEE2E2', color: s.rate >= 50 ? '#15803D' : s.rate >= 30 ? '#92400E' : '#991B1B' }}>
                        {s.rate}%
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: '#94A3B8' }}>{s.rate >= 50 ? '🟢 집중 투자 권장' : s.rate >= 30 ? '🟡 유지' : '🔴 효율 개선 필요'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 상세 내역 (클릭 편집) ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderDetailSection('수입 내역',  incRecs, income,   '#EFF6FF', '#BFDBFE', '#1D4ED8', '#3B82F6')}
        {renderDetailSection('고정비 내역', fixRecs, fixed,   '#FFF7ED', '#FED7AA', '#C2410C', '#F97316')}
        {renderDetailSection('변동비 내역', varRecs, variable, '#FEFCE8', '#FEF08A', '#A16207', '#EAB308')}
      </div>

      {/* ── 인사이트 기준 편집 모달 ────────────────────────────────────────── */}
      {showCriteriaEdit && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-base mb-1" style={{ color: '#1E293B' }}>인사이트 평가 기준 수정</h2>
            <p className="text-xs mb-4" style={{ color: '#94A3B8' }}>저장 시 AI 인사이트 평가에 즉시 반영됩니다. 관리자 페이지와 동일한 기준이 적용됩니다.</p>
            <div className="space-y-4">
              {/* 영업이익률 */}
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>영업이익률</div>
                <p className="text-[11px] mb-2" style={{ color: '#94A3B8' }}>= (수입 − 고정비 − 변동비) ÷ 수입 × 100. 수익성의 핵심 지표입니다.</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs" style={{ color: '#64748B' }}>🟢 양호 기준 (% 이상)
                    <input type="number" className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={draftCriteria.marginGood} onChange={e => setDraftCriteria(p => ({ ...p, marginGood: Number(e.target.value) }))} />
                  </label>
                  <label className="text-xs" style={{ color: '#64748B' }}>🟡 주의 기준 (% 이상)
                    <input type="number" className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={draftCriteria.marginWarn} onChange={e => setDraftCriteria(p => ({ ...p, marginWarn: Number(e.target.value) }))} />
                  </label>
                </div>
              </div>
              {/* 고정비 비율 */}
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>고정비 비율</div>
                <p className="text-[11px] mb-2" style={{ color: '#94A3B8' }}>= 고정비 ÷ 수입 × 100. 비율이 높을수록 손익분기점이 높아집니다.</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs" style={{ color: '#64748B' }}>🟡 주의 기준 (% 초과)
                    <input type="number" className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={draftCriteria.fixedWarn} onChange={e => setDraftCriteria(p => ({ ...p, fixedWarn: Number(e.target.value) }))} />
                  </label>
                  <label className="text-xs" style={{ color: '#64748B' }}>🔴 위험 기준 (% 초과)
                    <input type="number" className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={draftCriteria.fixedBad} onChange={e => setDraftCriteria(p => ({ ...p, fixedBad: Number(e.target.value) }))} />
                  </label>
                </div>
              </div>
              {/* 이탈률 */}
              <div>
                <div className="text-xs font-semibold mb-1.5" style={{ color: '#475569' }}>이탈률</div>
                <p className="text-[11px] mb-2" style={{ color: '#94A3B8' }}>= 퇴원 수 ÷ (재원생 + 퇴원 수) × 100. 낮을수록 수강생 유지가 잘 되는 것입니다.</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs" style={{ color: '#64748B' }}>🟢 양호 기준 (% 이하)
                    <input type="number" className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={draftCriteria.withdrawInfo} onChange={e => setDraftCriteria(p => ({ ...p, withdrawInfo: Number(e.target.value) }))} />
                  </label>
                  <label className="text-xs" style={{ color: '#64748B' }}>🟡 주의 기준 (% 이하)
                    <input type="number" className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      value={draftCriteria.withdrawWarn} onChange={e => setDraftCriteria(p => ({ ...p, withdrawWarn: Number(e.target.value) }))} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDraftCriteria({ ...DEFAULT_CRITERIA })}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">기본값 초기화</button>
              <div className="flex-1" />
              <button onClick={() => setShowCriteriaEdit(false)} className="btn-secondary px-4">취소</button>
              <button onClick={() => { setCriteria({ ...draftCriteria }); setShowCriteriaEdit(false); }} className="btn-primary px-4">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 내역 추가 모달 ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-4">내역 추가</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">유형</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={newRecord.type}
                  onChange={e => setNewRecord(p => ({ ...p, type: e.target.value as FinancialRecord['type'], category: '' }))}>
                  <option value="income">수입</option>
                  <option value="fixed_expense">고정비</option>
                  <option value="variable_expense">변동비</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">항목</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={newRecord.category ?? ''}
                  onChange={e => setNewRecord(p => ({ ...p, category: e.target.value }))}>
                  <option value="">선택하세요</option>
                  {getCatOptions((newRecord.type ?? 'income') as FinancialRecord['type']).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">금액 (원)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="0" value={newRecord.amount ?? ''}
                  onChange={e => setNewRecord(p => ({ ...p, amount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">날짜</label>
                <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={newRecord.date ?? ''}
                  onChange={e => setNewRecord(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">설명</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="내용을 입력하세요" value={newRecord.description ?? ''}
                  onChange={e => setNewRecord(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">취소</button>
              <button onClick={handleAddRecord} className="flex-1 btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
