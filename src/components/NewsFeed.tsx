import type { NewsItem } from '../hooks/useNews';

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
  inline?: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NewsFeed({ news, loading, inline }: NewsFeedProps) {
  if (loading && news.length === 0) {
    return <div className="text-center py-4 text-dk-textMuted text-[11px]">Loading...</div>;
  }

  if (news.length === 0) return null;

  const items = (
    <div className="space-y-1">
      {news.map((item, i) => (
        <div key={i} className="px-3 py-2 rounded-md bg-dk-card hover:bg-dk-cardHover transition-colors">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] text-dk-green font-medium">{item.sport}</span>
            <span className={`text-[9px] px-1 py-px rounded font-medium ${
              item.type === 'injury'
                ? 'bg-dk-red/10 text-dk-red'
                : 'bg-dk-accent/10 text-dk-accent'
            }`}>
              {item.type === 'injury' ? 'Injury' : 'News'}
            </span>
            <span className="text-[9px] text-dk-textMuted ml-auto">{timeAgo(item.published)}</span>
          </div>
          <p className="text-[11px] font-medium text-dk-text leading-snug">{item.title}</p>
          {item.summary && (
            <p className="text-[10px] text-dk-textSecondary mt-0.5 line-clamp-2 leading-relaxed">{item.summary}</p>
          )}
        </div>
      ))}
    </div>
  );

  if (inline) return items;

  return items;
}
