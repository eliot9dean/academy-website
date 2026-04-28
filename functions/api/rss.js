/**
 * Cloudflare Pages Function — 봄날 RSS 직접 파싱 프록시
 * GET /api/rss
 * rss2json.com 캐시 문제 없이 최신 게시글을 바로 가져옵니다.
 */
export async function onRequestGet() {
  const corsHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const res = await fetch('https://www.bomnal.net/rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; academy-app/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    const xml = await res.text();

    // RSS <item> 파싱 (CDATA 포함)
    const items = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null && items.length < 15) {
      const block = m[1];
      const get = (tag) => {
        const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
        return (r.exec(block)?.[1] ?? '').trim();
      };
      const title   = get('title');
      const link    = get('link');
      const pubDate = get('pubDate');
      if (title) items.push({ title, link, pubDate });
    }

    return new Response(JSON.stringify({ status: 'ok', items }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'error', items: [], message: String(e) }), {
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
