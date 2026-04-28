import { useState, useEffect, useCallback, useRef } from 'react';
import { useTableData } from '../../hooks/useTableData';
import RssTicker from '../../components/RssTicker';
import type { ScheduleEvent, ConsultationRecord } from '../../types';

// ── 봄날 캘린더 이벤트 타입 ───────────────────────────────────────────────────
interface BomналEvent {
  id: string;
  title: string;
  start: string;     // YYYY-MM-DD
  end: string;       // YYYY-MM-DD (exclusive — 다음날)
  className?: string; // 카테고리/색상 클래스 (학원공지 필터링용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // imweb 추가 필드 수신용
}

/** "학원공지" 이벤트인지 판별 — className 또는 추가 필드 기반 */
function isHakwonNotice(e: BomналEvent): boolean {
  const haystack = [
    e.className ?? '',
    e.category ?? '',
    e.calendarId ?? '',
    e.groupId ?? '',
    e.board_code ?? '',
  ].join(' ').toLowerCase();
  // 명시적으로 학원공지 키워드가 있으면 포함
  if (haystack.includes('학원공지') || haystack.includes('hakwon')) return true;
  // 반대로 다른 카테고리가 명확히 있으면 제외 (예: 개인일정, 강사일정 등)
  if (haystack.includes('개인') || haystack.includes('강사전용')) return false;
  // 위 조건에 해당 안 하면 기본 포함 (board_code 자체가 학원공지 캘린더일 경우)
  return true;
}

const BOMNAL_BOARD = 'b202604282b278728a1ac3';

/** 타임아웃이 있는 fetch 래퍼 */
async function fetchWithTimeout(url: string, init: RequestInit, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

async function fetchBomналMonth(year: number, month: number): Promise<BomналEvent[]> {
  const start = `${year}-${String(month + 1).padStart(2,'0')}-01`;
  const ny = month === 11 ? year + 1 : year;
  const nm = month === 11 ? 1 : month + 2;
  const end = `${ny}-${String(nm).padStart(2,'0')}-01`;

  const qs = `start=${start}&end=${end}&board=${BOMNAL_BOARD}`;

  // ① Cloudflare Pages Function (프로덕션 — CORS 우회 확실)
  try {
    const res = await fetchWithTimeout(`/api/bomnal?${qs}`, { method: 'GET' }, 10000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch { /* 로컬 개발 환경에서는 없음 → 다음 시도 */ }

  // ② allorigins.win GET 프록시 (로컬 개발 폴백)
  try {
    const targetUrl = encodeURIComponent(
      `https://www.bomnal.net/ajax/calendar_data.cm?board_code=${BOMNAL_BOARD}&start=${start}&end=${end}`
    );
    const res = await fetchWithTimeout(
      `https://api.allorigins.win/raw?url=${targetUrl}`,
      { method: 'GET' },
      10000,
    );
    if (res.ok) {
      const text = await res.text();
      const data = JSON.parse(text.trim() || '[]');
      if (Array.isArray(data)) return data;
    }
  } catch { /* 다음 프록시 시도 */ }

  // ③ corsproxy.io POST 프록시
  try {
    const res = await fetchWithTimeout(
      `https://corsproxy.io/?url=${encodeURIComponent('https://www.bomnal.net/ajax/calendar_data.cm')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `board_code=${BOMNAL_BOARD}&start=${start}&end=${end}`,
      },
      10000,
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch { /* 무시 */ }

  return [];
}

const DAYS = ['일','월','화','수','목','금','토'];

type EventType = ScheduleEvent['type'];

const TYPE_CONFIG: Record<EventType, { label: string; bg: string; text: string; dot: string }> = {
  consultation: { label: '상담',  bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  meeting:      { label: '회의',  bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6' },
  event:        { label: '행사',  bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  external:     { label: '외부',  bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
};

const PERSON_TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  '학부모': { bg: '#EFF6FF', text: '#2563EB' },
  '강사':   { bg: '#F5F3FF', text: '#7C3AED' },
  '외부업체': { bg: '#FFF7ED', text: '#C2410C' },
  '기타':   { bg: '#F8FAFC', text: '#475569' },
};

const TIME_OPTIONS = Array.from({ length: (24 - 6) * 12 }, (_, i) => {
  const totalMin = 6 * 60 + i * 5;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
});

function format12h(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? '오후' : '오전';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${h12}:${String(m).padStart(2,'0')}`;
}

// 오늘 날짜 동적 계산
const _today = new Date();
const TODAY_STR = `${_today.getFullYear()}-${String(_today.getMonth()+1).padStart(2,'0')}-${String(_today.getDate()).padStart(2,'0')}`;
const TODAY_YEAR = _today.getFullYear();
const TODAY_MONTH = _today.getMonth(); // 0-indexed

export default function AdminSchedulePage() {
  const [year, setYear] = useState(TODAY_YEAR);
  const [month, setMonth] = useState(TODAY_MONTH);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [events, setEvents] = useTableData<ScheduleEvent>('schedule');
  const [, setConsultations] = useTableData<ConsultationRecord>('consultations');
  const [form, setForm] = useState<Partial<ScheduleEvent>>({
    type: 'consultation', personType: '학부모', date: TODAY_STR, startTime: '10:00', endTime: '10:30',
  });
  // 상담 유형일 때만 사용하는 학생명 (ScheduleEvent에 없는 별도 필드)
  const [consultStudentName, setConsultStudentName] = useState('');

  // ── 봄날 캘린더 자동 동기화 ─────────────────────────────────────────────
  const [bomналEvents, setBomналEvents] = useState<BomналEvent[]>([]);
  const [rssRefreshKey, setRssRefreshKey] = useState(0);

  // 동기화 시간: 10시, 14시, 18시, 22시
  const SYNC_HOURS = [10, 14, 18, 22];

  const syncBomnal = useCallback(async () => {
    try {
      const data = await fetchBomналMonth(year, month);
      // 학원공지 카테고리만 필터링
      setBomналEvents(data.filter(isHakwonNotice));
    } catch { /* 무시 */ }
  }, [year, month]);

  // syncBomnal의 최신 버전을 ref로 유지 (스케줄러 클로저 문제 방지)
  const syncRef = useRef(syncBomnal);
  useEffect(() => { syncRef.current = syncBomnal; }, [syncBomnal]);

  // 월이 바뀔 때 즉시 갱신 (최초 마운트 포함 → 로그인·새로고침 시 자동 동기화)
  useEffect(() => { syncBomnal(); }, [syncBomnal]);

  // 탭/창으로 돌아올 때 재동기화 (페이지 숨김→표시 전환)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // 스케줄 동기화: 10시·14시·18시·22시 정각에 자동 실행
  useEffect(() => {
    let lastSyncedHour = -1;

    const tick = () => {
      const h = new Date().getHours();
      if (SYNC_HOURS.includes(h) && lastSyncedHour !== h) {
        lastSyncedHour = h;
        syncRef.current();
        setRssRefreshKey(k => k + 1);
      }
    };

    const id = setInterval(tick, 30_000); // 30초마다 정각 여부 확인
    return () => clearInterval(id);
  }, []); // 마운트 시 1회만 등록

  /** 해당 날짜에 걸치는 봄날 이벤트 반환 */
  const getBomналDay = (dateStr: string) =>
    bomналEvents.filter(e => dateStr >= e.start && dateStr < e.end);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const formatDate = (d: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const getEvents = (dateStr: string) => events.filter(e =>
    e.date === dateStr && (typeFilter === 'all' || e.type === typeFilter)
  );
  const selectedEvents = getEvents(selectedDate);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); };

  const handleSave = () => {
    const eventType = (form.type as EventType) ?? 'consultation';
    // 상담 유형은 학생명 필수, 나머지는 제목 필수
    if (eventType === 'consultation' && !consultStudentName.trim()) return;
    if (eventType !== 'consultation' && !form.title) return;
    if (!form.date) return;

    // 상담 일정 제목: "홍길동 상담", 나머지는 입력된 제목 사용
    const eventTitle = eventType === 'consultation'
      ? `${consultStudentName.trim()} 상담`
      : form.title!;

    const newEvent: ScheduleEvent = {
      id: `e-${Date.now()}`,
      title: eventTitle,
      date: form.date!,
      startTime: form.startTime ?? '09:00',
      endTime: form.endTime ?? '10:00',
      type: eventType,
      personName: form.personName ?? '',
      personType: (form.personType as ScheduleEvent['personType']) ?? '기타',
      content: form.content ?? '',
      phone: form.phone,
    };
    setEvents(prev => [...prev, newEvent]);

    // 상담 유형이면 등록전환율 상담 목록에도 자동 등록
    if (eventType === 'consultation') {
      const newConsultation: ConsultationRecord = {
        id: `c-${Date.now()}`,
        studentName: consultStudentName.trim(),          // 전용 학생명 필드 사용
        parentName: form.personName ?? '',               // 상담자명 → 학부모명으로
        phone: form.phone ?? '',
        date: form.date!,
        result: 'pending',
        contactForEvents: false,
        source: '직접상담',
        notes: form.content ?? '',
      };
      setConsultations(prev => [newConsultation, ...prev]);
    }

    setSelectedDate(form.date!);
    setShowModal(false);
    setConsultStudentName('');
    setForm({ type: 'consultation', personType: '학부모', date: TODAY_STR, startTime: '10:00', endTime: '10:30' });
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">일정 관리</h1>
          <p className="page-subtitle">상담, 회의, 행사, 외부 미팅 일정</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setForm({ ...form, date: selectedDate }); setShowModal(true); }} className="btn-primary">
            + 일정 추가
          </button>
        </div>
      </div>

      {/* 봄날 소식 RSS 롤링 배너 */}
      <RssTicker refreshKey={rssRefreshKey} />

      {/* Filter buttons + Legend */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <button
          onClick={() => setTypeFilter('all')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={typeFilter === 'all'
            ? { background: '#334155', color: '#fff' }
            : { background: '#F1F5F9', color: '#64748B' }}>
          전체
        </button>
        {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([key, cfg]) => (
          <button key={key}
            onClick={() => setTypeFilter(typeFilter === key ? 'all' : key)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={typeFilter === key
              ? { background: cfg.dot, color: '#fff' }
              : { background: '#F1F5F9', color: '#64748B' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: typeFilter === key ? '#fff' : cfg.dot }} />
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Calendar */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-ghost px-2 py-1 text-sm">◀</button>
            <h2 className="font-bold text-sm" style={{ color: '#0F172A' }}>{year}년 {month+1}월</h2>
            <button onClick={nextMonth} className="btn-ghost px-2 py-1 text-sm">▶</button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d, i) => (
              <div key={d} className="text-center text-base font-extrabold py-1"
                style={{ color: i===0 ? '#EF4444' : i===6 ? '#3B82F6' : '#64748B' }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_,i) => {
              const day = i+1;
              const dateStr = formatDate(day);
              const dayEvents   = getEvents(dateStr);
              const bomналDay   = getBomналDay(dateStr);
              const isSelected  = selectedDate === dateStr;
              const isToday     = dateStr === TODAY_STR;
              const dow         = (firstDay + i) % 7;
              const totalCount  = dayEvents.length + bomналDay.length;
              return (
                <div key={day}
                  className="relative min-h-[80px] p-2 rounded-lg text-left transition-all cursor-pointer select-none"
                  onClick={() => setSelectedDate(dateStr)}
                  onDoubleClick={() => {
                    setSelectedDate(dateStr);
                    setForm(prev => ({ ...prev, date: dateStr }));
                    setShowModal(true);
                  }}
                  style={{
                    background: isSelected ? '#EEF2FF' : isToday ? '#F0FDF4' : 'transparent',
                    border: isSelected ? '2px solid #818CF8' : isToday ? '2px solid #86EFAC' : '1.5px solid transparent',
                  }}
                  title="더블클릭: 일정 추가"
                >
                  <div className="text-base font-extrabold mb-1 flex items-center gap-1"
                    style={{ color: isToday ? '#16A34A' : dow===0 ? '#EF4444' : dow===6 ? '#3B82F6' : '#1E293B' }}>
                    {day}
                    {isToday && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#16A34A', color: '#fff' }}>오늘</span>}
                  </div>
                  <div className="space-y-0.5">
                    {/* 봄날 이벤트 (우선 표시) */}
                    {bomналDay.slice(0,1).map(e => (
                      <div key={e.id} className="text-xs px-1.5 py-0.5 rounded truncate font-bold"
                        style={{ background: '#FEE2E2', color: '#DC2626' }}>
                        📢 {e.title}
                      </div>
                    ))}
                    {/* 내부 일정 */}
                    {dayEvents.slice(0, Math.max(0, 2 - bomналDay.length)).map(e => (
                      <div key={e.id} className="text-xs px-1.5 py-0.5 rounded truncate font-bold"
                        style={{ background: TYPE_CONFIG[e.type].bg, color: TYPE_CONFIG[e.type].text }}>
                        {e.startTime} {e.title}
                      </div>
                    ))}
                    {totalCount > 2 && (
                      <div className="text-xs font-semibold" style={{ color: '#94A3B8' }}>+{totalCount-2}개</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event detail panel — 캘린더 아래 */}
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3" style={{ color: '#0F172A' }}>
            📋 {selectedDate ? `${selectedDate.slice(5).replace('-','월 ')}일 일정` : '날짜를 선택하세요'}
          </h3>
          {(() => {
            const bomналDay = getBomналDay(selectedDate);
            const hasAny = selectedEvents.length > 0 || bomналDay.length > 0;
            if (!hasAny) return (
              <div className="flex items-center gap-3 py-5 px-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                <div className="text-2xl">📭</div>
                <p className="text-sm" style={{ color: '#CBD5E1' }}>등록된 일정이 없습니다</p>
              </div>
            );
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* 봄날 공지 카드 */}
                {bomналDay.map(ev => {
                  // end date: imweb은 exclusive end이므로 하루 빼기
                  const endDisplay = ev.end && ev.end > ev.start
                    ? new Date(new Date(ev.end).getTime() - 86400000).toISOString().slice(0,10)
                    : ev.start;
                  const isSingleDay = endDisplay === ev.start;
                  // imweb이 url 필드명을 다양하게 사용할 수 있으므로 여러 후보 체크
                  const eventUrl: string =
                    ev.url || ev.link || ev.boardUrl || ev.pageUrl ||
                    ev.extendedProps?.url || ev.extendedProps?.link || '';
                  return (
                    <div key={`b-${ev.id}`} className="rounded-xl p-3" style={{ background: '#FFF5F5', border: '1px solid #FECACA' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                          style={{ background: '#FEE2E2', color: '#DC2626' }}>📢 봄날 학원공지</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: '#991B1B' }}>{ev.title}</h4>
                      <div className="space-y-0.5 text-xs" style={{ color: '#EF4444' }}>
                        <div>🗓 {ev.start}{!isSingleDay ? ` ~ ${endDisplay}` : ''}</div>
                        {/* 내용(description) */}
                        {ev.description && (
                          <div className="mt-1 pt-1 border-t text-xs whitespace-pre-wrap"
                            style={{ color: '#7F1D1D', borderColor: '#FECACA' }}>
                            {ev.description}
                          </div>
                        )}
                        {/* URL */}
                        {eventUrl && (
                          <div className="mt-1 pt-1 border-t" style={{ borderColor: '#FECACA' }}>
                            <a href={eventUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs underline break-all"
                              style={{ color: '#B91C1C' }}
                              onClick={e => e.stopPropagation()}>
                              🔗 {eventUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {/* 내부 일정 카드 */}
                {selectedEvents.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(ev => {
                  const cfg = TYPE_CONFIG[ev.type];
                  const ptStyle = PERSON_TYPE_STYLE[ev.personType] ?? PERSON_TYPE_STYLE['기타'];
                  return (
                    <div key={ev.id} className="rounded-xl p-3" style={{ background: cfg.bg, border: `1px solid ${cfg.dot}33` }}>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                          style={{ background: '#fff', color: cfg.text }}>{cfg.label}</span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                          style={{ background: ptStyle.bg, color: ptStyle.text }}>{ev.personType}</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1.5" style={{ color: '#0F172A' }}>{ev.title}</h4>
                      <div className="space-y-0.5 text-xs" style={{ color: cfg.text }}>
                        <div>⏰ {format12h(ev.startTime)} ~ {format12h(ev.endTime)}</div>
                        <div>👤 {ev.personName}</div>
                        {ev.phone && <div>📞 {ev.phone}</div>}
                        {ev.content && <div className="mt-1 pt-1 border-t" style={{ color: '#475569', borderColor: `${cfg.dot}22` }}>{ev.content}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-bold text-base mb-4" style={{ color: '#0F172A' }}>일정 추가</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>날짜</label>
                  <input type="date" className="form-input mt-1" value={form.date ?? ''}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>종류</label>
                  <select className="form-select mt-1 w-full"
                    value={form.type ?? 'consultation'}
                    onChange={e => {
                      setForm(p => ({ ...p, type: e.target.value as EventType }));
                      setConsultStudentName('');
                    }}>
                    {Object.entries(TYPE_CONFIG).map(([k,v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 상담 유형: 학생명 전용 필드 */}
              {form.type === 'consultation' ? (
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1" style={{ color: '#1D4ED8' }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#3B82F6' }} />
                    학생명 <span style={{ color: '#EF4444' }}>*</span>
                    <span className="ml-1 text-[10px] font-normal" style={{ color: '#94A3B8' }}>→ 등록전환율 상담목록에 자동 등록</span>
                  </label>
                  <input className="form-input mt-1" placeholder="상담할 학생 이름"
                    value={consultStudentName}
                    onChange={e => setConsultStudentName(e.target.value)} />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>제목</label>
                  <input className="form-input mt-1" placeholder="일정 제목"
                    value={form.title ?? ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>시작 시간</label>
                  <select className="form-select mt-1 w-full"
                    value={form.startTime ?? '10:00'}
                    onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{format12h(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>종료 시간</label>
                  <select className="form-select mt-1 w-full"
                    value={form.endTime ?? '10:30'}
                    onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}>
                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{format12h(t)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>
                    {form.type === 'consultation' ? '학부모명' : '담당자명'}
                  </label>
                  <input className="form-input mt-1" placeholder="이름"
                    value={form.personName ?? ''} onChange={e => setForm(p => ({ ...p, personName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#475569' }}>구분</label>
                  <select className="form-select mt-1 w-full"
                    value={form.personType ?? '학부모'}
                    onChange={e => setForm(p => ({ ...p, personType: e.target.value as ScheduleEvent['personType'] }))}>
                    {['학부모','강사','외부업체','기타'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: '#475569' }}>연락처</label>
                <input className="form-input mt-1" placeholder="010-0000-0000"
                  value={form.phone ?? ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold" style={{ color: '#475569' }}>내용</label>
                <textarea className="form-input mt-1 resize-none" rows={3} placeholder="미팅 내용"
                  value={form.content ?? ''} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowModal(false); setConsultStudentName(''); }} className="flex-1 btn-secondary">취소</button>
              <button onClick={handleSave} className="flex-1 btn-primary">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
