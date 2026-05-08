import { useState, useEffect } from 'react';
import { NavLink, Navigate, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENABLED } from '../config/api';
import { changePasswordAPI } from '../hooks/useTableData';
import type { UserRole } from '../types';

/** 모바일 판정 (640px 이하) */
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);
  useEffect(() => {
    const h = () => setM(window.innerWidth <= 640);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return m;
}

interface NavItem { to: string; label: string; icon: string }

// 외부 링크 (사이드바 하단 고정 / 플로팅 버튼)
const KAKAO_CONSULT_URL = 'https://open.kakao.com/o/s2p31JWe';   // 1:1 마케팅 상담
const KAKAO_FLOAT_URL   = 'https://open.kakao.com/o/pFiLYR3h';   // 오픈톡 문의 (전 역할 공통)

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
    { to: '/staff/textbooks',  label: '교재 관리',      icon: '📚' },
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

// ─── 사이드바 로고 텍스트 ─────────────────────────────────────────────────────
// 사이드바는 다크 배경이라 컬러 로고 대신 Gowun Dodum 폰트 '봄날' 텍스트 사용
function SidebarLogo() {
  return (
    <span
      style={{
        fontFamily: "'Gowun Dodum', 'Pretendard', sans-serif",
        fontSize: '1.1rem',
        fontWeight: 400,
        color: '#FFFFFF',
        letterSpacing: '0.05em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >봄날</span>
  );
}

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
    if (newPw.length < 6)  { setError('새 비밀번호는 6자 이상이어야 합니다'); return; }
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
                  placeholder="새 비밀번호 (6자 이상)"
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
  const { currentUser, viewAsUser, setViewAsUser, logout, isTestMode, isInitializing } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile = useIsMobile();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

  // 모바일에서 라우트 이동 시 사이드바 닫기
  useEffect(() => { if (isMobile) setMobileOpen(false); }, [location.pathname, isMobile]);

  // Supabase/API 세션 확인 중 — 확인 완료 전엔 아무것도 렌더링하지 않음
  // (URL 직접 접근으로 로그인 우회 차단)
  if (isInitializing) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: '#DDE3EE' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: 'linear-gradient(135deg, #22C55E 0%, #EC4899 55%, #F59E0B 100%)' }}
          >
            <span style={{ fontSize: 26 }}>🌸</span>
          </div>
          <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>봄날 로딩 중…</span>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;

  // ── 역할 불일치 URL 접근 차단 ──────────────────────────────────────────
  // 예) 선생님이 /#/admin/schedule 을 직접 입력 → 본인 첫 메뉴로 리다이렉트
  const pathRole = (['admin', 'teacher', 'staff', 'parent'] as const).find(r =>
    location.pathname.startsWith(`/${r}`)
  );
  // viewAsUser(관리자 다른역할 보기) 중이면 displayUser 기준 체크
  const effectiveRole = (viewAsUser ?? currentUser).role;
  if (pathRole && pathRole !== effectiveRole && !(currentUser.role === 'admin' && pathRole === effectiveRole)) {
    // 관리자는 모든 경로 접근 가능(다른역할 보기), 그 외는 본인 역할 경로만 허용
    if (currentUser.role !== 'admin' || viewAsUser) {
      const firstPath = navByRole[effectiveRole][0]?.to ?? '/';
      return <Navigate to={firstPath} replace />;
    }
  }

  // 관리자가 다른 역할로 보기 중이면 해당 역할 기준으로 표시
  const displayUser = viewAsUser ?? currentUser;
  const navItems    = navByRole[displayUser.role];
  const activeItem  = navItems.find(n => location.pathname.startsWith(n.to));
  const badge       = roleBadgeDark[displayUser.role];

  return (
    <div className="flex h-screen" style={{ background: '#DDE3EE' }}>
      {/* 모바일 오버레이 배경 */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-200 ${
          isMobile
            ? `fixed inset-y-0 left-0 z-50 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : ''
        }`}
        style={{ width: isMobile ? 240 : collapsed ? 60 : 220, background: SB.bg }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
          style={{
            background: SB.bgHeader,
            borderBottom: `1px solid ${SB.divider}`,
            minHeight: 56,
            padding: collapsed ? '0 14px' : '10px 14px',
          }}
          onClick={() => { setViewAsUser(null); navigate(currentUser.role === 'admin' ? '/admin' : navItems[0].to); }}
        >
          {/* 항상 표시되는 꽃 아이콘 */}
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-xl"
            style={{
              width: 30, height: 30,
              background: 'linear-gradient(135deg, #22C55E 0%, #EC4899 55%, #F59E0B 100%)',
              boxShadow: '0 2px 8px rgba(236,72,153,0.40)',
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>🌸</span>
          </div>
          {/* 확장 상태일 때 로고 이미지 또는 텍스트 */}
          {!collapsed && (
            <SidebarLogo />
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
                {displayUser.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: SB.textMain }}>
                  {displayUser.name}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {roleLabel[displayUser.role]}
                  </span>
                  {viewAsUser && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
                      관리자 보기
                    </span>
                  )}
                </div>
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
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 flex flex-col">
          <div className="space-y-0.5">
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
          </div>

          {/* 사이드바 하단 고정: 1:1 마케팅 상담 (외부 카카오 오픈챗) */}
          <a
            href={KAKAO_CONSULT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? '1:1 마케팅 상담' : undefined}
            className="flex items-center gap-3 mx-2 mt-auto px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(251,191,36,0.10))',
              color: '#FCD34D',
              border: '1px solid rgba(250,204,21,0.35)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'linear-gradient(135deg, rgba(250,204,21,0.30), rgba(251,191,36,0.20))';
              el.style.color = '#FEF3C7';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'linear-gradient(135deg, rgba(250,204,21,0.15), rgba(251,191,36,0.10))';
              el.style.color = '#FCD34D';
            }}
          >
            <span className="text-base flex-shrink-0 leading-none">💬</span>
            {!collapsed && (
              <span
                className="truncate"
                style={{ fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '-0.01em' }}
              >
                1:1 마케팅 상담
              </span>
            )}
          </a>
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
            onClick={async () => {
              // Supabase signOut을 await해야 세션이 완전히 종료됨
              // (이전: await 없이 navigate → 다른 사람이 URL 입력 시 세션 재사용 버그)
              Object.keys(localStorage)
                .filter(k => k.startsWith('ams_'))
                .forEach(k => localStorage.removeItem(k));
              await logout();
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
            onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
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
            {activeItem?.label ?? '봄날'}
          </span>
          <div className="ml-auto flex items-center gap-2 sm:gap-3 min-w-0">
            {isTestMode && (
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
                style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
              >
                <span>🧪</span>
                <span className="hidden sm:inline">테스트 모드 — 변경사항이 저장되지 않습니다</span>
                <span className="sm:hidden">테스트</span>
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs whitespace-nowrap" style={{ color: '#94A3B8' }}>
              <span>📅</span>
              <span className="hidden sm:inline">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
                })}
              </span>
              <span className="sm:hidden">
                {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6" style={{ background: '#DDE3EE' }}>
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

      {/* 우하단 플로팅: 오픈톡 문의 (전 역할 공통) — 동그란 캡슐형 + 호버 라벨 */}
      <a
        href={KAKAO_FLOAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="오픈톡 문의"
        title="오픈톡 문의"
        className="ams-float-chat"
      >
        <span className="ams-float-icon" aria-hidden="true">💬</span>
        <span className="ams-float-label">오픈톡 문의</span>
        {/* 살랑살랑 떠오르는 펄스 링 */}
        <span className="ams-float-pulse" aria-hidden="true" />
      </a>

      <style>{`
        .ams-float-chat {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 0;
          height: 60px;
          width: 60px;
          padding: 0;
          border-radius: 9999px;
          background: linear-gradient(135deg, #FFE34A 0%, #FACC15 60%, #F59E0B 100%);
          color: #3C1E1E;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.875rem;
          box-shadow:
            0 10px 28px rgba(250,204,21,0.55),
            0 4px 10px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.5);
          overflow: hidden;
          transition:
            width 0.32s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.25s ease,
            transform 0.25s ease;
          animation: ams-float-bob 3.4s ease-in-out infinite;
        }
        .ams-float-chat:hover {
          width: 168px;
          box-shadow:
            0 14px 36px rgba(250,204,21,0.65),
            0 6px 14px rgba(0,0,0,0.18),
            inset 0 1px 0 rgba(255,255,255,0.6);
          transform: translateY(-2px);
          animation-play-state: paused;
        }
        .ams-float-icon {
          flex: 0 0 60px;
          width: 60px;
          height: 60px;
          display: grid;
          place-items: center;
          font-size: 26px;
          line-height: 1;
          filter: drop-shadow(0 1px 0 rgba(255,255,255,0.4));
        }
        .ams-float-label {
          white-space: nowrap;
          opacity: 0;
          transform: translateX(-6px);
          padding-right: 18px;
          letter-spacing: -0.01em;
          transition:
            opacity 0.2s ease 0.08s,
            transform 0.28s cubic-bezier(0.34,1.56,0.64,1) 0.04s;
        }
        .ams-float-chat:hover .ams-float-label {
          opacity: 1;
          transform: translateX(0);
        }
        .ams-float-pulse {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          pointer-events: none;
          box-shadow: 0 0 0 0 rgba(250,204,21,0.6);
          animation: ams-float-pulse 2.4s ease-out infinite;
        }
        .ams-float-chat:hover .ams-float-pulse { animation-play-state: paused; opacity: 0; }

        @keyframes ams-float-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes ams-float-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(250,204,21,0.55); }
          70%  { box-shadow: 0 0 0 14px rgba(250,204,21,0); }
          100% { box-shadow: 0 0 0 0   rgba(250,204,21,0); }
        }
        @media (max-width: 640px) {
          .ams-float-chat { height: 54px; width: 54px; right: 16px; bottom: 16px; }
          .ams-float-icon { width: 54px; height: 54px; flex-basis: 54px; font-size: 24px; }
          .ams-float-chat:hover { width: 152px; }
        }
      `}</style>
    </div>
  );
}
