import { useEffect, useState, useRef } from 'react';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
}

interface Props {
  refreshKey?: number; // 값이 바뀌면 RSS 재요청
}

const RSS_URL  = 'https://www.bomnal.net/rss';
const API_URL  = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}&count=10`;
const SPEED_PX = 60; // 초당 픽셀 (클수록 빠름)

export default function RssTicker({ refreshKey = 0 }: Props) {
  const [items, setItems] = useState<RssItem[]>([]);
  const [error, setError] = useState(false);
  const trackRef  = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);

  // RSS 가져오기 (refreshKey 변경 시 재요청)
  useEffect(() => {
    setError(false);
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok' && Array.isArray(data.items)) {
          setItems(data.items.slice(0, 10));
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
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
        <span>봄날 소식</span>
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
