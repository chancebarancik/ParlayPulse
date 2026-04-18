export function Header() {
  return (
    <header className="border-b border-dk-border/50 sticky top-0 z-50 bg-dk-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="ParlayPulse" className="w-9 h-9 rounded-lg" />
          <span className="text-base font-semibold text-dk-text tracking-tight">ParlayPulse</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-dk-textMuted">
          <span className="w-1.5 h-1.5 rounded-full bg-dk-green"></span>
          Live
        </div>
      </div>
    </header>
  );
}
