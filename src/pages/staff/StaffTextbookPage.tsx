import { useState } from 'react';
import { useTableData } from '../../hooks/useTableData';
import type { Textbook } from '../../types';

const SUBJECTS = ['영어', '수학', '국어', '과학', '사회', '기타'];

const emptyForm = (): Omit<Textbook, 'id'> => ({
  name: '', publisher: '', price: 0, subject: '',
});

export default function StaffTextbookPage() {
  const [textbooks, setTextbooks] = useTableData<Textbook>('textbooks');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = textbooks.filter(t =>
    !search || t.name.includes(search) || (t.publisher ?? '').includes(search) || (t.subject ?? '').includes(search)
  );

  const resetForm = () => { setForm(emptyForm()); setEditId(null); setShowForm(false); };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setTextbooks(prev => prev.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      const newTb: Textbook = { id: Date.now().toString(), ...form };
      setTextbooks(prev => [...prev, newTb]);
    }
    resetForm();
  };

  const handleEdit = (tb: Textbook) => {
    setForm({ name: tb.name, publisher: tb.publisher ?? '', price: tb.price, subject: tb.subject ?? '' });
    setEditId(tb.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('교재를 삭제하시겠습니까?')) return;
    setTextbooks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">교재 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">반별 수강 교재 목록을 관리합니다</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(v => !v); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <span>+</span> 교재 추가
        </button>
      </div>

      {/* 추가/수정 폼 */}
      {showForm && (
        <div className="card p-4 mb-5 border border-indigo-100">
          <h2 className="text-sm font-bold text-gray-700 mb-3">
            {editId ? '교재 수정' : '새 교재 추가'}
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">교재명 <span className="text-red-400">*</span></label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
                placeholder="예: Grammar in Use Intermediate"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">출판사</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
                placeholder="예: Cambridge"
                value={form.publisher}
                onChange={e => setForm(p => ({ ...p, publisher: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">과목</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300 bg-white"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              >
                <option value="">선택 안 함</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">가격 (원)</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-300"
                placeholder="예: 35000"
                value={form.price || ''}
                onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
            >
              {editId ? '수정 완료' : '추가'}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 검색 & 카운트 */}
      <div className="flex items-center gap-3 mb-3">
        <input
          className="flex-1 max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-300"
          placeholder="교재명 / 출판사 / 과목 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="text-xs text-gray-400">{filtered.length}종</span>
      </div>

      {/* 교재 테이블 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">교재명</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">출판사</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs">과목</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs">가격</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-300 text-sm">
                    {textbooks.length === 0 ? '등록된 교재가 없습니다. 위 "교재 추가" 버튼을 눌러 추가해주세요.' : '검색 결과가 없습니다.'}
                  </td>
                </tr>
              ) : filtered.map(tb => {
                const subjectColors: Record<string, string> = {
                  '영어': 'bg-blue-50 text-blue-600 border-blue-200',
                  '수학': 'bg-red-50 text-red-600 border-red-200',
                  '국어': 'bg-green-50 text-green-600 border-green-200',
                  '과학': 'bg-purple-50 text-purple-600 border-purple-200',
                  '사회': 'bg-yellow-50 text-yellow-600 border-yellow-200',
                };
                const subjectCls = tb.subject ? (subjectColors[tb.subject] ?? 'bg-gray-50 text-gray-500 border-gray-200') : '';
                return (
                  <tr key={tb.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{tb.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{tb.publisher ?? '—'}</td>
                    <td className="px-4 py-3">
                      {tb.subject ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${subjectCls}`}>
                          {tb.subject}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">
                      {tb.price.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(tb)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(tb.id)}
                          className="px-2.5 py-1 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center gap-4 text-xs text-gray-500">
            <span>전체 {filtered.length}종</span>
            <span>총 금액 합계 {filtered.reduce((s, t) => s + t.price, 0).toLocaleString()}원</span>
          </div>
        )}
      </div>
    </div>
  );
}
