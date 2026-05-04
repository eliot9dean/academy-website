import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { useTableData } from '../../hooks/useTableData';
import type { Student } from '../../types';

const REASON_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#10B981'];
const TEACHER_COLORS = ['#3B82F6', '#F59E0B', '#10B981'];

type RangePreset = '1month' | '3months' | 'custom';

const _wd = new Date();
const TODAY = `${_wd.getFullYear()}-${String(_wd.getMonth()+1).padStart(2,'0')}-${String(_wd.getDate()).padStart(2,'0')}`;

const RADIAN = Math.PI / 180;
function renderPieLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props;
  if ((percent as number) < 0.06) return null;
  const r = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.55;
  const x = (cx as number) + r * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + r * Math.sin(-(midAngle as number) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {name}({value})
    </text>
  );
}

function StudentListTooltip({ active, payload, labelKey, labelSuffix = '' }: {
  active?: boolean;
  payload?: { payload: Record<string, unknown> }[];
  labelKey: string;
  labelSuffix?: string;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  const label = String(data[labelKey] ?? '');
  const count = Number(data.count ?? data['퇴원수'] ?? data.value ?? 0);
  const students = (data.students as string[] | undefined) ?? [];
  return (
    <div className="bg-white rounded-xl shadow-lg border text-xs p-3" style={{ borderColor: '#E2E8F0', minWidth: 120, maxWidth: 220 }}>
      <p className="font-bold mb-1" style={{ color: '#1E293B' }}>{label}{labelSuffix}</p>
      <p style={{ color: '#64748B' }}>퇴원 <span className="font-bold" style={{ color: '#EF4444' }}>{count}명</span></p>
      {students.length > 0 && (
        <p className="mt-1 leading-relaxed" style={{ color: '#94A3B8' }}>{students.join(', ')}</p>
      )}
    </div>
  );
}

function TeacherTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; count: number; students: string[] } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { name, count, students } = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-lg border text-xs p-3" style={{ borderColor: '#E2E8F0', minWidth: 120 }}>
      <p className="font-bold mb-1" style={{ color: '#1E293B' }}>{name} 선생님</p>
      <p style={{ color: '#64748B' }}>퇴원 <span className="font-bold" style={{ color: '#EF4444' }}>{count}명</span></p>
      {students.length > 0 && <p className="mt-1" style={{ color: '#94A3B8' }}>{students.join(', ')}</p>}
    </div>
  );
}

const TEACHER_BY_STUDENT: Record<string, string> = {
  s1: '이수진', s2: '이수진', s6: '이수진', s9: '이수진', s11: '이수진', s15: '이수진',
  s3: '박민호', s4: '박민호', s12: '박민호',
  s5: '최지혜', s10: '최지혜', s13: '최지혜',
  s7: '최지혜', s8: '박민호', s14: '박민호',
  s21: '이수진', s22: '박민호', s23: '최지혜', s24: '이수진', s25: '박민호',
};

function calcStart(preset: RangePreset): string {
  const d = new Date(TODAY);
  if (preset === '1month')  { d.setMonth(d.getMonth() - 1);  return d.toISOString().slice(0, 10); }
  if (preset === '3months') { d.setMonth(d.getMonth() - 3);  return d.toISOString().slice(0, 10); }
  return d.toISOString().slice(0, 10);
}

export default function AdminWithdrawalPage() {
  const [students] = useTableData<Student>('students');

  // 차트 범위
  const [rangePreset, setRangePreset] = useState<RangePreset>('3months');
  const [customStart, setCustomStart] = useState('2026-01-01');
  const [customEnd, setCustomEnd]     = useState(TODAY);

  const { startDate, endDate } = useMemo(() => {
    if (rangePreset !== 'custom') return { startDate: calcStart(rangePreset), endDate: TODAY };
    return { startDate: customStart, endDate: customEnd };
  }, [rangePreset, customStart, customEnd]);

  const allWithdrawn = students.filter(s => s.status === 'withdrawn');
  const enrolled     = students.filter(s => s.status === 'enrolled');

  const filteredWithdrawn = useMemo(
    () => allWithdrawn
      .filter(s => s.withdrawDate && s.withdrawDate >= startDate && s.withdrawDate <= endDate)
      .sort((a, b) => (b.withdrawDate ?? '').localeCompare(a.withdrawDate ?? '')),
    [allWithdrawn, startDate, endDate],
  );

  const reasonMap = new Map<string, { value: number; students: string[] }>();
  filteredWithdrawn.forEach(s => {
    if (s.withdrawReason) {
      const ex = reasonMap.get(s.withdrawReason);
      if (ex) { ex.value++; ex.students.push(s.name); }
      else reasonMap.set(s.withdrawReason, { value: 1, students: [s.name] });
    }
  });
  const reasonData = Array.from(reasonMap.entries()).map(([name, { value, students }]) => ({ name, value, students }));

  const teacherMap = new Map<string, { count: number; students: string[] }>();
  filteredWithdrawn.forEach(s => {
    const teacher = TEACHER_BY_STUDENT[s.id] ?? '미지정';
    const ex = teacherMap.get(teacher);
    if (ex) { ex.count++; ex.students.push(s.name); }
    else teacherMap.set(teacher, { count: 1, students: [s.name] });
  });
  const teacherData = Array.from(teacherMap.entries()).map(([name, { count, students }]) => ({ name, count, students }));

  const gradeMap = new Map<string, { count: number; students: string[] }>();
  filteredWithdrawn.forEach(s => {
    const ex = gradeMap.get(s.grade);
    if (ex) { ex.count++; ex.students.push(s.name); }
    else gradeMap.set(s.grade, { count: 1, students: [s.name] });
  });
  const gradeData = Array.from(gradeMap.entries()).map(([grade, { count, students }]) => ({ grade, count, students }));

  const monthMap = new Map<string, { count: number; students: string[] }>();
  filteredWithdrawn.forEach(s => {
    if (s.withdrawDate) {
      const m = s.withdrawDate.slice(0, 7);
      const ex = monthMap.get(m);
      if (ex) { ex.count++; ex.students.push(s.name); }
      else monthMap.set(m, { count: 1, students: [s.name] });
    }
  });
  const lineData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, { count, students }]) => ({ month: m.slice(5) + '월', 퇴원수: count, students }));

  const totalInRange    = filteredWithdrawn.length;
  const withdrawalRate  = Math.round(allWithdrawn.length / (allWithdrawn.length + enrolled.length) * 100);
  const topReason  = [...reasonData].sort((a, b) => b.value - a.value)[0];
  const topTeacher = [...teacherData].sort((a, b) => b.count - a.count)[0];
  const topGrade   = [...gradeData].sort((a, b) => b.count - a.count)[0];

  return (
    <div>
      <div className="page-header flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">퇴원 분석</h1>
          <p className="page-subtitle">퇴원율 인사이트 및 원인 분석 (퇴원일 기준)</p>
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: '현 재원생',    value: enrolled.length,     color: '#334155' },
          { label: '누적 퇴원생',  value: allWithdrawn.length, color: '#EF4444' },
          { label: '퇴원율',       value: `${withdrawalRate}%`, color: '#F59E0B' },
          { label: '기간 내 퇴원', value: totalInRange,         color: '#4F46E5' },
        ].map(item => (
          <div key={item.label} className="stat-card text-center">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 현황 요약 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4" style={{ borderLeft: '4px solid #EF4444' }}>
          <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>주요 퇴원 사유</div>
          <div className="font-bold text-sm" style={{ color: '#1E293B' }}>{topReason?.name ?? '—'}</div>
          <div className="text-xs mt-0.5" style={{ color: '#EF4444' }}>
            기간 내 퇴원의 {topReason && totalInRange > 0 ? Math.round(topReason.value / totalInRange * 100) : 0}%
          </div>
        </div>
        <div className="card p-4" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>퇴원생 多 담당 선생님</div>
          <div className="font-bold text-sm" style={{ color: '#1E293B' }}>{topTeacher?.name ?? '—'}</div>
          <div className="text-xs mt-0.5" style={{ color: '#F59E0B' }}>총 {topTeacher?.count ?? 0}명 퇴원</div>
        </div>
        <div className="card p-4" style={{ borderLeft: '4px solid #8B5CF6' }}>
          <div className="text-xs mb-1" style={{ color: '#94A3B8' }}>퇴원 多 학년</div>
          <div className="font-bold text-sm" style={{ color: '#1E293B' }}>{topGrade?.grade ?? '—'}</div>
          <div className="text-xs mt-0.5" style={{ color: '#8B5CF6' }}>총 {topGrade?.count ?? 0}명 퇴원</div>
        </div>
      </div>

      {/* 퇴원율 감소 인사이트 */}
      {(() => {
        // 데이터 기반 인사이트 계산
        const avgTenure = filteredWithdrawn.length > 0
          ? Math.round(filteredWithdrawn.reduce((sum, s) => {
              const months = s.withdrawDate
                ? Math.round((new Date(s.withdrawDate).getTime() - new Date(s.enrollDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                : 0;
              return sum + months;
            }, 0) / filteredWithdrawn.length)
          : 0;
        const earlyChurn = filteredWithdrawn.filter(s => {
          if (!s.withdrawDate) return false;
          const m = Math.round((new Date(s.withdrawDate).getTime() - new Date(s.enrollDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
          return m <= 3;
        }).length;
        const earlyChurnPct = filteredWithdrawn.length > 0 ? Math.round(earlyChurn / filteredWithdrawn.length * 100) : 0;
        const tips: { icon: string; color: string; title: string; body: string }[] = [];

        if (topReason?.name === '성적부진') {
          tips.push({ icon: '📈', color: '#3B82F6', title: '성적 모니터링 강화', body: '월 1회 학부모 성적 리포트 발송, 결석·미제출 발생 시 즉시 알림 체계 구축으로 성적 부진 조기 발견을 권장합니다.' });
        }
        if (topReason?.name === '타학원이동') {
          tips.push({ icon: '🏆', color: '#8B5CF6', title: '차별화된 커리큘럼 강조', body: '데일리테스트·과제 이력 등 학습 기록을 학부모와 공유하고, 우리 학원만의 강점(소수 정예, 맞춤 지도)을 정기적으로 소통하세요.' });
        }
        if (topReason?.name === '이사') {
          tips.push({ icon: '📍', color: '#059669', title: '지역 홍보 강화', body: '이사 사유 퇴원은 불가피하지만, 인근 지역 홍보 채널(아파트 커뮤니티, 지역 맘카페 등)을 통해 신규 유입으로 보완하세요.' });
        }
        if (topReason?.name === '경제적사유') {
          tips.push({ icon: '💳', color: '#F59E0B', title: '수강료 유연화 검토', body: '장기 재원 학생 할인 또는 분할 납부 옵션을 도입하면 경제적 부담을 낮춰 이탈을 줄일 수 있습니다.' });
        }
        // 공통 인사이트
        if (earlyChurnPct >= 40) {
          tips.push({ icon: '🚀', color: '#EF4444', title: '초기 정착 관리 집중', body: `퇴원생의 ${earlyChurnPct}%가 3개월 이내 조기 퇴원합니다. 입원 후 첫 1개월 내 1:1 면담, 2~3개월 차 학부모 중간 상담을 정례화하세요.` });
        }
        if (topTeacher && topTeacher.count >= 2) {
          tips.push({ icon: '👨‍🏫', color: '#0891B2', title: `${topTeacher.name} 선생님 집중 지원`, body: '퇴원 학생이 집중된 반을 담당하는 선생님과 수업 방식·학부모 소통 방법을 함께 검토하고, 필요 시 공개 수업이나 동료 코칭을 제안하세요.' });
        }
        if (avgTenure > 0 && avgTenure <= 6) {
          tips.push({ icon: '⏱️', color: '#7C3AED', title: '재원 기간 연장 전략', body: `평균 퇴원까지 ${avgTenure}개월로 짧습니다. 6개월·1년 장기 재원 학생에게 소정의 혜택(교재 할인, 상담 우선권 등)을 제공해 재원 기간을 늘리세요.` });
        }
        // 기본 공통 팁
        tips.push({ icon: '💬', color: '#64748B', title: '학부모 소통 정례화', body: '매달 학습 현황 문자(출석률·과제 제출률·최근 시험 점수)를 자동 발송하면 학부모 신뢰도 향상과 이탈 방지에 효과적입니다.' });
        tips.push({ icon: '🎖️', color: '#16A34A', title: '장기 재원 리텐션 프로그램', body: '6개월·1년 재원 달성 시 수료증이나 작은 이벤트를 진행하면 학생과 학부모 모두 소속감이 올라가 이탈률이 낮아집니다.' });

        return (
          <div className="card p-5 mb-5" style={{ borderTop: '3px solid #6366F1' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔍</span>
              <h3 className="font-bold text-sm" style={{ color: '#1E293B' }}>퇴원율 감소를 위한 액션 인사이트</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                style={{ background: '#EEF2FF', color: '#4F46E5' }}>데이터 기반</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {tips.map((tip, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: '#F8FAFC', border: `1px solid ${tip.color}22` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{tip.icon}</span>
                    <span className="text-xs font-bold" style={{ color: tip.color }}>{tip.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{tip.body}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>월별 퇴원생 추이</h3>
          {lineData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#CBD5E1' }}>기간 내 퇴원 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip content={<StudentListTooltip labelKey="month" labelSuffix=" 퇴원" />} />
                <Line type="monotone" dataKey="퇴원수" stroke="#EF4444" strokeWidth={2} dot={{ r: 4, fill: '#EF4444' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>퇴원 사유별 분포</h3>
          {reasonData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#CBD5E1' }}>기간 내 퇴원 없음</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={reasonData} cx="50%" cy="50%" outerRadius={75}
                    dataKey="value" labelLine={false} label={renderPieLabel}>
                    {reasonData.map((_, i) => <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<StudentListTooltip labelKey="name" labelSuffix=" 사유" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 flex-wrap mt-1">
                {reasonData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: '#64748B' }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: REASON_COLORS[i % REASON_COLORS.length] }} />
                    {d.name} {d.value}명
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>담당 선생님별 퇴원 수</h3>
          {teacherData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#CBD5E1' }}>기간 내 퇴원 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={teacherData} margin={{ left: -20, top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip content={<TeacherTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="퇴원 수">
                  {teacherData.map((_, i) => <Cell key={i} fill={TEACHER_COLORS[i % TEACHER_COLORS.length]} />)}
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h3 className="text-sm font-bold mb-3" style={{ color: '#1E293B' }}>학년별 퇴원 수</h3>
          {gradeData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm" style={{ color: '#CBD5E1' }}>기간 내 퇴원 없음</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} margin={{ left: -20, top: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                <Tooltip content={<StudentListTooltip labelKey="grade" labelSuffix="" />} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="퇴원 수">
                  <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Withdrawal list */}
      <div className="card-section">
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: '#F8FAFC', borderBottom: '1px solid #EEF2F7' }}>
          <h3 className="text-sm font-bold" style={{ color: '#1E293B' }}>
            퇴원생 목록
            <span className="ml-2 font-normal text-xs" style={{ color: '#94A3B8' }}>({filteredWithdrawn.length}명)</span>
          </h3>
        </div>
        {filteredWithdrawn.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm" style={{ color: '#CBD5E1' }}>해당 기간의 퇴원 데이터가 없습니다</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>학생명</th><th>학년</th><th>학교</th><th>등록일</th>
                <th>퇴원일</th><th>퇴원 사유</th><th>재원 기간</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawn.map(s => {
                const months = s.withdrawDate
                  ? Math.round((new Date(s.withdrawDate).getTime() - new Date(s.enrollDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                  : 0;
                return (
                  <tr key={s.id}>
                    <td className="font-semibold" style={{ color: '#1E293B' }}>{s.name}</td>
                    <td style={{ color: '#64748B' }}>{s.grade}</td>
                    <td style={{ color: '#64748B' }}>{s.school}</td>
                    <td style={{ color: '#94A3B8' }}>{s.enrollDate}</td>
                    <td style={{ color: '#94A3B8' }}>{s.withdrawDate}</td>
                    <td>
                      <span className="badge text-xs" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                        {s.withdrawReason}
                      </span>
                    </td>
                    <td style={{ color: '#64748B' }}>{months}개월</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
