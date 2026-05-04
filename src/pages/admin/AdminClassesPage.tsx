import { useNavigate } from 'react-router-dom';
import type { AttendanceStatus, ClassInfo, User, Student, HomeworkResult, AttendanceRecord, ObservationRecord } from '../../types';
import { useTableData } from '../../hooks/useTableData';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const DAY_ORDER = ['월','화','수','목','금','토','일'];

// TeacherClassesPage와 동일한 팔레트 (ams_class_card_colors 키 공유)
const CARD_PALETTES = [
  { bg: '#FFFFFF', border: '#CBD5E1' },
  { bg: '#EFF6FF', border: '#3B82F6' },
  { bg: '#F0FDF4', border: '#16A34A' },
  { bg: '#FFF3E0', border: '#F97316' },
  { bg: '#EEE8FF', border: '#7C3AED' },
  { bg: '#FDF2F8', border: '#EC4899' },
  { bg: '#ECFEFF', border: '#06B6D4' },
  { bg: '#FEFCE8', border: '#CA8A04' },
  { bg: '#F1F5F9', border: '#64748B' },
  { bg: '#E2E8F0', border: '#475569' },
  { bg: '#DBEAFE', border: '#1D4ED8' },
  { bg: '#DCFCE7', border: '#15803D' },
  { bg: '#FFEDD5', border: '#C2410C' },
  { bg: '#DDD6FE', border: '#5B21B6' },
  { bg: '#FCE7F3', border: '#9D174D' },
  { bg: '#CFFAFE', border: '#0E7490' },
  { bg: '#FEF9C3', border: '#92400E' },
  { bg: '#CBD5E1', border: '#1E293B' },
];

const DAY_COLOR: Record<string, { bg: string; text: string }> = {
  월: { bg: '#DBEAFE', text: '#1D4ED8' },
  화: { bg: '#FEE2E2', text: '#DC2626' },
  수: { bg: '#D1FAE5', text: '#065F46' },
  목: { bg: '#FEF3C7', text: '#92400E' },
  금: { bg: '#EDE9FE', text: '#5B21B6' },
  토: { bg: '#CFFAFE', text: '#0E7490' },
  일: { bg: '#FFE4E6', text: '#BE123C' },
};

const ATT_LABEL: Record<AttendanceStatus, string> = {
  present: '출석', absent: '결석', late: '지각', early_leave: '조퇴',
};

const ATT_STYLE: Record<AttendanceStatus, { bg: string; text: string; border: string }> = {
  present:     { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  absent:      { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  late:        { bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A' },
  early_leave: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
};

const HW_LABEL: Record<string, string> = {
  excellent: '우수', good: '보통', poor: '미흡', not_submitted: '미제출',
};

function format12h(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? '오후' : '오전';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${h12}:${String(m).padStart(2, '0')}`;
}

export default function AdminClassesPage() {
  const navigate = useNavigate();

  const d = new Date();
  const TODAY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const DOW_KR = ['일', '월', '화', '수', '목', '금', '토'];
  const TODAY_DOW = DOW_KR[d.getDay()];

  const [classes]       = useTableData<ClassInfo>('classes');
  const [users]         = useTableData<User>('users');
  const [students]      = useTableData<Student>('students');
  const [hwResults]     = useTableData<HomeworkResult>('homework');
  const [attendance]    = useTableData<AttendanceRecord>('attendance');
  const [observations]  = useTableData<ObservationRecord>('observations');

  const initAtt = (): Record<string, Record<string, AttendanceStatus>> => {
    const init: Record<string, Record<string, AttendanceStatus>> = {};
    classes.forEach(cls => {
      init[cls.id] = {};
      cls.studentIds.forEach((sid: string) => {
        const rec = attendance.find(a => a.classId === cls.id && a.studentId === sid && a.date === TODAY);
        if (rec) init[cls.id][sid] = rec.status as AttendanceStatus;
      });
    });
    return init;
  };

  const [attState] = useLocalStorage<Record<string, Record<string, AttendanceStatus>>>(
    'ams_attendance_' + TODAY,
    initAtt(),
  );

  const [cardColors] = useLocalStorage<Record<string, number>>('ams_class_card_colors', {});

  const teachers = users
    .filter(u => u.role === 'teacher')
    .sort((a, b) => (a.joinDate ?? '').localeCompare(b.joinDate ?? ''));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">선생님별 수업현황</h1>
        <p className="page-subtitle">
          {new Date(TODAY).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} 기준
        </p>
      </div>

      <div className="flex gap-5 items-start overflow-x-auto pb-2">
        {teachers.map((teacher) => {
          const teacherClasses = classes.filter(c => c.teacherId === teacher.id);
          if (!teacherClasses.length) return null;
          const subjects = [...new Set(teacherClasses.map(c => c.subject))].join(' · ');

          return (
            <div key={teacher.id} className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2.5 mb-3 px-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  {teacher.name[0]}
                </div>
                <div>
                  <span className="font-bold text-sm" style={{ color: '#1E293B' }}>{teacher.name} 선생님</span>
                  <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{subjects} · {teacherClasses.length}개 반</div>
                </div>
              </div>

              <div className="space-y-3">
                {teacherClasses.map(cls => {
                  const clsAtt = attState[cls.id] ?? {};
                  const clsStudents = (cls.studentIds as string[])
                    .map(sid => students.find(s => s.id === sid))
                    .filter(Boolean) as Student[];

                  const byStatus: Record<AttendanceStatus, string[]> = {
                    present: [], absent: [], late: [], early_leave: [],
                  };
                  clsStudents.forEach(s => {
                    const st = clsAtt[s.id];
                    if (st) byStatus[st].push(s.name);
                  });

                  const hwToday = hwResults.filter(r => r.classId === cls.id && r.date === TODAY);
                  const hwSummary = {
                    excellent:     hwToday.filter(r => r.result === 'excellent').length,
                    good:          hwToday.filter(r => r.result === 'good').length,
                    poor:          hwToday.filter(r => r.result === 'poor').length,
                    not_submitted: hwToday.filter(r => r.result === 'not_submitted'),
                  };

                  const isToday = (cls.days as string[]).includes(TODAY_DOW);

                  // 현재 시각 vs 수업 시작 시각 비교 (분 단위)
                  const nowMinutes = d.getHours() * 60 + d.getMinutes();
                  const [startH, startM] = cls.startTime.split(':').map(Number);
                  const classStartMinutes = startH * 60 + startM;
                  const classStarted = isToday && nowMinutes >= classStartMinutes;

                  // 출석 기록 존재 여부 (한 명이라도 체크됐으면 true)
                  const hasAttendanceRecord =
                    clsStudents.length > 0 &&
                    clsStudents.some(s => clsAtt[s.id] !== undefined);

                  // 결석/지각/조퇴가 하나라도 있는지
                  const hasIssue = (['absent','late','early_leave'] as AttendanceStatus[])
                    .some(st => byStatus[st].length > 0);

                  const palIdx = cardColors[cls.id] ?? 0;
                  const pal = CARD_PALETTES[palIdx] ?? CARD_PALETTES[0];

                  return (
                    <div key={cls.id} className="card overflow-hidden relative"
                      style={{
                        background: isToday ? pal.bg : '#F8FAFC',
                        border: `1.5px solid ${isToday ? pal.border : '#D1D5DB'}`,
                        opacity: isToday ? 1 : 0.5,
                        filter: isToday ? 'none' : 'grayscale(0.5) brightness(0.93)',
                        transition: 'opacity 0.2s, filter 0.2s',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/teacher/class/${cls.id}`)}>
                      {/* 반 색상 상단 스트라이프 */}
                      <div style={{ height: 4, background: isToday ? pal.border : '#CBD5E1' }} />
                      {/* 비수업일 뱃지 — 카드 중앙 오버레이 */}
                      {!isToday && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                          <div className="text-sm font-extrabold px-4 py-2 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.82)', color: '#94A3B8', border: '1.5px solid #E2E8F0', letterSpacing: '0.05em', backdropFilter: 'blur(2px)' }}>
                            비 수업일
                          </div>
                        </div>
                      )}
                      {/* Card header */}
                      <div className="px-4 pt-3 pb-2.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <div className="flex items-start justify-between mb-1.5">
                          <h3 className="font-bold text-sm" style={{ color: '#0F172A' }}>{cls.name}</h3>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: pal.bg, color: pal.border }}>{cls.subject}</span>
                        </div>
                        <div className="text-xs mb-1.5" style={{ color: '#64748B' }}>
                          {format12h(cls.startTime)} ~ {format12h(cls.endTime)}
                        </div>
                        <div className="flex gap-1">
                          {(cls.days as string[]).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)).map(day => (
                            <span key={day} className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: DAY_COLOR[day]?.bg ?? '#F1F5F9', color: DAY_COLOR[day]?.text ?? '#475569' }}>
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Attendance */}
                      <div className="px-4 pt-3 pb-2">
                        <div className="rounded-lg px-3 py-2" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                          <span className="text-xs font-bold" style={{ color: '#334155' }}>출석 현황: </span>
                          <span className="text-xs">
                            {/* ① 비수업일 */}
                            {!isToday ? (
                              <span className="font-semibold" style={{ color: '#CBD5E1' }}>—</span>
                            ) : /* ② 수업 시작 전 */ !classStarted ? (
                              <span className="font-semibold" style={{ color: '#94A3B8' }}>수업 전</span>
                            ) : /* ③ 수업 시작했으나 출석체크 안 함 */ !hasAttendanceRecord ? (
                              <span className="font-semibold" style={{ color: '#F97316' }}>출석체크 전</span>
                            ) : /* ④ 출석 체크 완료 → 실제 현황 표시 */ (
                              <>
                                {!hasIssue && (
                                  <span className="font-semibold" style={{ color: '#16A34A' }}>전원 출석</span>
                                )}
                                {(['absent','late','early_leave'] as AttendanceStatus[]).map(st => {
                                  const names = byStatus[st];
                                  if (names.length === 0) return null;
                                  return (
                                    <span key={st}>
                                      <span style={{ color: '#64748B' }}>{ATT_LABEL[st]} </span>
                                      <span className="font-bold" style={{ color: ATT_STYLE[st].text }}>
                                        {names.length}명
                                      </span>
                                      <span style={{ color: '#94A3B8' }}>({names.join(', ')})</span>
                                      <span style={{ color: '#CBD5E1' }}> · </span>
                                    </span>
                                  );
                                })}
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Homework summary */}
                      {hwToday.length > 0 && (
                        <div className="px-4 pb-3">
                          <div className="rounded-lg px-3 py-2" style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                            <span className="text-xs font-bold" style={{ color: '#334155' }}>과제 현황: </span>
                            <span className="text-xs">
                              {(['excellent','good','poor'] as const).map(k => (
                                <span key={k}>
                                  <span style={{ color: '#64748B' }}>{HW_LABEL[k]} </span>
                                  <span className="font-bold" style={{ color: '#334155' }}>{hwSummary[k]}명</span>
                                  {k !== 'poor' && <span style={{ color: '#CBD5E1' }}> · </span>}
                                </span>
                              ))}
                              {hwSummary.not_submitted.length > 0 && (
                                <span>
                                  <span style={{ color: '#CBD5E1' }}> · </span>
                                  <span style={{ color: '#64748B' }}>미제출 </span>
                                  <span className="font-bold" style={{ color: '#DC2626' }}>
                                    {hwSummary.not_submitted.length}명
                                  </span>
                                  <span style={{ color: '#94A3B8' }}>
                                    ({hwSummary.not_submitted.map(r => {
                                      const s = students.find(st => st.id === r.studentId);
                                      return s?.name ?? '';
                                    }).join(', ')})
                                  </span>
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 강사 관찰 메모 (원장 열람용) */}
                      {(() => {
                        const todayObs = observations.filter(o => o.classId === cls.id && o.date === TODAY && o.note.trim());
                        if (todayObs.length === 0) return null;
                        return (
                          <div className="px-4 pb-3">
                            <div className="rounded-lg px-3 py-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                              <div className="text-xs font-bold mb-1.5" style={{ color: '#92400E' }}>🔒 선생님 관찰 메모</div>
                              <div className="space-y-1">
                                {todayObs.map(o => {
                                  const s = students.find(st => st.id === o.studentId);
                                  return s ? (
                                    <div key={o.id} className="text-xs" style={{ color: '#78350F' }}>
                                      <span className="font-semibold">{s.name}:</span> {o.note}
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
