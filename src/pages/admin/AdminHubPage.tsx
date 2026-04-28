import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTableData } from '../../hooks/useTableData';
import { supabaseAdminResetPassword } from '../../lib/supabase';
import type { User, UserRole } from '../../types';

const roleConfig = [
  { role: 'admin'   as UserRole, label: '관리자 (학원장)',      icon: '👑', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100', path: '/admin/classes',    description: '학원 전체 현황 관리' },
  { role: 'teacher' as UserRole, label: '선생님',               icon: '📚', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',        path: '/teacher/classes',  description: '담당반 출결 및 수업 관리' },
  { role: 'staff'   as UserRole, label: '스탭 (데스크/부원장)', icon: '🖥️', color: 'bg-green-50 border-green-200 hover:bg-green-100',     path: '/staff/students',   description: '학생관리 및 재무 관리' },
  { role: 'parent'  as UserRole, label: '학부모',               icon: '👨‍👩‍👧', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100', path: '/parent/dashboard', description: '자녀 출결 및 성적 확인' },
];

const roleBadgeColor: Record<UserRole, string> = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  staff:   'bg-green-100 text-green-700',
  parent:  'bg-orange-100 text-orange-700',
};

export default function AdminHubPage() {
  const navigate = useNavigate();
  const { setViewAsUser } = useAuth();
  const [allUsers] = useTableData<User>('users');

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 비밀번호 재설정 모달
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);

  // 선택된 역할의 사용자만 필터
  const users = selectedRole ? allUsers.filter(u => u.role === selectedRole) : [];

  const handleUserSelect = (user: User) => {
    const config = roleConfig.find(r => r.role === user.role)!;
    setViewAsUser(user);
    navigate(config.path);
  };

  const openResetModal = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setResetTarget(user);
    setNewPw('');
    setConfirmPw('');
    setResetMsg(null);
    setShowPw(false);
  };

  const closeResetModal = () => {
    setResetTarget(null);
    setNewPw('');
    setConfirmPw('');
    setResetMsg(null);
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (newPw.length < 6) {
      setResetMsg({ ok: false, text: '비밀번호는 6자 이상이어야 합니다' });
      return;
    }
    if (newPw !== confirmPw) {
      setResetMsg({ ok: false, text: '비밀번호가 일치하지 않습니다' });
      return;
    }
    setResetting(true);
    setResetMsg(null);
    const result = await supabaseAdminResetPassword(resetTarget.email, newPw);
    setResetting(false);
    if (result.ok) {
      setResetMsg({ ok: true, text: '비밀번호가 변경되었습니다 ✅' });
      setTimeout(closeResetModal, 1800);
    } else {
      setResetMsg({ ok: false, text: result.error ?? '변경에 실패했습니다' });
    }
  };

  const selectedConfig = roleConfig.find(r => r.role === selectedRole);

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-12">
      {/* 헤더 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">🏫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">학원관리 시스템</h1>
        <p className="text-gray-500 mt-2 text-sm">
          {selectedRole ? `${selectedConfig?.label} 계정을 선택하세요` : '이동할 역할을 선택하세요'}
        </p>
      </div>

      {/* Step 1: 역할 선택 */}
      {!selectedRole && (
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {roleConfig.map(r => (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={`p-5 border-2 rounded-2xl text-left transition-all shadow-sm hover:shadow-md ${r.color}`}
            >
              <div className="text-3xl mb-3">{r.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
              <div className="text-gray-500 text-xs mt-1">{r.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: 사용자 선택 */}
      {selectedRole && (
        <div className="w-full max-w-md">
          {/* 뒤로 가기 */}
          <button
            onClick={() => setSelectedRole(null)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
          >
            ← 역할 선택으로 돌아가기
          </button>

          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">{selectedConfig?.icon}</div>
              <p className="text-sm">등록된 {selectedConfig?.label} 계정이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  {/* 사용자 선택 버튼 */}
                  <button
                    onClick={() => handleUserSelect(user)}
                    className="flex-1 flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
                  >
                    {/* 아바타 */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                      {user.name[0]}
                    </div>
                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
                      <div className="text-gray-400 text-xs truncate mt-0.5">{user.email}</div>
                    </div>
                    {/* 배지 */}
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${roleBadgeColor[user.role]}`}>
                      {selectedConfig?.label}
                    </span>
                    <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm">›</span>
                  </button>

                  {/* 비밀번호 재설정 버튼 */}
                  <button
                    onClick={(e) => openResetModal(e, user)}
                    className="p-3 rounded-xl bg-gray-100 hover:bg-amber-100 hover:text-amber-600 text-gray-400 transition-colors flex-shrink-0"
                    title="비밀번호 재설정"
                  >
                    🔑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 비밀번호 재설정 모달 ── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeResetModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                {resetTarget.name[0]}
              </div>
              <div>
                <div className="font-bold text-gray-800 text-sm">{resetTarget.name}</div>
                <div className="text-gray-400 text-xs">{resetTarget.email}</div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 text-sm mb-4">🔑 비밀번호 재설정</h3>

            <div className="space-y-3">
              {/* 새 비밀번호 */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                  >
                    {showPw ? '숨기기' : '보기'}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">비밀번호 확인</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="다시 입력"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                />
              </div>
            </div>

            {/* 결과 메시지 */}
            {resetMsg && (
              <p className={`text-xs mt-3 px-1 ${resetMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {resetMsg.text}
              </p>
            )}

            {/* 버튼 */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={closeResetModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPw || !confirmPw}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {resetting ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
