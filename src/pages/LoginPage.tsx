import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENABLED, SUPABASE_ENABLED } from '../config/api';
import { supabaseSignUp } from '../lib/supabase';
import type { UserRole } from '../types';


const roles: {
  role: UserRole; label: string; icon: string;
  color: string; userId: string; description: string;
}[] = [
  { role: 'admin',   label: '관리자 (학원장)',      icon: '👑',      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100', userId: 'u1', description: '학원 전체 현황 관리' },
  { role: 'teacher', label: '선생님',               icon: '📚',      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',      userId: 'u2', description: '담당반 출결 및 수업 관리' },
  { role: 'staff',   label: '스탭 (데스크/부원장)', icon: '🖥️',      color: 'bg-green-50 border-green-200 hover:bg-green-100',   userId: 'u5', description: '학생관리 및 재무 관리' },
  { role: 'parent',  label: '학부모',               icon: '👨‍👩‍👧', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100', userId: 'u6', description: '자녀 출결 및 성적 확인' },
];

const ROLE_PATH: Record<UserRole, string> = {
  admin: '/admin', teacher: '/teacher', staff: '/staff', parent: '/parent',
};

const ROLE_OPTIONS = [
  { value: 'admin',   label: '👑 관리자 (학원장)' },
  { value: 'teacher', label: '📚 선생님' },
  { value: 'staff',   label: '🖥️ 스탭' },
  { value: 'parent',  label: '👨‍👩‍👧 학부모' },
];

// ─── 회원가입 폼 ───────────────────────────────────────────────────────────
function SignUpForm({ onBack }: { onBack: () => void }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [password2,setPassword2]= useState('');
  const [role,     setRole]     = useState<UserRole>('teacher');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('비밀번호가 일치하지 않습니다'); return; }
    if (password.length < 6)    { setError('비밀번호는 6자 이상이어야 합니다'); return; }
    setLoading(true);
    const result = await supabaseSignUp(email.trim(), password, name.trim(), role);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? '회원가입 실패'); return; }
    setSuccess(true);
  };

  if (success) return (
    <div className="text-center py-8 space-y-4">
      <div className="text-5xl">📋</div>
      <p className="font-bold text-gray-800">가입 신청이 완료되었습니다!</p>
      <p className="text-sm text-gray-500">
        관리자 승인 후 로그인하실 수 있습니다.<br/>
        승인까지 잠시 기다려 주세요.
      </p>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        로그인으로 돌아가기
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)}
          required autoFocus placeholder="홍길동"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          required placeholder="example@academy.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">비밀번호</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          required placeholder="6자 이상"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">비밀번호 확인</label>
        <input
          type="password" value={password2} onChange={e => setPassword2(e.target.value)}
          required placeholder="비밀번호 재입력"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">역할</label>
        <select
          value={role} onChange={e => setRole(e.target.value as UserRole)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {ROLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? '처리 중…' : '회원가입'}
      </button>
      <button
        type="button" onClick={onBack}
        className="w-full py-2.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
      >
        ← 로그인으로 돌아가기
      </button>
    </form>
  );
}

// ─── API/Supabase 로그인 폼 ────────────────────────────────────────────────
function APILoginForm() {
  const { loginWithAPI } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showSignUp, setShowSignUp] = useState(false);

  if (showSignUp) return <SignUpForm onBack={() => setShowSignUp(false)} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginWithAPI(email.trim(), password);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? '로그인 실패'); return; }
    setTimeout(() => {
      const stored = window.localStorage.getItem('ams_auth_user');
      if (stored) {
        const user = JSON.parse(stored) as { role: UserRole };
        navigate(ROLE_PATH[user.role] ?? '/');
      }
    }, 150);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          required autoFocus placeholder="example@academy.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          required placeholder="비밀번호 입력"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {loading ? '로그인 중…' : '로그인'}
      </button>

      {/* 회원가입 링크 — Supabase 모드에서만 표시 */}
      {SUPABASE_ENABLED && (
        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={() => setShowSignUp(true)}
            className="text-blue-600 font-semibold hover:underline"
          >
            회원가입
          </button>
        </p>
      )}
    </form>
  );
}

// ─── 데모 로그인 (역할 선택) ───────────────────────────────────────────────
function DemoLoginForm() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [selected, setSelected] = useState<UserRole | null>(null);

  const handleLogin = () => {
    if (!selected) return;
    const roleData = roles.find(r => r.role === selected)!;
    login(selected, roleData.userId);
    navigate(ROLE_PATH[selected]);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {roles.map(r => (
          <button
            key={r.role}
            onClick={() => setSelected(r.role)}
            className={`p-4 border-2 rounded-xl text-left transition-all ${r.color} ${
              selected === r.role ? 'ring-2 ring-blue-500 ring-offset-1' : ''
            }`}
          >
            <div className="text-2xl mb-2">{r.icon}</div>
            <div className="font-semibold text-gray-800 text-sm">{r.label}</div>
            <div className="text-gray-500 text-xs mt-0.5">{r.description}</div>
          </button>
        ))}
      </div>
      <button
        onClick={handleLogin} disabled={!selected}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        로그인
      </button>
      <p className="text-center text-xs text-gray-400 mt-4">
        데모 버전 — 계정 선택 후 바로 로그인됩니다
      </p>
    </>
  );
}

// ─── 테스트 모드 역할 선택 모달 ────────────────────────────────────────────
const TEST_ROLES: { userId: string; role: UserRole; label: string; icon: string; color: string }[] = [
  { userId: 'u_ta', role: 'admin',   label: '관리자 (학원장)',      icon: '👑',      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { userId: 'u_tt', role: 'teacher', label: '선생님',               icon: '📚',      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'       },
  { userId: 'u_ts', role: 'staff',   label: '스탭 (데스크/부원장)', icon: '🖥️',      color: 'bg-green-50 border-green-200 hover:bg-green-100'    },
  { userId: 'u_tp', role: 'parent',  label: '학부모',               icon: '👨‍👩‍👧', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'  },
];

function TestModeModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleLogin = () => {
    const t = TEST_ROLES.find(r => r.userId === selected);
    if (!t) return;
    login(t.role, t.userId);
    onClose();
    navigate(ROLE_PATH[t.role]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-gray-800">🧪 테스트 모드 체험</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
            변경사항이 실제 DB에 저장되지 않습니다.<br/>
            새로고침하면 원래 데이터로 복원됩니다.
          </p>
        </div>

        {/* 역할 선택 */}
        <div className="px-5 pb-2 space-y-2">
          {TEST_ROLES.map(r => (
            <button
              key={r.userId}
              onClick={() => setSelected(r.userId)}
              className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all ${r.color} ${
                selected === r.userId ? 'ring-2 ring-amber-400 ring-offset-1' : ''
              }`}
            >
              <span className="text-2xl">{r.icon}</span>
              <span className="font-semibold text-gray-800 text-sm">{r.label}</span>
            </button>
          ))}
        </div>

        {/* 확인 버튼 */}
        <div className="px-5 pb-5 pt-3">
          <button
            onClick={handleLogin}
            disabled={!selected}
            className="w-full py-2.5 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            테스트 모드로 입장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 로그인 페이지 ───────────────────────────────────────────────────
export default function LoginPage() {
  const [showTestModal, setShowTestModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          {/* 브랜드 박스 */}
          <div
            style={{
              background: 'rgb(1, 128, 166)',
              borderRadius: 16,
              padding: '18px 24px 16px',
              marginBottom: 20,
              maxWidth: 260,
              marginLeft: 'auto',
              marginRight: 'auto',
              boxShadow: '0 6px 22px rgba(1,128,166,0.35)',
            }}
          >
            <p
              style={{
                fontFamily: "'Gowun Dodum', sans-serif",
                fontSize: '0.72rem',
                color: '#F9A8D4',
                letterSpacing: '0.02em',
                margin: '0 0 8px',
              }}
            >학원의 성장을 꽃 피우는 관리솔루션!</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <img
                src="/bomnal-logo.png"
                alt="봄날"
                style={{ height: 42, width: 42, objectFit: 'contain', background: 'transparent' }}
              />
              <span
                style={{
                  fontFamily: "'Gowun Dodum', sans-serif",
                  fontSize: '3rem',
                  fontWeight: 400,
                  color: '#FFFFFF',
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                }}
              >봄 날</span>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            {(API_ENABLED || SUPABASE_ENABLED)
              ? '이메일과 비밀번호로 로그인하세요'
              : '로그인할 계정 유형을 선택하세요'}
          </p>
        </div>

        {(API_ENABLED || SUPABASE_ENABLED) ? <APILoginForm /> : <DemoLoginForm />}

        {/* 테스트 모드 체험 버튼 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' }}
          >
            🧪 테스트 모드로 체험하기
          </button>
        </div>
      </div>

      {showTestModal && <TestModeModal onClose={() => setShowTestModal(false)} />}
    </div>
  );
}
