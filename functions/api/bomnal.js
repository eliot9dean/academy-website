/**
 * Cloudflare Pages Function — 봄날 캘린더 CORS 프록시
 * GET /api/bomnal?start=YYYY-MM-DD&end=YYYY-MM-DD&board=<board_code>
 *
 * 브라우저에서 bomnal.net POST 요청 시 CORS 차단 문제를 우회하기 위해
 * 서버(Edge) 측에서 대신 POST 요청을 전달합니다.
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const start = url.searchParams.get('start') || '';
  const end   = url.searchParams.get('end')   || '';
  const board = url.searchParams.get('board') || 'b202604282b278728a1ac3';

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

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

    const text = await res.text();
    // 빈 응답이면 빈 배열 반환
    const json = text.trim() || '[]';
    return new Response(json, { headers: corsHeaders });
  } catch {
    return new Response('[]', { headers: corsHeaders });
  }
}

// OPTIONS preflight 대응
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
