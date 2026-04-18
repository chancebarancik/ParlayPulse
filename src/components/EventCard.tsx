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
      className="w-full text-left p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
          {event.sport}
        </span>
        <span className="text-xs text-gray-400">{timeStr}</span>
      </div>
      <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
      {event.venue && (
        <p className="text-xs text-gray-500 mt-1">{event.venue}</p>
      )}
    </button>
  );
}
