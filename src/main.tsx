import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './lib/supabase'

// ── Supabase 비밀번호 복구 링크 처리 ─────────────────────────────────────────
// HashRouter가 #access_token=xxx&type=recovery 를 라우트로 해석하기 전에 처리.
// setSession()으로 Supabase 세션을 수동 복원하고 /set-password 라우트로 이동.
const _hash = window.location.hash;
if (_hash.includes('access_token') && _hash.includes('type=recovery')) {
  const params = new URLSearchParams(_hash.slice(1)); // '#' 제거 후 파싱
  const at = params.get('access_token')  ?? '';
  const rt = params.get('refresh_token') ?? '';

  if (at) {
    // Supabase 세션 수동 설정 (비동기이지만 hash 변경 전에 시작)
    supabase.auth.setSession({ access_token: at, refresh_token: rt }).catch(() => {});
    // 복구 플래그 저장 (SetPasswordPage에서 확인)
    sessionStorage.setItem('ams_pw_recovery', '1');
  }

  // React Router가 인식하는 경로로 변경
  window.location.hash = '#/set-password';
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
