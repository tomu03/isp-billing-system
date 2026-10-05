import { useEffect } from 'react';
import { X, Inbox } from 'lucide-react';

export function StatCard({ label, value, sub, accent = 'signal', icon: Icon }) {
  const accentMap = {
    signal: 'bg-signal/10 text-signal-dark',
    amber: 'bg-amber/15 text-amber',
    rose: 'bg-rose/15 text-rose',
    ink: 'bg-ink-900/8 text-ink-800'
  };
  return (
    <div className="bg-white border border-line rounded-lg p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div className="text-[12px] font-medium text-ink-600">{label}</div>
        {Icon && <div className={`w-7 h-7 rounded-md flex items-center justify-center ${accentMap[accent]}`}><Icon size={14} /></div>}
      </div>
      <div className="text-2xl font-extrabold text-ink-900 mt-1.5 mono">{value}</div>
      {sub && <div className="text-[11px] text-ink-600 mt-1">{sub}</div>}
    </div>
  );
}

const statusColors = {
  active: 'bg-signal/12 text-signal-dark', paid: 'bg-signal/12 text-signal-dark',
  inactive: 'bg-ink-900/8 text-ink-600', disabled: 'bg-ink-900/8 text-ink-600',
  suspended: 'bg-rose/12 text-rose', overdue: 'bg-rose/12 text-rose', disconnected: 'bg-rose/12 text-rose',
  unpaid: 'bg-amber/15 text-amber', partially_paid: 'bg-amber/15 text-amber', pending: 'bg-amber/15 text-amber',
};

export function Badge({ status }) {
  const cls = statusColors[status] || 'bg-ink-900/8 text-ink-600';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${cls}`}>
      <span className="status-dot" style={{ background: 'currentColor' }} />
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${width} max-h-[88vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-white z-10">
          <h3 className="text-[15px] font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-ink-950/5">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-[13px] text-ink-700">{message}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-3.5 py-1.5 rounded-md border border-line text-[13px] font-medium hover:bg-ink-950/5">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold text-white ${danger ? 'bg-rose hover:bg-rose/90' : 'bg-signal hover:bg-signal-dark'}`}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

export function EmptyState({ label = 'Nothing here yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-600">
      <Inbox size={28} className="mb-2 opacity-40" />
      <div className="text-[13px]">{label}</div>
    </div>
  );
}

export function Pagination({ page, limit, total, onPage }) {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 pt-3 text-[12px] text-ink-600">
      <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-2.5 py-1 rounded border border-line disabled:opacity-40 hover:bg-ink-950/5">Prev</button>
        <span className="px-2.5 py-1">{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="px-2.5 py-1 rounded border border-line disabled:opacity-40 hover:bg-ink-950/5">Next</button>
      </div>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  const cls = toast.type === 'error' ? 'bg-rose text-white' : 'bg-ink-950 text-white';
  return (
    <div className={`fixed bottom-5 right-5 z-[60] px-4 py-2.5 rounded-md text-[13px] font-medium shadow-lg ${cls}`}>
      {toast.message}
    </div>
  );
}

export function Field({ label, children, required }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[12px] font-semibold text-ink-700 mb-1">{label}{required && <span className="text-rose"> *</span>}</span>
      {children}
    </label>
  );
}

export const inputCls = "w-full bg-white border border-line rounded-md px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal/50";
export const btnPrimary = "px-4 py-2 rounded-md bg-signal text-white text-[13px] font-semibold hover:bg-signal-dark transition-colors disabled:opacity-50";
export const btnSecondary = "px-4 py-2 rounded-md border border-line text-[13px] font-medium hover:bg-ink-950/5 transition-colors";
