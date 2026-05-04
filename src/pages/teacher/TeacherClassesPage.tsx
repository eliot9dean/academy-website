import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTableData } from '../../hooks/useTableData';
import type { ClassInfo, Student, AttendanceRecord } from '../../types';

const DAY_ORDER = ['월', '화', '수', '목', '금', '토', '일'];

const CARD_PALETTES = [
  // ── 연한 ──
  { bg: '#FFFFFF', border: '#CBD5E1', name: '기본' },
  { bg: '#EFF6FF', border: '#3B82F6', name: '파랑' },
  { bg: '#F0FDF4', border: '#16A34A', name: '초록' },
  { bg: '#FFF3E0', border: '#F97316', name: '주황' },
  { bg: '#EEE8FF', border: '#7C3AED', name: '보라' },
  { bg: '#FDF2F8', border: '#EC4899', name: '분홍' },
  { bg: '#ECFEFF', border: '#06B6D4', name: '청록' },
  { bg: '#FEFCE8', border: '#CA8A04', name: '노랑' },
  { bg: '#F1F5F9', border: '#64748B', name: '회색' },
  // ── 진한 ──
  { bg: '#E2E8F0', border: '#475569', name: '기본(진)' },
  { bg: '#DBEAFE', border: '#1D4ED8', name: '파랑(진)' },
  { bg: '#DCFCE7', border: '#15803D', name: '초록(진)' },
  { bg: '#FFEDD5', border: '#C2410C', name: '주황(진)' },
  { bg: '#DDD6FE', border: '#5B21B6', name: '보라(진)' },
  { bg: '#FCE7F3', border: '#9D174D', name: '분홍(진)' },
  { bg: '#CFFAFE', border: '#0E7490', name: '청록(진)' },
  { bg: '#FEF9C3', border: '#92400E', name: '노랑(진)' },
  { bg: '#CBD5E1', border: '#1E293B', name: '회색(진)' },
];

export default function TeacherClassesPage() {
  const { currentUser, viewAsUser } = useAuth();
  const effectiveUser = viewAsUser ?? currentUser;
  const navigate = useNavigate();
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);

  const d = new Date();
  const TODAY = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [classes, setClasses] = useTableData<ClassInfo>('classes');
  const [students]   = useTableData<Student>('students');
  const [attendance] = useTableData<AttendanceRecord>('attendance');

  const myClasses = classes.filter(c => c.teacherId === effectiveUser?.id);

  return (
    <div onClick={() => setColorPickerFor(null)}>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">{currentUser?.name} 선생님 담당반</h1>
        <p className="text-xs text-gray-500 mt-0.5">반 카드를 클릭하면 상세 관리 화면으로 이동합니다</p>
      </div>

      {myClasses.length === 0 ? (
        <div className="card p-8 text-center text-gray-400 text-sm">담당 반이 없습니다</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {myClasses.map(cls => {
            const records = (cls.studentIds as string[]).map(sid => {
              const s = students.find(st => st.id === sid)!;
              const att = attendance.find(a => a.classId === cls.id && a.studentId === sid && a.date === TODAY);
              return { student: s, status: att?.status ?? null };
            }).filter(r => r.student);
            const absentList = records.filter(r => r.status === 'absent');
            const palIdx = cls.cardColorIdx ?? 0;
            const pal = CARD_PALETTES[palIdx];

            return (
              <div key={cls.id} className="relative" onClick={e => e.stopPropagation()}>
                {/* 카드 */}
                <button
                  onClick={() => navigate(`/teacher/class/${cls.id}`)}
                  className="w-full text-left hover:shadow-md transition-all cursor-pointer rounded-xl p-2.5 border"
                  style={{ background: pal.bg, borderColor: pal.border }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5 pr-5 flex-wrap">
                    <h3 className="font-bold text-gray-800 text-[15px] leading-tight">{cls.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">{cls.subject}</span>
                  </div>
                  <div className="space-y-0.5 text-[13px] text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>📅</span>
                      <span>{(cls.days as string[]).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)).join('·')}요일</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⏰</span>
                      <span>{cls.startTime}~{cls.endTime}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 pr-5">
                      <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>총 {(cls.studentIds as string[]).length}명</span>
                      </div>
                      {absentList.length > 0 && (
                        <span className="text-xs text-red-500 font-semibold truncate">
                          결석: {absentList.map(r => r.student.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* 색상 변경 버튼 */}
                <button
                  onClick={(e) => { e.stopPropagation(); setColorPickerFor(colorPickerFor === cls.id ? null : cls.id); }}
                  className="absolute top-2 right-2 w-7 h-3.5 rounded-full border border-gray-400 shadow-sm hover:opacity-80 transition-opacity"
                  style={{ background: pal.bg }}
                  title="카드 색상 변경"
                />

                {/* 색상 팔레트 팝업 */}
                {colorPickerFor === cls.id && (
                  <div className="absolute top-7 right-0 z-30 bg-white rounded-xl shadow-xl p-2.5 border border-gray-100"
                    onClick={e => e.stopPropagation()}>
                    <div className="text-[9px] text-gray-400 mb-1.5 font-medium">연한</div>
                    <div className="grid grid-cols-9 gap-1 mb-1.5">
                      {CARD_PALETTES.slice(0, 9).map((p, i) => (
                        <button key={i}
                          onClick={() => { setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, cardColorIdx: i } : c)); setColorPickerFor(null); }}
                          className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                          style={{ background: p.bg, borderColor: palIdx === i ? '#4F46E5' : p.border }}
                          title={p.name}
                        />
                      ))}
                    </div>
                    <div className="text-[9px] text-gray-400 mb-1.5 font-medium">진한</div>
                    <div className="grid grid-cols-9 gap-1">
                      {CARD_PALETTES.slice(9).map((p, i) => (
                        <button key={i + 9}
                          onClick={() => { setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, cardColorIdx: i + 9 } : c)); setColorPickerFor(null); }}
                          className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                          style={{ background: p.bg, borderColor: palIdx === i + 9 ? '#4F46E5' : p.border }}
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
