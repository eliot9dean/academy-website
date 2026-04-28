/**
 * Cloudflare Pages Function — 봄날 캘린더 CORS 프록시
 * GET /api/bomnal?start=YYYY-MM-DD&end=YYYY-MM-DD&board=<board_code>
 * GET /api/bomnal?idx=<event_id>&board=<board_code>  → 이벤트 상세
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const board = url.searchParams.get('board') || 'b202604282b278728a1ac3';
  const idx   = url.searchParams.get('idx')   || '';

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // ── 이벤트 상세 조회 (idx 파라미터가 있을 때) ────────────────────────────
  if (idx) {
    try {
      const body = new URLSearchParams({ board_code: board, idx });
      const res = await fetch('https://www.bomnal.net/ajax/calendar_view.cm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': 'https://www.bomnal.net/',
          'User-Agent': 'Mozilla/5.0 (compatible; academy-app/1.0)',
        },
        body: body.toString(),
      });
      const text = await res.text();
      return new Response(text.trim() || '{}', { headers: corsHeaders });
    } catch {
      return new Response('{}', { headers: corsHeaders });
    }
  }

  // ── 월별 이벤트 목록 조회 ─────────────────────────────────────────────────
  const start = url.searchParams.get('start') || '';
  const end   = url.searchParams.get('end')   || '';

  try {
    const body = new URLSearchParams({ board_code: board, start, end });

    const res = await fetch('https://www.bomnal.net/ajax/calendar_data.cm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.bomnal.net/',
        'User-Agent': 'Mozilla/5.0 (compatible; academy-app/1.0)',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ _error: `bomnal HTTP ${res.status}` }), { headers: corsHeaders });
    }

    const text = await res.text();
    const raw = text.trim() || '[]';

    let events = [];
    try { events = JSON.parse(raw); } catch (e) {
      return new Response(JSON.stringify({ _error: 'parse error', _raw: raw.slice(0, 200) }), { headers: corsHeaders });
    }

    // 배열이 아니면 디버그 정보 반환
    if (!Array.isArray(events)) {
      return new Response(JSON.stringify({ _error: 'not array', _type: typeof events, _keys: Object.keys(events ?? {}) }), { headers: corsHeaders });
    }

    // url 필드 정규화
    events = events.map(ev => {
      const rawUrl =
        ev.url || ev.link || ev.boardUrl || ev.pageUrl ||
        ev.extendedProps?.url || ev.extendedProps?.link || '';
      return { ...ev, url: rawUrl };
    });

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
