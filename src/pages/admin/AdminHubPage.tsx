import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTableData } from '../../hooks/useTableData';
import {
  supabaseAdminResetPassword,
  supabaseAdminApproveUser,
  supabaseAdminRejectUser,
  supabaseAdminCreateUser,
} from '../../lib/supabase';
import type { User, UserRole } from '../../types';

interface PendingUser {
  supabaseId: string;
  name: string;
  email: string;
  role: UserRole;
  requestedAt: string;
}

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

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin',   label: '👑 관리자 (학원장)' },
  { value: 'teacher', label: '📚 선생님' },
  { value: 'staff',   label: '🖥️ 스탭' },
  { value: 'parent',  label: '👨‍👩‍👧 학부모' },
];

/** 현재 users 배열에서 다음 app_user_id 생성 */
function nextAppId(users: User[]): string {
  const max = users.reduce((m, u) => {
    const n = parseInt(String(u.id).replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `u${max + 1}`;
}

export default function AdminHubPage() {
  const navigate = useNavigate();
  const { setViewAsUser } = useAuth();
  const [allUsers,     setAllUsers]     = useTableData<User>('users');
  const [pendingUsers, setPendingUsers] = useTableData<PendingUser>('pending_users');

  // ── 탭 ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'hub' | 'pending'>('hub');

  // ── 역할별 이동 ────────────────────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // ── 비밀번호 재설정 모달 ───────────────────────────────────────────────────
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPw,       setNewPw]       = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [resetting,   setResetting]   = useState(false);
  const [resetMsg,    setResetMsg]    = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw,      setShowPw]      = useState(false);

  // ── 승인 모달 ──────────────────────────────────────────────────────────────
  const [approveTarget, setApproveTarget] = useState<PendingUser | null>(null);
  const [approveRole,   setApproveRole]   = useState<UserRole>('teacher');
  const [approving,     setApproving]     = useState(false);
  const [approveMsg,    setApproveMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  // ── 사용자 추가 모달 ───────────────────────────────────────────────────────
  const [showCreate,      setShowCreate]      = useState(false);
  const [createName,      setCreateName]      = useState('');
  const [createEmail,     setCreateEmail]     = useState('');
  const [createRole,      setCreateRole]      = useState<UserRole>('teacher');
  const [createSendEmail, setCreateSendEmail] = useState(true);
  const [creating,        setCreating]        = useState(false);
  const [createMsg,       setCreateMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const users = selectedRole ? allUsers.filter(u => u.role === selectedRole) : [];
  const selectedConfig = roleConfig.find(r => r.role === selectedRole);

  // ── 핸들러: 역할로 이동 ───────────────────────────────────────────────────
  const handleUserSelect = (user: User) => {
    const config = roleConfig.find(r => r.role === user.role)!;
    setViewAsUser(user);
    navigate(config.path);
  };

  // ── 핸들러: 비밀번호 재설정 ──────────────────────────────────────────────
  const openResetModal = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setResetTarget(user); setNewPw(''); setConfirmPw(''); setResetMsg(null); setShowPw(false);
  };
  const closeResetModal = () => {
    setResetTarget(null); setNewPw(''); setConfirmPw(''); setResetMsg(null);
  };
  const handleResetPassword = async () => {
    if (!resetTarget) return;
    if (newPw.length < 6)   { setResetMsg({ ok: false, text: '비밀번호는 6자 이상이어야 합니다' }); return; }
    if (newPw !== confirmPw) { setResetMsg({ ok: false, text: '비밀번호가 일치하지 않습니다' }); return; }
    setResetting(true); setResetMsg(null);
    const res = await supabaseAdminResetPassword(resetTarget.email, newPw);
    setResetting(false);
    if (res.ok) {
      setResetMsg({ ok: true, text: '비밀번호가 변경되었습니다 ✅' });
      setTimeout(closeResetModal, 1800);
    } else {
      setResetMsg({ ok: false, text: res.error ?? '변경에 실패했습니다' });
    }
  };

  // ── 핸들러: 승인 ──────────────────────────────────────────────────────────
  const openApproveModal = (user: PendingUser) => {
    setApproveTarget(user);
    setApproveRole(user.role);
    setApproveMsg(null);
  };
  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true); setApproveMsg(null);
    const newAppId = nextAppId(allUsers);
    const res = await supabaseAdminApproveUser(approveTarget.supabaseId, approveRole, approveTarget.name, newAppId);
    setApproving(false);
    if (res.ok) {
      // 로컬 DB 동기화
      setPendingUsers(prev => prev.filter(p => p.supabaseId !== approveTarget.supabaseId));
      setAllUsers(prev => [...prev, { id: newAppId, name: approveTarget.name, email: approveTarget.email, role: approveRole }]);
      setApproveMsg({ ok: true, text: '승인되었습니다 ✅' });
      setTimeout(() => { setApproveTarget(null); setApproveMsg(null); }, 1500);
    } else {
      setApproveMsg({ ok: false, text: res.error ?? '승인 실패' });
    }
  };

  // ── 핸들러: 거절 ──────────────────────────────────────────────────────────
  const handleReject = async (user: PendingUser) => {
    if (!confirm(`"${user.name}" 님의 가입 신청을 거절하시겠습니까?`)) return;
    const res = await supabaseAdminRejectUser(user.supabaseId);
    if (res.ok) {
      setPendingUsers(prev => prev.filter(p => p.supabaseId !== user.supabaseId));
    } else {
      alert('거절 실패: ' + res.error);
    }
  };

  // ── 핸들러: 사용자 추가 ───────────────────────────────────────────────────
  const closeCreateModal = () => {
    setShowCreate(false); setCreateName(''); setCreateEmail('');
    setCreateRole('teacher'); setCreateMsg(null);
  };
  const handleCreate = async () => {
    if (!createName.trim() || !createEmail.trim()) return;
    setCreating(true); setCreateMsg(null);
    const newAppId = nextAppId(allUsers);
    const res = await supabaseAdminCreateUser(createEmail.trim(), createName.trim(), createRole, newAppId, createSendEmail);
    setCreating(false);
    if (res.ok) {
      setAllUsers(prev => [...prev, { id: newAppId, name: createName.trim(), email: createEmail.trim(), role: createRole }]);
      setCreateMsg({ ok: true, text: `추가 완료${createSendEmail ? ' · 비밀번호 설정 이메일 발송됨' : ''}` });
      setTimeout(closeCreateModal, 2000);
    } else {
      setCreateMsg({ ok: false, text: res.error ?? '추가 실패' });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-10">

      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-3xl">🏫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">학원관리 시스템</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {tab === 'pending' ? '가입 신청 목록' : selectedRole ? `${selectedConfig?.label} 계정을 선택하세요` : '이동할 역할을 선택하세요'}
        </p>
      </div>

      {/* 탭 + 사용자 추가 버튼 */}
      <div className="flex items-center gap-2 mb-6 w-full max-w-md">
        <div className="flex bg-gray-100 rounded-xl p-1 flex-1">
          <button
            onClick={() => { setTab('hub'); setSelectedRole(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === 'hub' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            역할별 이동
          </button>
          <button
            onClick={() => { setTab('pending'); setSelectedRole(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === 'pending' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            승인 대기
            {pendingUsers.length > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>
        {/* 사용자 추가 버튼 */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex-shrink-0"
        >
          <span className="text-base leading-none">+</span>
          <span>추가</span>
        </button>
      </div>

      {/* ── 탭: 역할별 이동 ── */}
      {tab === 'hub' && (
        <div className="w-full max-w-md">
          {/* Step 1: 역할 선택 */}
          {!selectedRole && (
            <div className="grid grid-cols-2 gap-4">
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
            <>
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
                      <button
                        onClick={() => handleUserSelect(user)}
                        className="flex-1 flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold"
                          style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                          {user.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
                          <div className="text-gray-400 text-xs truncate mt-0.5">{user.email}</div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0 ${roleBadgeColor[user.role]}`}>
                          {selectedConfig?.label}
                        </span>
                        <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-sm">›</span>
                      </button>
                      {/* 비밀번호 재설정 */}
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
            </>
          )}
        </div>
      )}

      {/* ── 탭: 승인 대기 ── */}
      {tab === 'pending' && (
        <div className="w-full max-w-md">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-sm font-medium">대기 중인 가입 신청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map(user => (
                <div key={user.supabaseId}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  {/* 사용자 정보 */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#6366F1' }}>
                      {user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
                      <div className="text-gray-400 text-xs truncate">{user.email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${roleBadgeColor[user.role]}`}>
                        {roleConfig.find(r => r.role === user.role)?.label ?? user.role}
                      </span>
                      <div className="text-gray-300 text-xs mt-1">
                        {user.requestedAt ? user.requestedAt.slice(0, 10) : ''}
                      </div>
                    </div>
                  </div>

                  {/* 역할 변경 + 승인/거절 버튼 */}
                  <div className="flex items-center gap-2">
                    <select
                      value={approveTarget?.supabaseId === user.supabaseId ? approveRole : user.role}
                      onChange={e => {
                        if (approveTarget?.supabaseId !== user.supabaseId) {
                          setApproveTarget(user);
                          setApproveMsg(null);
                        }
                        setApproveRole(e.target.value as UserRole);
                      }}
                      onClick={() => { if (!approveTarget || approveTarget.supabaseId !== user.supabaseId) { setApproveTarget(user); setApproveRole(user.role); setApproveMsg(null); } }}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400"
                    >
                      {ROLE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => { setApproveTarget(user); setApproveRole(approveTarget?.supabaseId === user.supabaseId ? approveRole : user.role); openApproveModal(user); }}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(user)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 모달: 비밀번호 재설정 */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeResetModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
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
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">새 비밀번호</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 pr-14" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    {showPw ? '숨기기' : '보기'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">비밀번호 확인</label>
                <input type={showPw ? 'text' : 'password'} value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="다시 입력"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()} />
              </div>
            </div>
            {resetMsg && (
              <p className={`text-xs mt-3 px-1 ${resetMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {resetMsg.text}
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={closeResetModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleResetPassword}
                disabled={resetting || !newPw || !confirmPw}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                {resetting ? '변경 중...' : '변경하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 승인 확인 */}
      {approveTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => { setApproveTarget(null); setApproveMsg(null); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-1">가입 승인</h3>
            <p className="text-xs text-gray-500 mb-5">
              <strong>{approveTarget.name}</strong> ({approveTarget.email})
            </p>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">부여할 역할</label>
              <select
                value={approveRole}
                onChange={e => setApproveRole(e.target.value as UserRole)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400"
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-2">
                신청 역할: <span className={`font-medium px-1.5 py-0.5 rounded ${roleBadgeColor[approveTarget.role]}`}>
                  {roleConfig.find(r => r.role === approveTarget.role)?.label}
                </span>
              </p>
            </div>

            {approveMsg && (
              <p className={`text-xs mt-3 ${approveMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {approveMsg.text}
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setApproveTarget(null); setApproveMsg(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleApprove} disabled={approving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                {approving ? '처리 중...' : '승인하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달: 사용자 추가 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeCreateModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-5">+ 새 사용자 추가</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">이름</label>
                <input type="text" value={createName} onChange={e => setCreateName(e.target.value)}
                  placeholder="홍길동" autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">이메일</label>
                <input type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)}
                  placeholder="example@academy.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">역할</label>
                <select value={createRole} onChange={e => setCreateRole(e.target.value as UserRole)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-400">
                  {ROLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* 이메일 발송 옵션 */}
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={createSendEmail}
                  onChange={e => setCreateSendEmail(e.target.checked)}
                  className="mt-0.5 rounded" />
                <div>
                  <div className="text-sm text-gray-700 font-medium">비밀번호 설정 이메일 발송</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    사용자에게 비밀번호를 직접 설정할 수 있는 링크를 이메일로 보냅니다
                  </div>
                </div>
              </label>
            </div>

            {createMsg && (
              <p className={`text-xs mt-3 px-1 ${createMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {createMsg.ok ? '✅ ' : '⚠️ '}{createMsg.text}
              </p>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={closeCreateModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleCreate}
                disabled={creating || !createName.trim() || !createEmail.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
                {creating ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
