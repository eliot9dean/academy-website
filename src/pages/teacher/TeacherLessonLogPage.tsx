import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTableData } from '../../hooks/useTableData';
import type { ClassInfo, DailyProgress } from '../../types';

// ── 상수 ──────────────────────────────────────────────────────────
const d0 = new Date();
const todayStr = `${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`;
const DAY_MAP: Record<string, number> = { 일:0, 월:1, 화:2, 수:3, 목:4, 금:5, 토:6 };
const DAY_KR = ['일','월','화','수','목','금','토'];

type PeriodPreset = 'day' | 'week' | 'month' | 'custom';
interface EditFields { content: string; homework: string; teacherNote: string; parentMessage: string; }

// ── 유틸 ──────────────────────────────────────────────────────────
function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getClassDatesInRange(cls: ClassInfo, start: string, end: string): string[] {
  const result: string[] = [];
  const cur = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (cur <= endD) {
    if ((cls.days as string[]).some(d => DAY_MAP[d] === cur.getDay())) result.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
function computeRange(period: PeriodPreset, base: string, custEnd: string): [string, string] {
  if (period === 'day')  return [base, base];
  if (period === 'week') {
    const d = new Date(base+'T00:00:00'), day = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - (day===0 ? 6 : day-1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [fmtDate(mon), fmtDate(sun)];
  }
  if (period === 'month') {
    const [y,m] = base.split('-').map(Number);
    return [`${y}-${String(m).padStart(2,'0')}-01`, fmtDate(new Date(y, m, 0))];
  }
  return [base, custEnd];
}

// ── 인라인 셀 textarea ────────────────────────────────────────────
function CellArea({ value, onChange, placeholder, bg, border }:
  { value: string; onChange: (v:string)=>void; placeholder: string; bg?: string; border?: string }) {
  return (
    <textarea
      rows={3}
      className="w-full px-2 py-1.5 text-xs rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all placeholder-gray-300"
      style={{ border:`1px solid ${border ?? '#C7D2FE'}`, background: bg ?? '#fff' }}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function TeacherLessonLogPage() {
  const { currentUser } = useAuth();
  const [dbClasses]                 = useTableData<ClassInfo>('classes');
  const [dbProgress, setDbProgress] = useTableData<DailyProgress>('dailyProgress');

  const myClasses  = useMemo(() => dbClasses.filter(c => c.teacherId === currentUser?.id), [dbClasses, currentUser]);
  const myClassIds = useMemo(() => new Set(myClasses.map(c => c.id)), [myClasses]);

  // ── 테이블 필터·정렬 ──
  const [fClass,   setFClass]   = useState('');
  const [fDate,    setFDate]    = useState('');
  const [fContent, setFContent] = useState('');
  const [fHw,      setFHw]      = useState('');
  const [fNote,    setFNote]    = useState('');
  const [fParent,  setFParent]  = useState('');
  const [sortDir,  setSortDir]  = useState<'asc'|'desc'>('desc');

  // ── 추가 인라인 행 ──
  const [newClassId,  setNewClassId]  = useState(() => myClasses[0]?.id ?? '');
  const [newPeriod,   setNewPeriod]   = useState<PeriodPreset>('day');
  const [newBase,     setNewBase]     = useState(todayStr);
  const [newCustEnd,  setNewCustEnd]  = useState(todayStr);
  const [newContent,  setNewContent]  = useState('');
  const [newHomework, setNewHomework] = useState('');
  const [newNote,     setNewNote]     = useState('');
  const [newParent,   setNewParent]   = useState('');

  // ── 인라인 수정 행 ──
  // editKey = "classId__date" 형태로 어느 행이 편집 중인지 추적
  const [editKey,    setEditKey]    = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({ content:'', homework:'', teacherNote:'', parentMessage:'' });

  // 추가 행 계산
  const newRange = useMemo(() => computeRange(newPeriod, newBase, newCustEnd), [newPeriod, newBase, newCustEnd]);
  const newCls   = myClasses.find(c => c.id === newClassId);
  const newDates = useMemo(() => newCls ? getClassDatesInRange(newCls, newRange[0], newRange[1]) : [], [newCls, newRange]);

  // 테이블 데이터
  const tableRows = useMemo(() =>
    dbProgress
      .filter(p => myClassIds.has(p.classId))
      .filter(p => {
        const cn = dbClasses.find(c => c.id === p.classId)?.name ?? '';
        return (!fClass||cn.includes(fClass)) && (!fDate||p.date.includes(fDate)) &&
               (!fContent||p.content.includes(fContent)) && (!fHw||p.homework.includes(fHw)) &&
               (!fNote||p.teacherNote.includes(fNote)) && (!fParent||p.parentMessage.includes(fParent));
      })
      .sort((a,b) => sortDir==='desc'
        ? b.date.localeCompare(a.date)||b.classId.localeCompare(a.classId)
        : a.date.localeCompare(b.date)||a.classId.localeCompare(b.classId)),
    [dbProgress, myClassIds, dbClasses, fClass, fDate, fContent, fHw, fNote, fParent, sortDir]
  );

  // ── 핸들러 ──
  const handleNewSave = () => {
    if (!newClassId)         { alert('반을 선택하세요'); return; }
    if (newDates.length===0) { alert('해당 기간에 수업일이 없습니다'); return; }
    if (!newContent && !newHomework && !newNote && !newParent) { alert('내용을 하나 이상 입력하세요'); return; }
    setDbProgress(prev => {
      let r = [...prev];
      newDates.forEach(date => {
        r = r.filter(p => !(p.classId===newClassId && p.date===date));
        r.push({ classId:newClassId, date, content:newContent, homework:newHomework, teacherNote:newNote, parentMessage:newParent });
      });
      return r;
    });
    setNewContent(''); setNewHomework(''); setNewNote(''); setNewParent('');
    if (newDates.length > 1) alert(`${newDates.length}건 저장되었습니다.`);
  };

  const handleDelete = (classId: string, date: string) => {
    if (!confirm('이 수업일지를 삭제하시겠습니까?')) return;
    if (editKey === `${classId}__${date}`) setEditKey(null);
    setDbProgress(prev => prev.filter(p => !(p.classId===classId && p.date===date)));
  };

  const startEdit = (p: DailyProgress) => {
    const key = `${p.classId}__${p.date}`;
    if (editKey === key) { setEditKey(null); return; }   // 같은 행 클릭 시 닫기
    setEditKey(key);
    setEditFields({ content:p.content, homework:p.homework, teacherNote:p.teacherNote, parentMessage:p.parentMessage });
  };

  const handleEditSave = (classId: string, date: string) => {
    setDbProgress(prev => [
      ...prev.filter(p => !(p.classId===classId && p.date===date)),
      { classId, date, content:editFields.content, homework:editFields.homework,
        teacherNote:editFields.teacherNote, parentMessage:editFields.parentMessage },
    ]);
    setEditKey(null);
  };

  if (myClasses.length === 0)
    return <div className="card p-10 text-center text-gray-400 text-sm">담당 반이 없습니다.</div>;

  const PERIOD_OPTS: { id: PeriodPreset; label: string }[] = [
    { id:'day', label:'하루' }, { id:'week', label:'한 주' },
    { id:'month', label:'한 달' }, { id:'custom', label:'직접' },
  ];

  const inCell = "w-full px-2 py-1.5 text-xs border border-indigo-100 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-300 placeholder-gray-300 transition-all";

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">수업일지</h1>
        <p className="text-xs text-gray-500 mt-0.5">기간별로 수업 내용을 입력·관리합니다 · 행 클릭 시 인라인 수정</p>
      </div>

      {/* 테이블 카드 */}
      <div className="card overflow-hidden">
        {/* 메타 */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:'1px solid #F1F5F9' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">수업일지(DailyProgress)</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background:'#EEF2FF', color:'#4338CA' }}>
              {tableRows.length}행
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {(fClass||fDate||fContent||fHw||fNote||fParent) && (
              <button onClick={() => { setFClass('');setFDate('');setFContent('');setFHw('');setFNote('');setFParent(''); }}
                className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'#FEE2E2', color:'#DC2626' }}>
                필터 초기화
              </button>
            )}
            <button onClick={() => setSortDir(d => d==='desc'?'asc':'desc')}
              className="text-xs px-2.5 py-1 rounded-lg" style={{ background:'#F1F5F9', color:'#64748B' }}>
              날짜 {sortDir==='desc'?'↓ 최신순':'↑ 오래된순'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <colgroup>
              <col style={{ width:36 }} />
              <col style={{ width:110 }} />
              <col style={{ width:148 }} />
              <col /><col /><col /><col />
              <col style={{ width:52 }} />
            </colgroup>

            <thead>
              {/* 헤더 */}
              <tr style={{ background:'#F8FAFC', borderBottom:'2px solid #E2E8F0' }}>
                {['#','반','날짜','수업 내용','과제','선생님 메모','학부모 메시지','관리'].map((h,i) => (
                  <th key={h} className={`px-3 py-2.5 text-left text-xs font-semibold text-gray-500 ${i===7?'text-center':''}`}>{h}</th>
                ))}
              </tr>

              {/* 필터 행 */}
              <tr style={{ background:'#FAFBFC', borderBottom:'1px solid #E2E8F0' }}>
                <td className="px-3 py-1.5" />
                <td className="px-2 py-1.5">
                  <input className="w-full px-2 py-0.5 text-xs border border-gray-200 rounded" placeholder="필터..."
                    value={fClass} onChange={e=>setFClass(e.target.value)} />
                </td>
                <td className="px-2 py-1.5">
                  <input type="date" className="w-full text-xs border border-gray-200 rounded px-1 py-0.5"
                    value={fDate} onChange={e=>setFDate(e.target.value)} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-full px-2 py-0.5 text-xs border border-gray-200 rounded" placeholder="필터..."
                    value={fContent} onChange={e=>setFContent(e.target.value)} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-full px-2 py-0.5 text-xs border border-gray-200 rounded" placeholder="필터..."
                    value={fHw} onChange={e=>setFHw(e.target.value)} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-full px-2 py-0.5 text-xs border border-gray-200 rounded" placeholder="필터..."
                    value={fNote} onChange={e=>setFNote(e.target.value)} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="w-full px-2 py-0.5 text-xs border border-gray-200 rounded" placeholder="필터..."
                    value={fParent} onChange={e=>setFParent(e.target.value)} />
                </td>
                <td />
              </tr>

              {/* ── 추가 인라인 행 ── */}
              <tr style={{ background:'#EEF2FF', borderBottom:'2px solid #C7D2FE' }}>
                <td className="px-3 py-2.5 text-center align-middle">
                  <span className="text-base font-bold" style={{ color:'#6366F1' }}>+</span>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <select className={inCell} value={newClassId} onChange={e=>setNewClassId(e.target.value)}>
                    <option value="">반 선택</option>
                    {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <div className="space-y-1">
                    <input type="date" className={inCell} value={newBase} onChange={e=>setNewBase(e.target.value)} />
                    <div className="flex gap-0.5">
                      {PERIOD_OPTS.map(opt => (
                        <button key={opt.id} onClick={()=>setNewPeriod(opt.id)}
                          className="flex-1 text-[10px] py-0.5 rounded font-semibold transition-all"
                          style={newPeriod===opt.id ? {background:'#4F46E5',color:'#fff'} : {background:'#C7D2FE',color:'#4338CA'}}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {newPeriod==='custom' && (
                      <input type="date" className={inCell} value={newCustEnd} onChange={e=>setNewCustEnd(e.target.value)} />
                    )}
                    {newCls && newPeriod!=='day' && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {newDates.length>0 ? (
                          <span className="text-[10px] font-bold" style={{color:'#15803D'}}>✓ {newDates.length}수업일</span>
                        ) : (
                          <span className="text-[10px]" style={{color:'#DC2626'}}>수업일 없음</span>
                        )}
                        {newDates.slice(0,4).map(d => (
                          <span key={d} className="text-[9px] px-1 rounded" style={{background:'#DCFCE7',color:'#15803D'}}>
                            {d.slice(5)}({DAY_KR[new Date(d+'T00:00:00').getDay()]})
                          </span>
                        ))}
                        {newDates.length>4 && <span className="text-[9px] text-gray-400">+{newDates.length-4}일</span>}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5 align-top">
                  <CellArea value={newContent} onChange={setNewContent} placeholder="수업 내용 입력..." />
                </td>
                <td className="px-2 py-2.5 align-top">
                  <CellArea value={newHomework} onChange={setNewHomework} placeholder="과제 입력..." />
                </td>
                <td className="px-2 py-2.5 align-top">
                  <CellArea value={newNote} onChange={setNewNote} placeholder="선생님 메모..." bg="#FFFBEB" border="#FCD34D" />
                </td>
                <td className="px-2 py-2.5 align-top">
                  <CellArea value={newParent} onChange={setNewParent} placeholder="학부모 메시지..." bg="#F0FDF4" border="#6EE7B7" />
                </td>
                <td className="px-2 py-2.5 text-center align-middle">
                  <button onClick={handleNewSave}
                    className="px-2 py-5 rounded-xl text-xs font-bold w-full transition-all"
                    style={{ background:'#4F46E5', color:'#fff', boxShadow:'0 2px 6px rgba(79,70,229,0.4)' }}>
                    저장
                  </button>
                </td>
              </tr>
            </thead>

            {/* ── 데이터 행 ── */}
            <tbody className="divide-y divide-gray-50">
              {tableRows.map((p, i) => {
                const clsName = dbClasses.find(c => c.id === p.classId)?.name ?? p.classId;
                const key = `${p.classId}__${p.date}`;
                const isEditing = editKey === key;

                if (isEditing) {
                  /* ── 편집 중인 행 ── */
                  return (
                    <tr key={key} style={{ background:'#F5F3FF', borderLeft:'3px solid #6366F1' }}>
                      <td className="px-3 py-2.5 text-center align-middle">
                        <span className="text-xs font-bold" style={{ color:'#6366F1' }}>✎</span>
                      </td>
                      {/* 반 (읽기 전용) */}
                      <td className="px-3 py-2.5 align-top">
                        <span className="text-sm font-semibold text-gray-800 block">{clsName}</span>
                      </td>
                      {/* 날짜 (읽기 전용) */}
                      <td className="px-3 py-2.5 align-top">
                        <span className="text-sm text-gray-600">{p.date}</span>
                        <span className="text-xs text-gray-400 ml-1">({DAY_KR[new Date(p.date+'T00:00:00').getDay()]})</span>
                      </td>
                      {/* 수업 내용 */}
                      <td className="px-2 py-2 align-top">
                        <CellArea value={editFields.content} onChange={v=>setEditFields(f=>({...f,content:v}))}
                          placeholder="수업 내용..." border="#A5B4FC" />
                      </td>
                      {/* 과제 */}
                      <td className="px-2 py-2 align-top">
                        <CellArea value={editFields.homework} onChange={v=>setEditFields(f=>({...f,homework:v}))}
                          placeholder="과제..." border="#A5B4FC" />
                      </td>
                      {/* 선생님 메모 */}
                      <td className="px-2 py-2 align-top">
                        <CellArea value={editFields.teacherNote} onChange={v=>setEditFields(f=>({...f,teacherNote:v}))}
                          placeholder="선생님 메모..." bg="#FFFBEB" border="#FCD34D" />
                      </td>
                      {/* 학부모 메시지 */}
                      <td className="px-2 py-2 align-top">
                        <CellArea value={editFields.parentMessage} onChange={v=>setEditFields(f=>({...f,parentMessage:v}))}
                          placeholder="학부모 메시지..." bg="#F0FDF4" border="#6EE7B7" />
                      </td>
                      {/* 저장 / 취소 */}
                      <td className="px-2 py-2 align-middle text-center">
                        <div className="flex flex-col gap-1">
                          <button onClick={()=>handleEditSave(p.classId, p.date)}
                            className="px-2 py-1.5 rounded-lg text-xs font-bold w-full transition-all"
                            style={{ background:'#4F46E5', color:'#fff' }}>
                            저장
                          </button>
                          <button onClick={()=>setEditKey(null)}
                            className="px-2 py-1.5 rounded-lg text-xs font-medium w-full transition-all"
                            style={{ background:'#E2E8F0', color:'#64748B' }}>
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                /* ── 일반 표시 행 ── */
                return (
                  <tr key={key}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                    onClick={()=>startEdit(p)}>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{i+1}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-gray-800 whitespace-nowrap">{clsName}</td>
                    <td className="px-3 py-2.5 text-sm text-gray-600 whitespace-nowrap">
                      {p.date}
                      <span className="ml-1 text-[10px] text-gray-400">({DAY_KR[new Date(p.date+'T00:00:00').getDay()]})</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <span className="text-sm text-indigo-600 line-clamp-2 block">{p.content || <span className="text-gray-300 text-xs">—</span>}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px]">
                      <span className="text-sm text-indigo-600 line-clamp-2 block">{p.homework || <span className="text-gray-300 text-xs">—</span>}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <span className="text-sm text-gray-500 line-clamp-2 block">{p.teacherNote || <span className="text-gray-300 text-xs">—</span>}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <span className="text-sm text-gray-500 line-clamp-2 block">{p.parentMessage || <span className="text-gray-300 text-xs">—</span>}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center" onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>handleDelete(p.classId, p.date)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
              {tableRows.length===0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  위 입력행에서 반과 날짜·내용을 입력하고 저장하세요
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
