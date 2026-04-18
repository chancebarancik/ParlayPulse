import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import { BOOKS, SPORTS, type NewParlay, type Parlay, type ParlayStatus } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (p: NewParlay) => Promise<void>;
  editing?: Parlay | null;
  onUpdate?: (id: string, p: NewParlay) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

type ScanState = 'idle' | 'scanning' | 'done' | 'error';

interface ScanResult {
  book?: string;
  sport?: string;
  wager?: number;
  payout?: number;
  odds?: string;
  legs?: string[];
}

const MAX_SCAN_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_SCAN_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const SCAN_ENABLED = import.meta.env.VITE_ENABLE_SCAN === 'true';

function normalizeSport(value?: string) {
  if (!value) return '';
  const normalized = value.trim().toUpperCase();
  if (normalized === 'MMA' || normalized === 'UFC' || normalized === 'MIXED MARTIAL ARTS') {
    return 'UFC';
  }
  return value.trim();
}

export function AddParlayModal({ open, onClose, onCreate, editing, onUpdate, onDelete }: Props) {
  const isEdit = Boolean(editing);
  const [book, setBook] = useState('');
  const [sport, setSport] = useState('');
  const [wager, setWager] = useState('');
  const [payout, setPayout] = useState('');
  const [odds, setOdds] = useState('');
  const [status, setStatus] = useState<ParlayStatus>('pending');
  const [legs, setLegs] = useState<string[]>(['', '', '']);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoSaveIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setBook(editing.book);
      setSport(editing.sport);
      setWager(String(editing.wager));
      setPayout(String(editing.payout));
      setOdds(editing.odds ?? '');
      setStatus(editing.status);
      setLegs(editing.legs.length ? editing.legs : ['']);
      setScanned(editing.scanned);
    } else {
      setBook('');
      setSport('');
      setWager('');
      setPayout('');
      setOdds('');
      setStatus('pending');
      setLegs(['', '', '']);
      setScanned(false);
    }
    setScanState('idle');
    setError(null);
    setDragOver(false);
  }, [open, editing]);

  const handleFile = async (file: File) => {
    if (!SCAN_ENABLED) {
      setScanState('error');
      setError('Bet-slip scanning is disabled in this environment.');
      return;
    }
    if (!(ALLOWED_SCAN_MIME_TYPES as readonly string[]).includes(file.type)) {
      setScanState('error');
      setError('Use a PNG, JPEG, or WebP image.');
      return;
    }
    if (file.size > MAX_SCAN_FILE_SIZE) {
      setScanState('error');
      setError('Image must be 5MB or smaller.');
      return;
    }
    setScanState('scanning');
    setError(null);
    try {
      const b64 = await fileToBase64(file);
      const resp = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ image: b64, mime: file.type }),
      });
      if (!resp.ok) {
        const payload = (await resp.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Scan failed (${resp.status})`);
      }
      const data = (await resp.json()) as ScanResult;
      const normalizedSport = normalizeSport(data.sport);
      if (data.book && (BOOKS as readonly string[]).includes(data.book)) setBook(data.book);
      if (normalizedSport && (SPORTS as readonly string[]).includes(normalizedSport)) {
        setSport(normalizedSport);
      }
      if (typeof data.wager === 'number') setWager(String(data.wager));
      if (typeof data.payout === 'number') setPayout(String(data.payout));
      if (data.odds) setOdds(data.odds);
      if (data.legs?.length) setLegs(data.legs);
      setScanState('done');
      setScanned(true);
    } catch (err) {
      setScanState('error');
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) void handleFile(f);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
  };

  const buildPayload = (overrides: Partial<NewParlay> = {}): NewParlay => ({
    book: overrides.book ?? (book || 'Other'),
    sport: overrides.sport ?? (sport || 'Mixed'),
    wager: overrides.wager ?? (parseFloat(wager) || 0),
    payout: overrides.payout ?? (parseFloat(payout) || 0),
    odds: overrides.odds ?? (odds || null),
    status: overrides.status ?? status,
    legs: overrides.legs ?? legs.map((l) => l.trim()).filter(Boolean),
    scanned: overrides.scanned ?? scanned,
  });

  const autoSaveEdit = async (overrides: Partial<NewParlay>) => {
    if (!isEdit || !editing || !onUpdate) return;
    const requestId = autoSaveIdRef.current + 1;
    autoSaveIdRef.current = requestId;
    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(editing.id, buildPayload(overrides));
    } catch (err) {
      if (autoSaveIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : 'Failed to save');
      }
    } finally {
      if (autoSaveIdRef.current === requestId) {
        setSubmitting(false);
      }
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanLegs = buildPayload().legs;
    if (!cleanLegs.length) {
      setError('Add at least one leg.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const payload = buildPayload({ legs: cleanLegs });
    try {
      if (isEdit && editing && onUpdate) {
        await onUpdate(editing.id, payload);
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || !onDelete) return;
    if (!confirm('Delete this parlay?')) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete(editing.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl w-full max-w-md my-auto shadow-xl"
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-line sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold">{isEdit ? 'Edit Parlay' : 'Add Parlay'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-canvas text-muted hover:bg-line text-sm"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {SCAN_ENABLED && !isEdit ? (
            <>
              <div
                onClick={() => scanState !== 'done' && fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors min-h-[110px] flex flex-col items-center justify-center gap-1.5 ${
                  scanState === 'done'
                    ? 'border-win bg-emerald-50 cursor-default'
                    : scanState === 'scanning' || dragOver
                      ? 'border-accent bg-blue-50'
                      : 'border-line hover:border-accent hover:bg-blue-50/40'
                }`}
              >
                {scanState === 'scanning' ? (
                  <>
                    <div className="text-[13px] font-semibold text-accent animate-pulse">
                      Reading ticket…
                    </div>
                    <div className="text-[11px] text-muted">
                      Scan extraction is reading your bet slip
                    </div>
                  </>
                ) : scanState === 'done' ? (
                  <>
                    <div className="text-2xl">✓</div>
                    <div className="text-[13px] font-semibold text-win">Scanned</div>
                    <div className="text-[11px] text-muted">
                      Review fields below and edit anything
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-2xl">📸</div>
                    <div className="text-[13px] font-semibold">Scan your bet slip</div>
                    <div className="text-[11px] text-muted">
                      Tap to upload or drop a screenshot
                    </div>
                    {scanState === 'error' && (
                      <div className="text-[11px] text-loss mt-1">
                        Scan failed — fill in manually
                      </div>
                    )}
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />

              <div className="text-[11px] text-muted text-center">or fill in manually</div>
            </>
          ) : !isEdit ? (
            <div className="rounded-xl bg-canvas border border-line p-4 text-center">
              <div className="text-[13px] font-semibold text-ink">Manual entry mode</div>
              <div className="text-[11px] text-muted mt-1">
                Bet-slip scanning is disabled for this deployment.
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sportsbook">
              <select
                value={book}
                onChange={(e) => {
                  const nextBook = e.target.value;
                  setBook(nextBook);
                  void autoSaveEdit({ book: nextBook || 'Other' });
                }}
                className="input"
              >
                <option value="">Select…</option>
                {BOOKS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Sport">
              <select
                value={sport}
                onChange={(e) => {
                  const nextSport = e.target.value;
                  setSport(nextSport);
                  void autoSaveEdit({ sport: nextSport || 'Mixed' });
                }}
                className="input"
              >
                <option value="">Select…</option>
                {SPORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Wager ($)">
              <input
                type="number"
                step="0.01"
                placeholder="25.00"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="To win ($)">
              <input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={payout}
                onChange={(e) => setPayout(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Odds">
              <input
                type="text"
                placeholder="+450"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => {
                  const nextStatus = e.target.value as ParlayStatus;
                  setStatus(nextStatus);
                  void autoSaveEdit({ status: nextStatus });
                }}
                className="input"
              >
                <option value="pending">Pending</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
              </select>
            </Field>
          </div>

          <div>
            <div className="text-[11px] text-muted font-medium mb-1.5">Legs</div>
            <div className="space-y-1.5">
              {legs.map((leg, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={leg}
                    placeholder="e.g. Lakers ML"
                    onChange={(e) =>
                      setLegs((prev) =>
                        prev.map((l, j) => (j === i ? e.target.value : l)),
                      )
                    }
                    className="input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLegs((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="w-6 h-6 text-muted hover:text-loss text-lg leading-none"
                    aria-label="Remove leg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLegs((prev) => [...prev, ''])}
              className="text-xs text-accent font-medium mt-2"
            >
              + Add leg
            </button>
          </div>

          {error && <div className="text-xs text-loss">{error}</div>}
        </div>

        <div className="px-5 py-4 border-t border-line flex gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="px-4 py-2.5 rounded-lg bg-canvas border border-line text-sm text-loss hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? '…' : 'Delete'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-canvas border border-line text-sm"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || deleting}
            className="flex-1 py-2.5 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-black disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add Parlay'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-muted font-medium">{label}</label>
      {children}
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
