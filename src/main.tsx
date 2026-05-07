import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './lib/supabase'

// ── 전역 에러 핸들러: React 바깥 에러(비동기·네이티브 이벤트)까지 화면에 표시 ──
function showGlobalError(msg: string) {
  // 이미 표시 중이면 스킵
  if (document.getElementById('_ams_global_err')) return;
  const el = document.createElement('div');
  el.id = '_ams_global_err';
  el.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999',
    'background:rgba(0,0,0,0.75)', 'display:flex',
    'align-items:center', 'justify-content:center', 'padding:24px',
  ].join(';');
  el.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:32px;max-width:480px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4)">
      <div style="font-size:48px;margin-bottom:12px">⚠️</div>
      <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:0 0 8px">예상치 못한 오류가 발생했습니다</h2>
      <pre style="text-align:left;font-size:11px;background:#fef2f2;color:#991b1b;border-radius:8px;padding:10px;max-height:120px;overflow:auto;margin:12px 0">${msg.slice(0, 400)}</pre>
      <button onclick="window.location.reload()" style="padding:10px 24px;background:#4f46e5;color:#fff;border:none;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer">새로고침</button>
    </div>`;
  document.body.appendChild(el);
}

window.addEventListener('error', (e) => {
  showGlobalError(e.message || String(e.error));
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
  showGlobalError(msg);
});

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
