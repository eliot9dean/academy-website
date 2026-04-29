/**
 * 봄날 API 디버그 엔드포인트
 * GET /api/bomnal-debug?idx=<id>&board=<board_code>
 * → calendar_view.cm 의 실제 RAW 응답을 그대로 반환
 */
export async function onRequestGet(context) {
  const url   = new URL(context.request.url);
  const board = url.searchParams.get('board') || 'b202604282b278728a1ac3';
  const idx   = url.searchParams.get('idx')   || '';

  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const results = {};

  // calendar_view.cm 시도
  try {
    const body = new URLSearchParams({ board_code: board, idx });
    const res  = await fetch('https://www.bomnal.net/ajax/calendar_view.cm', {
      method : 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer'     : 'https://www.bomnal.net/',
        'User-Agent'  : 'Mozilla/5.0',
      },
      body: body.toString(),
    });
    results.view_status = res.status;
    results.view_raw    = await res.text();
  } catch (e) { results.view_error = String(e); }

  // board_view.cm 시도
  try {
    const body = new URLSearchParams({ board_code: board, idx });
    const res  = await fetch('https://www.bomnal.net/ajax/board_view.cm', {
      method : 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer'     : 'https://www.bomnal.net/',
        'User-Agent'  : 'Mozilla/5.0',
      },
      body: body.toString(),
    });
    results.board_status = res.status;
    results.board_raw    = await res.text();
  } catch (e) { results.board_error = String(e); }

  // 이벤트 HTML 페이지 시도
  try {
    const res = await fetch(
      `https://www.bomnal.net/calendar?board_code=${board}&idx=${idx}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bomnal.net/' } }
    );
    const html = await res.text();
    results.page_status = res.status;
    // HTML 전체는 너무 크니까 URL 관련 부분만 추출
    const urls = [...html.matchAll(/https?:\/\/[^\s"'<>]{10,}/g)].map(m => m[0]);
    const urlField = html.match(/["']url["']\s*:\s*["']([^"']+)["']/g);
    results.page_urls   = [...new Set(urls)].slice(0, 20);
    results.page_url_fields = urlField?.slice(0, 10);
  } catch (e) { results.page_error = String(e); }

  return new Response(JSON.stringify(results, null, 2), { headers: cors });
}
