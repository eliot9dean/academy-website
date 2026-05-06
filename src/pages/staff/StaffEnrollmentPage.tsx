import { useState } from 'react';
import { useTableData } from '../../hooks/useTableData';
import type { Student } from '../../types';

export default function StaffEnrollmentPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'withdrawn'>('all');
  const [search, setSearch] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smsText, setSmsText] = useState('');

  // 테이블 필터
  const [filterGrade,  setFilterGrade]  = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [filterPeriod, setFilterPeriod] = useState(''); // 'lt3m' | 'lt6m' | 'lt1y' | 'ge1y'
  const [filterReason, setFilterReason] = useState('');

  const [students] = useTableData<Student>('students');

  const getEnrollMonths = (s: Student) => {
    const start = new Date(s.enrollDate);
    const end = s.withdrawDate ? new Date(s.withdrawDate) : new Date();
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  };

  const filtered = students
    .filter(s => statusFilter === 'all' ? true : s.status === statusFilter)
    .filter(s => s.name.includes(search) || s.school.includes(search))
    .filter(s => !filterGrade  || s.grade  === filterGrade)
    .filter(s => !filterSchool || s.school === filterSchool)
    .filter(s => !filterPeriod || (() => {
      const m = getEnrollMonths(s);
      if (filterPeriod === 'lt3m') return m < 3;
      if (filterPeriod === 'lt6m') return m >= 3 && m < 6;
      if (filterPeriod === 'lt1y') return m >= 6 && m < 12;
      if (filterPeriod === 'ge1y') return m >= 12;
      return true;
    })())
    .filter(s => !filterReason || s.withdrawReason === filterReason);

  // 필터 옵션 — 전체 학생 기준
  const allGrades   = [...new Set(students.map(s => s.grade))].sort();
  const allSchools  = [...new Set(students.map(s => s.school))].sort();
  const allReasons  = [...new Set(students.filter(s => s.withdrawReason).map(s => s.withdrawReason!))].sort();
  const hasFilters  = !!(filterGrade || filterSchool || filterPeriod || filterReason);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enrolledCount  = students.filter(s => s.status === 'enrolled').length;
  const withdrawnCount = students.filter(s => s.status === 'withdrawn').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">재원/퇴원생 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">재원생 {enrolledCount}명 · 퇴원생 {withdrawnCount}명</p>
        </div>
        <button
          onClick={() => { if (selectedIds.size > 0) setShowSmsModal(true); }}
          disabled={selectedIds.size === 0}
          className="btn-primary disabled:opacity-40"
        >
          📱 선택 학생 문자 발송 ({selectedIds.size})
        </button>
      </div>

      {/* 상태 필터 + 검색 */}
      <div className="flex gap-3 mb-3 flex-wrap items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'enrolled', 'withdrawn'] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${statusFilter === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
              {f === 'all' ? '전체' : f === 'enrolled' ? '재원' : '퇴원'}
            </button>
          ))}
        </div>
        {/* 검색란 — 배경 + 돋보기 아이콘 */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">🔍</span>
          <input
            className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="학생명, 학교 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 테이블 필터 행 */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 focus:outline-none focus:border-blue-300 cursor-pointer">
          <option value="">전체 학년</option>
          {allGrades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterSchool} onChange={e => setFilterSchool(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 focus:outline-none focus:border-blue-300 cursor-pointer">
          <option value="">전체 학교</option>
          {allSchools.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 focus:outline-none focus:border-blue-300 cursor-pointer">
          <option value="">전체 재원기간</option>
          <option value="lt3m">3개월 미만</option>
          <option value="lt6m">3~6개월</option>
          <option value="lt1y">6개월~1년</option>
          <option value="ge1y">1년 이상</option>
        </select>
        <select value={filterReason} onChange={e => setFilterReason(e.target.value)}
          className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-600 focus:outline-none focus:border-blue-300 cursor-pointer">
          <option value="">전체 퇴원사유</option>
          {allReasons.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setFilterGrade(''); setFilterSchool(''); setFilterPeriod(''); setFilterReason(''); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            필터 초기화
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filtered.length}명</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  onChange={e => {
                    if (e.target.checked) setSelectedIds(new Set(filtered.map(s => s.id)));
                    else setSelectedIds(new Set());
                  }}
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                />
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">학생명</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">학년 / 학교</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">학부모 연락처</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">입원일</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">퇴원일</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">재원기간</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">상태</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">퇴원사유</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} className={`hover:bg-gray-50 ${selectedIds.has(s.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                      {s.name[0]}
                    </div>
                    <span className="font-medium text-gray-800">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.grade} · {s.school}</td>
                <td className="px-4 py-3 text-gray-600">{s.parentPhone}</td>
                <td className="px-4 py-3 text-gray-500">{s.enrollDate}</td>
                <td className="px-4 py-3 text-gray-500">{s.withdrawDate ?? '-'}</td>
                <td className="px-4 py-3 text-center text-gray-600">{getEnrollMonths(s)}개월</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {s.status === 'enrolled' ? '재원' : '퇴원'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{s.withdrawReason ?? '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">문자</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-lg mb-1">문자 발송</h2>
            <p className="text-sm text-gray-500 mb-3">선택된 {selectedIds.size}명의 학부모에게 발송됩니다</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs text-gray-600 max-h-24 overflow-y-auto">
              {filtered.filter(s => selectedIds.has(s.id)).map(s => `${s.name}(${s.parentPhone})`).join(', ')}
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              rows={5}
              placeholder="발송할 메시지를 입력하세요..."
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowSmsModal(false)} className="flex-1 btn-secondary">취소</button>
              <button
                onClick={() => {
                  alert(`${selectedIds.size}명에게 문자가 발송되었습니다.`);
                  setShowSmsModal(false);
                  setSelectedIds(new Set());
                }}
                className="flex-1 btn-primary"
              >
                발송하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
