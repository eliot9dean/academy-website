import { useEffect, useState, useRef } from 'react';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
}

interface Props {
  refreshKey?: number; // 값이 바뀌면 RSS 재요청
}

const RSS_URL      = 'https://www.bomnal.net/rss';
const RSS2JSON_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}&count=30`;
const SPEED_PX = 60; // 초당 픽셀 (클수록 빠름)

// 봄날 사이트 검색 파라미터(q=) — '전체 키워드' 검색 컨텍스트.
// 이걸 붙여서 열어야 게시물 리스트가 아닌 단일 게시물 뷰로 바로 진입한다.
const BOMNAL_Q_PARAM = 'YToxOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjt9';

const CACHE_KEY = 'ams_rss_cache_v2';

/** RSS 링크에서 idx를 뽑아 column 단일 게시물 뷰 URL로 정규화 */
function toColumnPostUrl(rawLink: string): string | null {
  if (!rawLink) return null;
  // /column 경로의 게시물만 통과 (cup, notice 등 제외)
  if (!/\/column/i.test(rawLink)) return null;
  const m = /[?&]idx=(\d+)/.exec(rawLink);
  if (!m) return null;
  return `https://www.bomnal.net/column/?q=${BOMNAL_Q_PARAM}&bmode=view&idx=${m[1]}&t=board`;
}

/** 받은 items를 column 게시물만 추리고 링크를 단일 뷰 URL로 변환 */
function normalizeItems(items: RssItem[]): RssItem[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: RssItem[] = [];
  for (const it of items) {
    const link = toColumnPostUrl(it.link);
    if (!link) continue;
    if (seen.has(link)) continue;
    seen.add(link);
    out.push({ ...it, link });
    if (out.length >= 15) break;
  }
  return out;
}

/** localStorage 캐시 읽기/쓰기 — 네트워크 깜빡일 때 깜빡임/사라짐 방지 */
function readCache(): RssItem[] {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const obj = JSON.parse(raw) as { items?: RssItem[] };
    return Array.isArray(obj.items) ? obj.items : [];
  } catch { return []; }
}
function writeCache(items: RssItem[]) {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ items, ts: Date.now() })); } catch {}
}

async function fetchRssItems(): Promise<RssItem[]> {
  // 1순위: Cloudflare Pages Function
  try {
    const res = await fetch('/api/rss');
    if (res.ok) {
      const data = await res.json() as { status: string; items: RssItem[] };
      const list = normalizeItems(data?.items ?? []);
      if (list.length > 0) return list;
    }
  } catch { /* 폴백으로 진행 */ }

  // 2순위: rss2json.com
  try {
    const res = await fetch(RSS2JSON_URL);
    const data = await res.json() as { status: string; items: RssItem[] };
    const list = normalizeItems(data?.items ?? []);
    if (list.length > 0) return list;
  } catch { /* 폴백으로 진행 */ }

  // 3순위: 캐시 (이전에 한 번이라도 성공했으면 그걸 표시)
  return readCache();
}

export default function RssTicker({ refreshKey = 0 }: Props) {
  const [items, setItems] = useState<RssItem[]>([]);
  const [error, setError] = useState(false);
  const trackRef  = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);

  // 첫 마운트 시 캐시를 즉시 표시 (네트워크 대기 동안 비어 보이는 것 방지)
  useEffect(() => {
    const cached = readCache();
    if (cached.length > 0) setItems(cached);
  }, []);

  // RSS 가져오기 (refreshKey 변경 시 재요청)
  useEffect(() => {
    setError(false);
    fetchRssItems()
      .then(list => {
        if (list.length > 0) {
          setItems(list);
          writeCache(list);
        } else if (items.length === 0) {
          setError(true);
        }
        // 새로 가져왔는데 0개면 기존 items를 유지 (사라지지 않게)
      })
      .catch(() => { if (items.length === 0) setError(true); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  // 트랙 길이에 따라 애니메이션 속도 계산
  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    const w = trackRef.current.scrollWidth / 2; // 복사본 포함 절반
    setDuration(Math.round(w / SPEED_PX));
  }, [items]);

  if (error || items.length === 0) return null;

  // 무한 루프를 위해 목록 2배 복사
  const doubled = [...items, ...items];

  return (
    <div
      className="flex items-center gap-0 rounded-xl overflow-hidden mb-4"
      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', height: 38 }}
    >
      {/* 라벨 */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3 h-full text-xs font-bold"
        style={{ background: '#3B82F6', color: '#fff', whiteSpace: 'nowrap' }}
      >
        <span>📢</span>
        <span>뼈때리는 마케팅</span>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div
          ref={trackRef}
          className="flex items-center h-full"
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap',
            animation: `rss-scroll ${duration}s linear infinite`,
          }}
        >
          {doubled.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 text-xs hover:underline"
              style={{ color: '#1E40AF', flexShrink: 0 }}
            >
              <span style={{ color: '#93C5FD' }}>●</span>
              <span className="font-medium">{item.title}</span>
              <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                {item.pubDate?.slice(0, 10)}
              </span>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes rss-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
