import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function SetPasswordPage() {
  const { setIsPasswordRecovery } = useAuth();
  const [pw,      setPw]      = useState('');
  const [pw2,     setPw2]     = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pw.length < 6)  { setError('비밀번호는 6자 이상이어야 합니다'); return; }
    if (pw !== pw2)      { setError('비밀번호가 일치하지 않습니다'); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      // 2초 후 로그인 화면으로
      setTimeout(() => {
        setIsPasswordRecovery(false);
        // 세션 정리
        supabase.auth.signOut().catch(() => {});
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🏫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">새 비밀번호 설정</h1>
          <p className="text-gray-500 mt-2 text-sm">사용할 비밀번호를 입력해주세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <div className="text-5xl">✅</div>
              <p className="font-bold text-gray-800">비밀번호가 설정되었습니다!</p>
              <p className="text-sm text-gray-500">로그인 화면으로 이동합니다...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pw}
                    onChange={e => setPw(e.target.value)}
                    required autoFocus
                    placeholder="6자 이상 입력"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw2}
                  onChange={e => setPw2(e.target.value)}
                  required
                  placeholder="비밀번호 재입력"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '설정 중...' : '비밀번호 설정하기'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
