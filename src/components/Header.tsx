export function Header() {
  return (
    <header className="bg-dk-surface border-b border-dk-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-dk-green flex items-center justify-center">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ParlayPulse</h1>
            <p className="text-[10px] text-dk-green font-semibold uppercase tracking-widest">AI Parlay Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-xs text-dk-textMuted">
            <span className="w-2 h-2 rounded-full bg-dk-green animate-pulse"></span>
            Live Data
          </div>
        </div>
      </div>
    </header>
  );
}
