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
      className="w-full text-left px-4 py-3 rounded-lg bg-dk-card hover:bg-dk-cardHover transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[11px] text-dk-green font-medium">{event.sport}</span>
        <span className="text-[11px] text-dk-textMuted">{timeStr}</span>
      </div>
      <p className="font-medium text-dk-text text-[13px]">{event.title}</p>
      {event.venue && (
        <p className="text-[11px] text-dk-textMuted mt-0.5">{event.venue}</p>
      )}
    </button>
  );
}
