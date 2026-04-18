import { useState } from 'react';
import type { NewsItem } from '../hooks/useNews';

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NewsFeed({ news, loading }: NewsFeedProps) {
  const [open, setOpen] = useState(true);

  if (loading && news.length === 0) {
    return <div className="text-center py-8 text-dk-textMuted text-[12px]">Loading news...</div>;
  }

  if (news.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 w-full text-left py-2"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`text-dk-textMuted transition-transform ${open ? 'rotate-90' : ''}`}
        >
          <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-semibold text-dk-text">Sports Intel</span>
        <span className="text-[11px] text-dk-textMuted">{news.length}</span>
      </button>
      {open && (
        <div className="space-y-1 pt-1">
          {news.map((item, i) => (
            <div key={i} className="px-4 py-2.5 rounded-lg bg-dk-card hover:bg-dk-cardHover transition-colors">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] text-dk-green font-medium">{item.sport}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  item.type === 'injury'
                    ? 'bg-dk-red/10 text-dk-red'
                    : 'bg-dk-accent/10 text-dk-accent'
                }`}>
                  {item.type === 'injury' ? 'Injury' : 'News'}
                </span>
                <span className="text-[10px] text-dk-textMuted ml-auto">{timeAgo(item.published)}</span>
              </div>
              <p className="text-[12px] font-medium text-dk-text leading-snug">{item.title}</p>
              {item.summary && (
                <p className="text-[11px] text-dk-textSecondary mt-0.5 line-clamp-2 leading-relaxed">{item.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
