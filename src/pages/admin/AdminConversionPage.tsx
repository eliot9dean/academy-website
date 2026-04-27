import { useState, useMemo } from 'react';
import { useTableData } from '../../hooks/useTableData';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { ConsultationRecord } from '../../types';

const RESULT_CONFIG = {
  registered: { label: '등록',   bg: '#EFF6FF', text: '#1D4ED8', color: '#3B82F6' },
  pending:    { label: '대기중', bg: '#FEF9C3', text: '#854D0E', color: '#EAB308' },
  declined:   { label: '미등록', bg: '#FEE2E2', text: '#991B1B', color: '#EF4444' },
};

const SOURCE_COLORS = ['#6366F1','#8B5CF6','#EC4899','#F97316','#14B8A6','#06B6D4'];

type RangePreset = '1month' | '3months' | 'custom';

const _d = new Date();
const TODAY = `${_d.getFullYear()}-${String(_d.getMonth()+1).padStart(2,'0')}-${String(_d.getDate()).padStart(2,'0')}`;

const RADIAN = Math.PI / 180;
function renderPieLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props;
  if ((percent as number) < 0.05) return null;
  const r = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.55;
  const x = (cx as number) + r * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + r * Math.sin(-(midAngle as number) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {name} {value}
    </text>
  );
}

function SourceTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; payload: { registered: number; count: number } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const { count, registered } = payload[0].payload;
  const rate = count > 0 ? Math.round(registered / count * 100) : 0;
  return (
    <div className="rounded-lg shadow-lg px-3 py-2 text-xs" style={{ background: '#fff', border: '1px solid #E2E8F0' }}>
      <div className="font-bold mb-1" style={{ color: '#334155' }}>{label}</div>
      <div style={{ color: '#64748B' }}>상담 수: <span className="font-semibold" style={{ color: '#4F46E5' }}>{count}명</span></div>
      <div style={{ color: '#64748B' }}>등록 수: <span className="font-semibold" style={{ color: '#16A34A' }}>{registered}명</span></div>
      <div style={{ color: '#64748B' }}>등록율: <span className="font-semibold" style={{ color: '#F59E0B' }}>{rate}%</span></div>
    </div>
  );
}

function calcStart(preset: RangePreset): string {
  const d = new Date(TODAY);
  if (preset === '1month') { d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); }
  if (preset === '3months') { d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10); }
  return d.toISOString().slice(0, 10);
}

export default function AdminConversionPage() {
  const [consultations, setConsultations] = useTableData<ConsultationRecord>('consultations');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState<Partial<ConsultationRecord>>({});
  const [newRow, setNewRow] = useState<Partial<ConsultationRecord> | null>(null);

  // 차트 범위
  const [rangePreset, setRangePreset] = useState<RangePreset>('3months');
  const [customStart, setCustomStart] = useState('2026-01-01');
  const [customEnd, setCustomEnd] = useState(TODAY);

  const { startDate, endDate } = useMemo(() => {
    if (rangePreset === '1month')  return { startDate: calcStart('1month'),  endDate: TODAY };
    if (rangePreset === '3months') return { startDate: calcStart('3months'), endDate: TODAY };
    return { startDate: customStart, endDate: customEnd };
  }, [rangePreset, customStart, customEnd]);

  const rangeConsultations = useMemo(
    () => consultations
      .filter(c => c.date >= startDate && c.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [consultations, startDate, endDate],
  );

  const total      = rangeConsultations.length;
  const registered = rangeConsultations.filter(c => c.result === 'registered');
  const pending    = rangeConsultations.filter(c => c.result === 'pending');
  const declined   = rangeConsultations.filter(c => c.result === 'declined');
  const contactable = rangeConsultations.filter(c => c.contactForEvents);

  const pieData = [
    { name: '등록',   value: registered.length, color: RESULT_CONFIG.registered.color },
    { name: '대기중', value: pending.length,     color: RESULT_CONFIG.pending.color },
    { name: '미등록', value: declined.length,    color: RESULT_CONFIG.declined.color },
  ].filter(d => d.value > 0);

  const sourceData = useMemo(() => {
    const map: Record<string, { count: number; registered: number }> = {};
    rangeConsultations.forEach(c => {
      if (!map[c.source]) map[c.source] = { count: 0, registered: 0 };
      map[c.source].count++;
      if (c.result === 'registered') map[c.source].registered++;
    });
    return Object.entries(map).map(([source, v]) => ({ source, ...v }));
  }, [rangeConsultations]);

  const startEdit = (c: ConsultationRecord) => { setEditingId(c.id); setEditForm({ ...c }); };
  const saveEdit = () => {
    setConsultations(prev => prev.map(c => c.id === editingId ? { ...c, ...editForm } as ConsultationRecord : c));
    setEditingId(null);
  };
  const handleNewRow = () => {
    setNewRow({ studentName: '', parentName: '', phone: '', date: TODAY, result: 'pending', contactForEvents: false, source: '직접상담', notes: '' });
    setEditingId(null);
  };
  const saveNewRow = () => {
    if (!newRow?.studentName) return;
    const record: ConsultationRecord = {
      id: `c-${Date.now()}`,
      studentName: newRow.studentName ?? '',
      parentName: newRow.parentName ?? '',
      phone: newRow.phone ?? '',
      date: newRow.date ?? TODAY,
      result: (newRow.result as ConsultationRecord['result']) ?? 'pending',
      contactForEvents: newRow.contactForEvents ?? false,
      source: newRow.source ?? '직접상담',
      notes: newRow.notes ?? '',
    };
    setConsultations(prev => [record, ...prev]);
    setNewRow(null);
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">등록전환율</h1>
          <p className="page-subtitle">상담 후 등록 현황 및 잠재 고객 관리</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(['1month', '3months', 'custom'] as RangePreset[]).map(p => (
            <button key={p} onClick={() => setRangePreset(p)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={rangePreset === p ? { background: '#4F46E5', color: '#fff' } : { background: '#F1F5F9', color: '#64748B' }}>
              {p === '1month' ? '1개월' : p === '3months' ? '3개월' : '직접입력'}
            </button>
          ))}
          {rangePreset === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input type="date" className="form-select text-xs py-1" value={customStart} onChange={e => setCustomStart(e.target.value)} />
              <span className="text-xs" style={{ color: '#94A3B8' }}>~</span>
              <input type="date" className="form-select text-xs py-1" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          )}
          <button onClick={() => setShowSmsModal(true)} className="btn-primary">📱 문자 발송</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '총 상담 수',    value: total,               color: '#334155' },
          { label: '등록 완료',     value: registered.length,   color: '#2563EB' },
          { label: '전환율',        value: `${total > 0 ? Math.round(registered.length/total*100) : 0}%`, color: '#16A34A' },
          { label: '관리 필요 인원', value: contactable.length,  color: '#7C3AED' },
        ].map(item => (
          <div key={item.label} className="stat-card text-center">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>상담 결과 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={renderPieLabel}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v, name) => [`${Number(v)}명`, String(name)]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                {d.name} {d.value}명
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>유입 경로별 상담 수</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sourceData} margin={{ left: -15, top: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="source" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
              <Tooltip content={<SourceTooltip />} />
              <Bar dataKey="count" radius={[6,6,0,0]} name="상담 수">
                {sourceData.map((_,i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* List */}
      <div className="card-section">
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: '#F8FAFC', borderBottom: '1px solid #EEF2F7' }}>
          <h3 className="text-sm font-bold" style={{ color: '#1E293B' }}>
            상담 목록
            <span className="ml-2 text-xs font-normal" style={{ color: '#94A3B8' }}>{rangeConsultations.length}건</span>
          </h3>
          <button onClick={handleNewRow}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{ background: '#4F46E5', color: '#fff' }}>
            + 신규등록
          </button>
        </div>
        <table className="data-table w-full">
          <colgroup>
            <col style={{ width: 72 }} /><col style={{ width: 72 }} /><col style={{ width: 110 }} />
            <col style={{ width: 88 }} /><col style={{ width: 90 }} /><col style={{ width: 60 }} />
            <col style={{ width: 60 }} /><col />
          </colgroup>
          <thead>
            <tr>
              <th>학생명</th><th>학부모명</th><th>연락처</th><th>상담일</th>
              <th>유입경로</th><th className="text-center">결과</th>
              <th className="text-center">관리필요</th><th>상담내용</th>
            </tr>
          </thead>
          <tbody>
            {/* 신규등록 빈 행 */}
            {newRow !== null && (
              <tr style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
                <td><input className="form-input py-1 text-xs w-full" placeholder="학생명*" value={newRow.studentName??''} onChange={e => setNewRow(p=>({...p,studentName:e.target.value}))} autoFocus /></td>
                <td><input className="form-input py-1 text-xs w-full" placeholder="학부모명" value={newRow.parentName??''} onChange={e => setNewRow(p=>({...p,parentName:e.target.value}))} /></td>
                <td><input className="form-input py-1 text-xs w-full" placeholder="연락처" value={newRow.phone??''} onChange={e => setNewRow(p=>({...p,phone:e.target.value}))} /></td>
                <td><input type="date" className="form-input py-1 text-xs w-full" value={newRow.date??TODAY} onChange={e => setNewRow(p=>({...p,date:e.target.value}))} /></td>
                <td>
                  <select className="form-select py-1 text-xs w-full" value={newRow.source??'직접상담'} onChange={e => setNewRow(p=>({...p,source:e.target.value}))}>
                    {['직접상담','지인 추천','인터넷 검색','인스타그램','현수막','기타'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="text-center">
                  <select className="form-select py-1 text-xs w-full" value={newRow.result??'pending'} onChange={e => setNewRow(p=>({...p,result:e.target.value as ConsultationRecord['result']}))}>
                    <option value="registered">등록</option><option value="pending">대기중</option><option value="declined">미등록</option>
                  </select>
                </td>
                <td className="text-center"><input type="checkbox" checked={!!newRow.contactForEvents} onChange={e => setNewRow(p=>({...p,contactForEvents:e.target.checked}))} /></td>
                <td>
                  <textarea className="form-input resize-none text-xs py-1 w-full" rows={2} placeholder="상담 내용" value={newRow.notes??''} onChange={e => setNewRow(p=>({...p,notes:e.target.value}))} />
                  <div className="flex gap-1 mt-1">
                    <button onClick={saveNewRow} className="text-xs px-2 py-1 rounded-md" style={{ background: '#4F46E5', color: '#fff' }}>저장</button>
                    <button onClick={() => setNewRow(null)} className="text-xs px-2 py-1 rounded-md" style={{ background: '#F1F5F9', color: '#64748B' }}>취소</button>
                  </div>
                </td>
              </tr>
            )}
            {rangeConsultations.map(c => {
              const isEditing = editingId === c.id;
              const cfg = RESULT_CONFIG[c.result];
              return (
                <tr key={c.id}
                  onClick={() => { if (!isEditing && !newRow) startEdit(c); }}
                  style={{ cursor: isEditing || newRow ? 'default' : 'pointer' }}
                  onMouseEnter={e => { if (!isEditing && !newRow) (e.currentTarget as HTMLElement).style.background = '#F8FAFF'; }}
                  onMouseLeave={e => { if (!isEditing && !newRow) (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <input className="form-input py-1 text-xs w-full" value={editForm.studentName??''} onChange={e => setEditForm(p=>({...p,studentName:e.target.value}))} />
                    : <span className="font-semibold text-xs" style={{ color: '#1E293B' }}>{c.studentName}</span>}
                  </td>
                  <td onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <input className="form-input py-1 text-xs w-full" value={editForm.parentName??''} onChange={e => setEditForm(p=>({...p,parentName:e.target.value}))} />
                    : <span className="text-xs" style={{ color: '#64748B' }}>{c.parentName}</span>}
                  </td>
                  <td onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <input className="form-input py-1 text-xs w-full" value={editForm.phone??''} onChange={e => setEditForm(p=>({...p,phone:e.target.value}))} />
                    : <span className="text-xs" style={{ color: '#64748B' }}>{c.phone}</span>}
                  </td>
                  <td onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <input type="date" className="form-input py-1 text-xs w-full" value={editForm.date??''} onChange={e => setEditForm(p=>({...p,date:e.target.value}))} />
                    : <span className="text-xs" style={{ color: '#94A3B8' }}>{c.date}</span>}
                  </td>
                  <td onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <select className="form-select py-1 text-xs w-full" value={editForm.source??''} onChange={e => setEditForm(p=>({...p,source:e.target.value}))}>
                        {['직접상담','지인 추천','인터넷 검색','인스타그램','현수막','기타'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    : <span className="text-xs" style={{ color: '#64748B' }}>{c.source}</span>}
                  </td>
                  <td className="text-center" onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <select className="form-select py-1 text-xs w-full" value={editForm.result??''} onChange={e => setEditForm(p=>({...p,result:e.target.value as ConsultationRecord['result']}))}>
                        <option value="registered">등록</option><option value="pending">대기중</option><option value="declined">미등록</option>
                      </select>
                    : <span className="badge text-xs" style={{ background: cfg.bg, color: cfg.text }}>{cfg.label}</span>}
                  </td>
                  <td className="text-center" onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <input type="checkbox" checked={!!editForm.contactForEvents} onChange={e => setEditForm(p=>({...p,contactForEvents:e.target.checked}))} />
                    : c.contactForEvents
                      ? <span style={{ color: '#7C3AED', fontWeight: 700 }}>●</span>
                      : <span style={{ color: '#CBD5E1' }}>○</span>}
                  </td>
                  <td onClick={e => isEditing && e.stopPropagation()}>{isEditing
                    ? <>
                        <textarea className="form-input resize-none text-xs py-1 w-full" rows={2} value={editForm.notes??''} onChange={e => setEditForm(p=>({...p,notes:e.target.value}))} />
                        <div className="flex gap-1 mt-1">
                          <button onClick={saveEdit} className="text-xs px-2 py-1 rounded-md" style={{ background: '#EFF6FF', color: '#2563EB' }}>저장</button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded-md" style={{ background: '#F1F5F9', color: '#64748B' }}>취소</button>
                        </div>
                      </>
                    : <span className="text-xs" style={{ color: '#94A3B8' }} title={c.notes}>{c.notes ?? '—'}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-base mb-1" style={{ color: '#0F172A' }}>문자 발송</h2>
            <p className="text-xs mb-3" style={{ color: '#94A3B8' }}>관리 필요 {contactable.length}명에게 발송됩니다</p>
            <div className="rounded-xl p-3 mb-3 text-xs max-h-20 overflow-y-auto" style={{ background: '#F8FAFC', color: '#64748B' }}>
              {contactable.map(c => `${c.studentName}(${c.phone})`).join(', ')}
            </div>
            <textarea className="form-input resize-none" rows={5} placeholder="발송할 메시지를 입력하세요..." value={smsText} onChange={e => setSmsText(e.target.value)} />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowSmsModal(false)} className="flex-1 btn-secondary">취소</button>
              <button onClick={() => { alert(`${contactable.length}명에게 발송되었습니다.`); setShowSmsModal(false); }} className="flex-1 btn-primary">발송하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
