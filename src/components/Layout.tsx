import { useState } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENABLED } from '../config/api';
import { changePasswordAPI } from '../hooks/useTableData';
import type { UserRole } from '../types';

interface NavItem { to: string; label: string; icon: string }

const navByRole: Record<UserRole, NavItem[]> = {
  admin: [
    { to: '/admin/classes',      label: '선생님별 수업현황', icon: '🏫' },
    { to: '/admin/schedule',     label: '일정 관리',       icon: '📅' },
    { to: '/admin/daily-reports',label: '데일리 리포트',   icon: '📨' },
    { to: '/admin/conversion',   label: '등록전환율',      icon: '📊' },
    { to: '/admin/withdrawal',   label: '퇴원 분석',       icon: '📉' },
    { to: '/admin/finance',      label: '재무현황',        icon: '💰' },
    { to: '/admin/database',     label: 'DB 관리',         icon: '🗄️' },
  ],
  teacher: [
    { to: '/teacher/classes',    label: '내 담당반', icon: '📚' },
    { to: '/teacher/lesson-log', label: '수업일지',  icon: '📝' },
  ],
  staff: [
    { to: '/staff/students',   label: '학생 정보',      icon: '👤' },
    { to: '/staff/tuition',    label: '수강 관리',      icon: '📒' },
    { to: '/staff/enrollment', label: '재원/퇴원 관리', icon: '📋' },
    { to: '/staff/finance',    label: '재무 관리',      icon: '💰' },
  ],
  parent: [
    { to: '/parent/dashboard', label: '자녀 현황', icon: '🏠' },
  ],
};

const roleLabel: Record<UserRole, string> = {
  admin: '관리자', teacher: '선생님', staff: '스탭', parent: '학부모',
};

const roleBadgeDark: Record<UserRole, { bg: string; text: string }> = {
  admin:   { bg: 'rgba(139,92,246,0.25)', text: '#C4B5FD' },
  teacher: { bg: 'rgba(59,130,246,0.25)', text: '#93C5FD' },
  staff:   { bg: 'rgba(16,185,129,0.25)', text: '#6EE7B7' },
  parent:  { bg: 'rgba(251,191,36,0.2)',  text: '#FCD34D' },
};

const SB = {
  bg:         '#1A2236',
  bgHeader:   '#141C2E',
  bgHover:    'rgba(255,255,255,0.10)',
  bgActive:   '#4F46E5',
  divider:    'rgba(255,255,255,0.10)',
  textMain:   '#E2E8F0',
  textSub:    '#94A3B8',
  textHover:  '#F1F5F9',
  textActive: '#FFFFFF',
  iconActive: '#A5B4FC',
};

// ─── 비밀번호 변경 모달 ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose, currentEmail }: { onClose: () => void; currentEmail: string }) {
  const [oldPw,  setOldPw]  = useState('');
  const [newPw,  setNewPw]  = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPw !== newPw2) { setError('새 비밀번호가 일치하지 않습니다'); return; }
    if (newPw.length < 4)  { setError('새 비밀번호는 4자 이상이어야 합니다'); return; }
    setLoading(true);
    const result = await changePasswordAPI(oldPw, newPw, currentEmail);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? '변경 실패'); return; }
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  return (
    /* 오버레이 */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">🔑 비밀번호 변경</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >×</button>
        </div>

        {/* 바디 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {success ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-green-600 font-semibold">비밀번호가 변경되었습니다!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">현재 비밀번호</label>
                <input
                  type="password"
                  value={oldPw}
                  onChange={e => setOldPw(e.target.value)}
                  required
                  autoFocus
                  placeholder="현재 비밀번호 입력"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  required
                  placeholder="새 비밀번호 (4자 이상)"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={newPw2}
                  onChange={e => setNewPw2(e.target.value)}
                  required
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '변경 중…' : '변경하기'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ─── 메인 레이아웃 ─────────────────────────────────────────────────────────
export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed,   setCollapsed]   = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  if (!currentUser) { navigate('/'); return null; }

  const navItems   = navByRole[currentUser.role];
  const activeItem = navItems.find(n => location.pathname.startsWith(n.to));
  const badge      = roleBadgeDark[currentUser.role];

  return (
    <div className="flex h-screen" style={{ background: '#DDE3EE' }}>
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200"
        style={{ width: collapsed ? 60 : 220, background: SB.bg }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-4 h-14 cursor-pointer"
          style={{ background: SB.bgHeader, borderBottom: `1px solid ${SB.divider}` }}
          onClick={() => { logout(); navigate('/'); }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <span className="text-sm">🏫</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight" style={{ color: SB.textMain }}>
              학원관리 시스템
            </span>
          )}
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="px-3 py-3" style={{ borderBottom: `1px solid ${SB.divider}` }}>
            <div className="flex items-center gap-2.5 px-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.3)', color: '#A5B4FC' }}
              >
                {currentUser.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: SB.textMain }}>
                  {currentUser.name}
                </div>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                  style={{ background: badge.bg, color: badge.text }}
                >
                  {roleLabel[currentUser.role]}
                </span>
              </div>
              {/* 비밀번호 변경 버튼 — API 모드에서만 표시 */}
              {API_ENABLED && (
                <button
                  onClick={() => setShowPwModal(true)}
                  title="비밀번호 변경"
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: SB.textSub }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
                    (e.currentTarget as HTMLElement).style.color = SB.textMain;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = SB.textSub;
                  }}
                >
                  🔑
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{
                  background: isActive ? SB.bgActive : 'transparent',
                  color:      isActive ? SB.textActive : SB.textMain,
                  boxShadow:  isActive ? '0 2px 8px rgba(79,70,229,0.45)' : 'none',
                }}
                onMouseEnter={e => {
                  if (isActive) return;
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = SB.bgHover;
                  el.style.color      = SB.textHover;
                }}
                onMouseLeave={e => {
                  if (isActive) return;
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'transparent';
                  el.style.color      = SB.textMain;
                }}
              >
                <span className="text-base flex-shrink-0 leading-none">{item.icon}</span>
                {!collapsed && (
                  <span
                    className="truncate"
                    style={{
                      fontSize:      '0.8125rem',
                      fontWeight:    isActive ? 700 : 500,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {isActive && !collapsed && (
                  <span
                    className="ml-auto rounded-full flex-shrink-0"
                    style={{ width: 4, height: 18, background: 'rgba(255,255,255,0.7)' }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* 사이드바 접혔을 때 비밀번호 변경 버튼 */}
        {collapsed && API_ENABLED && (
          <div className="px-2 pb-1" style={{ borderTop: `1px solid ${SB.divider}` }}>
            <button
              onClick={() => setShowPwModal(true)}
              title="비밀번호 변경"
              className="w-full flex items-center justify-center py-2 rounded-lg transition-all"
              style={{ color: SB.textSub }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                (e.currentTarget as HTMLElement).style.color = SB.textMain;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = SB.textSub;
              }}
            >
              🔑
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="p-2" style={{ borderTop: `1px solid ${SB.divider}`, background: SB.bgHeader }}>
          <button
            onClick={() => {
              Object.keys(localStorage)
                .filter(k => k.startsWith('ams_'))
                .forEach(k => localStorage.removeItem(k));
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ color: SB.textSub }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#FCA5A5';
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = SB.textSub;
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <span className="text-sm flex-shrink-0">🚪</span>
            {!collapsed && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="h-14 flex items-center px-5 gap-3 flex-shrink-0"
          style={{ background: '#FFFFFF', borderBottom: '1px solid #DDE3EE' }}
        >
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#94A3B8' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect y="2"    width="16" height="1.5" rx="0.75"/>
              <rect y="7.25" width="16" height="1.5" rx="0.75"/>
              <rect y="12.5" width="16" height="1.5" rx="0.75"/>
            </svg>
          </button>
          <div className="h-4 w-px" style={{ background: '#E2E8F0' }} />
          <span className="text-sm font-semibold" style={{ color: '#334155' }}>
            {activeItem?.label ?? '학원관리 시스템'}
          </span>
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: '#94A3B8' }}>
            <span>📅</span>
            <span>
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
              })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6" style={{ background: '#DDE3EE' }}>
          <Outlet />
        </main>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <ChangePasswordModal
          onClose={() => setShowPwModal(false)}
          currentEmail={currentUser.email ?? ''}
        />
      )}
    </div>
  );
}
