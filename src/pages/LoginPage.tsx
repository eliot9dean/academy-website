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

// ─── 메인 로그인 페이지 ───────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🏫</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">학원관리 시스템</h1>
          <p className="text-gray-500 mt-2">
            {(API_ENABLED || SUPABASE_ENABLED)
              ? '이메일과 비밀번호로 로그인하세요'
              : '로그인할 계정 유형을 선택하세요'}
          </p>
        </div>

        {(API_ENABLED || SUPABASE_ENABLED) ? <APILoginForm /> : <DemoLoginForm />}
      </div>
    </div>
  );
}
