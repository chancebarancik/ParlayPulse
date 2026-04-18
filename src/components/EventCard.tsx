import type { SportEvent } from '../lib/types';

interface EventCardProps {
  event: SportEvent;
  onClick?: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const date = new Date(event.commence_time);
  const timeStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border border-dk-border bg-dk-card hover:bg-dk-cardHover transition-all"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-dk-green/15 text-dk-green uppercase tracking-wider">
          {event.sport}
        </span>
        <span className="text-[10px] text-dk-textMuted">{timeStr}</span>
      </div>
      <p className="font-semibold text-white text-sm">{event.title}</p>
      {event.venue && (
        <p className="text-[10px] text-dk-textMuted mt-1">{event.venue}</p>
      )}
    </button>
  );
}
