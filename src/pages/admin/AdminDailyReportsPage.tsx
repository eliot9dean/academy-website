import { useState } from 'react';
import { useTableData } from '../../hooks/useTableData';
import type { DailyReportStatus, Student, ClassInfo, User } from '../../types';

export default function AdminDailyReportsPage() {
  const [showUnsentOnly, setShowUnsentOnly] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-04-14');
  const [manualSendTarget, setManualSendTarget] = useState<{ name: string; phone: string } | null>(null);

  const [dailyReports] = useTableData<DailyReportStatus>('dailyReports');
  const [students]     = useTableData<Student>('students');
  const [classes]      = useTableData<ClassInfo>('classes');
  const [users]        = useTableData<User>('users');

  const dateReports = dailyReports.filter(r => r.date === selectedDate);
  const sentCount = dateReports.filter(r => r.sent).length;
  const totalCount = dateReports.length;
  const sendRate = totalCount > 0 ? Math.round(sentCount / totalCount * 100) : 0;

  const classesByDate = [...new Set(dateReports.map(r => r.classId))];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">데일리 리포트 발송현황</h1>
          <p className="page-subtitle">수업 종료 후 학부모에게 자동 발송되는 리포트 현황</p>
        </div>
        <input type="date" className="form-select"
          value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: '전체 발송 대상', value: totalCount, color: '#334155', bg: '#F8FAFC' },
          { label: '발송 완료',     value: sentCount,  color: '#16A34A', bg: '#F0FDF4' },
          { label: '미발송',        value: totalCount - sentCount, color: '#DC2626', bg: '#FEF2F2' },
        ].map(item => (
          <div key={item.label} className="card p-4 text-center" style={{ borderTop: `3px solid ${item.color}` }}>
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="card p-4 mb-5">
        <div className="flex justify-between text-xs mb-1.5" style={{ color: '#64748B' }}>
          <span className="font-semibold">발송률</span>
          <span className="font-bold" style={{ color: sendRate >= 80 ? '#16A34A' : '#F59E0B' }}>{sendRate}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${sendRate}%`, background: sendRate >= 80 ? '#22C55E' : '#F59E0B' }} />
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold" style={{ color: '#334155' }}>반별 발송 내역</h2>
        <button
          onClick={() => setShowUnsentOnly(!showUnsentOnly)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={showUnsentOnly
            ? { background: '#FEE2E2', color: '#DC2626' }
            : { background: '#F1F5F9', color: '#64748B' }
          }
        >
          {showUnsentOnly ? '전체 보기' : '미발송만 보기'}
        </button>
      </div>

      {/* Grouped by class */}
      <div className="space-y-4">
        {classesByDate.map(classId => {
          const cls = classes.find(c => c.id === classId);
          const teacher = cls ? users.find(u => u.id === cls.teacherId) : null;
          const classReports = dateReports
            .filter(r => r.classId === classId)
            .filter(r => !showUnsentOnly || !r.sent);

          if (classReports.length === 0) return null;

          const clsSent = dateReports.filter(r => r.classId === classId && r.sent).length;
          const clsTotal = dateReports.filter(r => r.classId === classId).length;

          return (
            <div key={classId} className="card-section">
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: '#F8FAFC', borderBottom: '1px solid #EEF2F7' }}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm" style={{ color: '#1E293B' }}>{cls?.name ?? classId}</span>
                  <span className="text-xs" style={{ color: '#94A3B8' }}>담당: {teacher?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: '#16A34A' }} className="font-semibold">발송 {clsSent}</span>
                  <span style={{ color: '#CBD5E1' }}>/</span>
                  <span style={{ color: '#64748B' }}>{clsTotal}명</span>
                  {clsSent < clsTotal && (
                    <span className="ml-1 badge badge-absent">미발송 {clsTotal - clsSent}</span>
                  )}
                </div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>학생명</th>
                    <th>학부모 연락처</th>
                    <th>특이사항</th>
                    <th className="text-center">발송상태</th>
                    <th className="text-center">발송시간</th>
                    <th className="text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {classReports.map((report, i) => {
                    const student = students.find(s => s.id === report.studentId);
                    return (
                      <tr key={i} style={!report.sent ? { background: '#FFFBEB' } : undefined}>
                        <td className="font-semibold" style={{ color: '#1E293B' }}>{student?.name ?? '-'}</td>
                        <td style={{ color: '#64748B' }}>{report.parentPhone}</td>
                        <td className="text-xs" style={{ color: '#94A3B8' }}>{report.note ?? '-'}</td>
                        <td className="text-center">
                          {report.sent
                            ? <span className="badge badge-present">발송완료</span>
                            : <span className="badge badge-absent">미발송</span>
                          }
                        </td>
                        <td className="text-center text-xs" style={{ color: '#94A3B8' }}>{report.sentAt ?? '-'}</td>
                        <td className="text-center">
                          {!report.sent && (
                            <button className="text-xs font-medium px-2 py-1 rounded-md transition-all"
                              style={{ background: '#EFF6FF', color: '#2563EB' }}
                              onClick={() => setManualSendTarget({ name: student?.name ?? '-', phone: report.parentPhone })}>
                              수동 발송
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        {classesByDate.length === 0 && (
          <div className="card p-10 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm" style={{ color: '#CBD5E1' }}>해당 날짜의 데이터가 없습니다</p>
          </div>
        )}
      </div>

      {/* 수동 발송 확인 Modal */}
      {manualSendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-bold text-base mb-2" style={{ color: '#0F172A' }}>수동 발송 확인</h2>
            <p className="text-sm mb-1" style={{ color: '#475569' }}>
              <span className="font-semibold">{manualSendTarget.name}</span> 학부모에게 발송합니다.
            </p>
            <p className="text-sm mb-5" style={{ color: '#94A3B8' }}>{manualSendTarget.phone}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setManualSendTarget(null)}
                className="flex-1 btn-secondary">
                취소
              </button>
              <button
                onClick={() => {
                  alert(`${manualSendTarget.name}님 학부모(${manualSendTarget.phone})에게 발송했습니다.`);
                  setManualSendTarget(null);
                }}
                className="flex-1 btn-primary">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
