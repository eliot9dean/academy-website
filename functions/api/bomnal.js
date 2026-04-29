/**
 * Cloudflare Pages Function — 봄날 캘린더 CORS 프록시
 * GET /api/bomnal?start=YYYY-MM-DD&end=YYYY-MM-DD&board=<board_code>
 *
 * 월별 이벤트 목록을 가져온 뒤, 각 이벤트에 bomnal.net 직접 링크를 주입합니다.
 * (calendar_view.cm / board_view.cm 은 404 반환 — 사용 불가)
 */

const BOMNAL_BASE  = 'https://www.bomnal.net';
const COMMON_HEADS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Referer'     : `${BOMNAL_BASE}/`,
  'User-Agent'  : 'Mozilla/5.0 (compatible; academy-app/1.0)',
};

export async function onRequestGet(context) {
  const urlObj = new URL(context.request.url);
  const board  = urlObj.searchParams.get('board') || 'b202604282b278728a1ac3';
  const start  = urlObj.searchParams.get('start') || '';
  const end    = urlObj.searchParams.get('end')   || '';

  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!start || !end) {
    return new Response(JSON.stringify({ _error: 'start/end required' }), { headers: cors });
  }

  try {
    // ── 월별 이벤트 목록 조회 ────────────────────────────────────────────
    const body = new URLSearchParams({ board_code: board, start, end });
    const res  = await fetch(`${BOMNAL_BASE}/ajax/calendar_data.cm`, {
      method: 'POST', headers: COMMON_HEADS, body: body.toString(),
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ _error: `bomnal HTTP ${res.status}` }),
        { headers: cors }
      );
    }

    const raw = (await res.text()).trim();
    let events = [];
    try { events = JSON.parse(raw || '[]'); } catch {
      return new Response(
        JSON.stringify({ _error: 'parse error', _raw: raw.slice(0, 300) }),
        { headers: cors }
      );
    }
    if (!Array.isArray(events)) {
      return new Response(
        JSON.stringify({ _error: 'not array', _value: String(events).slice(0, 200) }),
        { headers: cors }
      );
    }

    // ── 각 이벤트에 bomnal.net 직접 링크 주입 ──────────────────────────
    // calendar_data.cm은 url: "" 빈값 반환 → 이벤트 상세 페이지 URL로 대체
    events = events.map(ev => ({
      ...ev,
      url       : ev.url && ev.url.startsWith('http')
                    ? ev.url  // 혹시 API가 실제 URL을 반환하면 그대로 사용
                    : `${BOMNAL_BASE}/calendar?board_code=${board}&idx=${ev.id}`,
      bomnal_url: `${BOMNAL_BASE}/calendar?board_code=${board}&idx=${ev.id}`,
    }));

    return new Response(JSON.stringify(events), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ _error: String(e) }), { headers: cors });
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
