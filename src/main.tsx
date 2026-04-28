import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './lib/supabase'

// ── Supabase 비밀번호 복구 링크 처리 ─────────────────────────────────────────
// HashRouter는 URL hash를 라우트로 해석하므로, React가 렌더링되기 전에
// 복구 토큰을 직접 처리하고 hash를 일반 경로로 교체해야 함.
const _hash = window.location.hash;
if (_hash.includes('access_token') && _hash.includes('type=recovery')) {
  const params = new URLSearchParams(_hash.slice(1)); // # 제거 후 파싱
  const accessToken  = params.get('access_token')  ?? '';
  const refreshToken = params.get('refresh_token') ?? '';

  if (accessToken) {
    // Supabase에 세션 수동 설정 → PASSWORD_RECOVERY 이벤트 발생
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .catch(() => {});
  }

  // React Router 충돌 방지: hash를 일반 경로로 교체
  window.location.hash = '#/';
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
