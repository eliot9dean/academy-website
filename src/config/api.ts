// ─── 백엔드 설정 ──────────────────────────────────────────────────────────────
// 개발(npm run dev)          : 모두 false → localStorage 데모 모드
// PHP 호스팅 배포             : API_ENABLED=true → PHP + MySQL
// Cloudflare Pages + Supabase: SUPABASE_URL/KEY 설정 → Supabase 모드

// ── PHP 백엔드 ────────────────────────────────────────────────────────────────
export const API_URL     = (import.meta.env.VITE_API_URL     as string) ?? './api.php';
export const API_ENABLED = (import.meta.env.VITE_API_ENABLED as string) === 'true';

// ── Supabase 백엔드 ───────────────────────────────────────────────────────────
export const SUPABASE_URL      = (import.meta.env.VITE_SUPABASE_URL      as string) ?? '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '';
export const SUPABASE_ENABLED  = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
