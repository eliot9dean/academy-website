/**
 * Cloudflare Pages Function — 봄날 캘린더 CORS 프록시
 * GET /api/bomnal?start=YYYY-MM-DD&end=YYYY-MM-DD&board=<board_code>
 *
 * 월별 이벤트 목록을 가져온 뒤, URL이 비어있는 이벤트는
 * calendar_view.cm 상세 API를 서버사이드에서 자동으로 호출해
 * URL 필드를 채워서 반환합니다.
 */

const BOMNAL_BASE = 'https://www.bomnal.net';
const FETCH_OPTS  = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': `${BOMNAL_BASE}/`,
    'User-Agent': 'Mozilla/5.0 (compatible; academy-app/1.0)',
    'Accept': 'application/json, text/plain, */*',
  },
};

/** 이벤트 상세에서 URL 추출 */
async function fetchEventUrl(board, idx) {
  const body = new URLSearchParams({ board_code: board, idx: String(idx) });

  // 1차: calendar_view.cm POST
  try {
    const res = await fetch(`${BOMNAL_BASE}/ajax/calendar_view.cm`, {
      method: 'POST', ...FETCH_OPTS, body: body.toString(),
    });
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text && text !== '{}' && text !== '[]' && text !== 'false') {
        // JSON 응답 시도
        try {
          const d = JSON.parse(text);
          // 가능한 모든 URL 필드 이름 체크
          const u =
            d.url || d.link || d.boardUrl || d.pageUrl || d.href ||
            d.content_url || d.event_url || d.redirect_url ||
            d.extendedProps?.url || d.extendedProps?.link || '';
          if (u && u.startsWith('http')) return u;
          // JSON 전체에서 http로 시작하는 문자열 값 탐색
          const found = JSON.stringify(d).match(/"https?:\/\/[^"]+"/);
          if (found) return found[0].replace(/"/g, '');
        } catch { /* HTML 응답 → 아래에서 처리 */ }
        // HTML/text 응답에서 URL 패턴 추출
        const m = text.match(/https?:\/\/[^\s"'<>]{10,}/);
        if (m) return m[0];
      }
    }
  } catch { /* 무시 */ }

  // 2차: board_view.cm POST (imweb의 다른 엔드포인트)
  try {
    const res = await fetch(`${BOMNAL_BASE}/ajax/board_view.cm`, {
      method: 'POST', ...FETCH_OPTS, body: body.toString(),
    });
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text && text.length > 2) {
        try {
          const d = JSON.parse(text);
          const u = d.url || d.link || d.boardUrl || '';
          if (u && u.startsWith('http')) return u;
        } catch {}
        const m = text.match(/https?:\/\/[^\s"'<>]{10,}/);
        if (m) return m[0];
      }
    }
  } catch { /* 무시 */ }

  return '';
}

export async function onRequestGet(context) {
  const url   = new URL(context.request.url);
  const board = url.searchParams.get('board') || 'b202604282b278728a1ac3';
  const start = url.searchParams.get('start') || '';
  const end   = url.searchParams.get('end')   || '';

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!start || !end) {
    return new Response(JSON.stringify({ _error: 'start/end required' }), { headers: corsHeaders });
  }

  try {
    // ── 1. 월별 이벤트 목록 조회 ──────────────────────────────────────────
    const body = new URLSearchParams({ board_code: board, start, end });
    const res  = await fetch(`${BOMNAL_BASE}/ajax/calendar_data.cm`, {
      method: 'POST', ...FETCH_OPTS, body: body.toString(),
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ _error: `bomnal HTTP ${res.status}` }),
        { headers: corsHeaders }
      );
    }

    const text = (await res.text()).trim();
    let events = [];
    try { events = JSON.parse(text || '[]'); } catch (e) {
      return new Response(
        JSON.stringify({ _error: 'parse error', _raw: text.slice(0, 300) }),
        { headers: corsHeaders }
      );
    }
    if (!Array.isArray(events)) {
      return new Response(
        JSON.stringify({ _error: 'not array', _type: typeof events, _value: String(events).slice(0,200) }),
        { headers: corsHeaders }
      );
    }

    // ── 2. URL이 비어있는 이벤트 → 상세 조회로 URL 채우기 ──────────────
    events = await Promise.all(events.map(async ev => {
      // 이미 URL이 있으면 그대로
      if (ev.url && ev.url.startsWith('http')) return ev;
      // 상세 조회
      const detailUrl = await fetchEventUrl(board, ev.id);
      return { ...ev, url: detailUrl };
    }));

    return new Response(JSON.stringify(events), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ _error: String(e) }), { headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
