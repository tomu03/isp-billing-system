import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, FilePlus, Eye, Search } from 'lucide-react';
import api from '../api/client';
import { Badge, Modal, Pagination, EmptyState, Field, inputCls, btnPrimary, btnSecondary, Toast } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
const thisMonth = new Date().toISOString().slice(0, 7);

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genForm, setGenForm] = useState({ billing_period_start: `${thisMonth}-01`, billing_period_end: `${thisMonth}-28`, late_fee_for_overdue: 30 });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const limit = 15;

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
  const load = useCallback(() => {
    api.get('/invoices', { params: { search, status, page, limit } }).then(({ data }) => { setInvoices(data.invoices); setTotal(data.total); });
  }, [search, status, page]);
  useEffect(() => { load(); }, [load]);

  async function runMonthlyBilling(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/invoices/generate-monthly', genForm);
      notify(data.message);
      setGenModalOpen(false);
      load();
    } catch (err) { notify(err.response?.data?.error || 'Failed to generate bills', 'error'); }
    finally { setLoading(false); }
  }

  async function markOverdue() {
    const { data } = await api.post('/invoices/mark-overdue');
    notify(`${data.updated} invoice(s) marked overdue`);
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600/60" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoice, customer…" className={`${inputCls} pl-8 w-60`} />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} w-40`}>
            <option value="">All statuses</option>
            <option value="paid">Paid</option><option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially paid</option><option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={markOverdue} className={btnSecondary}>Mark overdue</button>
          <button onClick={() => setGenModalOpen(true)} className={`${btnPrimary} flex items-center gap-1.5`}><Zap size={15} /> Generate monthly bills</button>
        </div>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Period</th><th>Prev. due</th><th>Bill</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoices.map(i => (
              <tr key={i.id}>
                <td className="mono">{i.invoice_number}</td>
                <td><div className="font-medium">{i.customer_name}</div><div className="text-[11px] text-ink-600 mono">{i.customer_code}</div></td>
                <td>{i.billing_period_start}</td>
                <td className="mono">{currency(i.previous_due)}</td>
                <td className="mono">{currency(i.current_bill)}</td>
                <td className="mono font-semibold">{currency(i.total_amount)}</td>
                <td className="mono text-signal-dark">{currency(i.paid_amount)}</td>
                <td className={`mono ${i.due_amount > 0 ? 'text-rose font-semibold' : ''}`}>{currency(i.due_amount)}</td>
                <td><Badge status={i.status} /></td>
                <td><Link to={`/billing/${i.id}`} className="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-950/5"><Eye size={14} /></Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && <EmptyState label="No invoices found" />}
        <div className="px-3 pb-3"><Pagination page={page} limit={limit} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={genModalOpen} onClose={() => setGenModalOpen(false)} title="Generate monthly bills" width="max-w-md">
        <p className="text-[12px] text-ink-600 mb-4">Creates an invoice for every active/suspended customer who doesn't already have one for this billing period. Total = Previous Due + Current Bill + Late Fee − Discount.</p>
        <form onSubmit={runMonthlyBilling}>
          <Field label="Billing period start" required><input required type="date" value={genForm.billing_period_start} onChange={(e) => setGenForm({ ...genForm, billing_period_start: e.target.value })} className={inputCls} /></Field>
          <Field label="Billing period end" required><input required type="date" value={genForm.billing_period_end} onChange={(e) => setGenForm({ ...genForm, billing_period_end: e.target.value })} className={inputCls} /></Field>
          <Field label="Late fee for customers with existing due (৳)"><input type="number" value={genForm.late_fee_for_overdue} onChange={(e) => setGenForm({ ...genForm, late_fee_for_overdue: e.target.value })} className={inputCls} /></Field>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setGenModalOpen(false)} className={btnSecondary}>Cancel</button>
            <button disabled={loading} type="submit" className={`${btnPrimary} flex items-center gap-1.5`}><FilePlus size={14} /> {loading ? 'Generating…' : 'Generate'}</button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}
