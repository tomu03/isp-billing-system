import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Printer } from 'lucide-react';
import api from '../api/client';
import { Modal, Pagination, EmptyState, Field, inputCls, btnPrimary, btnSecondary, Toast } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
const methods = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Online Payment'];

export default function Payments() {
  const [params] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: params.get('customer_id') || '', invoice_id: params.get('invoice_id') || '', amount: '', payment_method: 'Cash', transaction_id: '', notes: '' });
  const [toast, setToast] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const limit = 15;

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };
  const load = useCallback(() => {
    api.get('/payments', { params: { search, page, limit } }).then(({ data }) => { setPayments(data.payments); setTotal(data.total); });
  }, [search, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/customers', { params: { limit: 500 } }).then(({ data }) => setCustomers(data.customers)); }, []);
  useEffect(() => { if (params.get('customer_id')) setModalOpen(true); }, [params]);

  async function onSave(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/payments', { ...form, invoice_id: form.invoice_id || null });
      notify(`Payment ${data.payment_code} recorded`);
      setModalOpen(false);
      setForm({ customer_id: '', invoice_id: '', amount: '', payment_method: 'Cash', transaction_id: '', notes: '' });
      load();
      const { data: full } = await api.get(`/payments/${data.id}`);
      setReceipt(full);
    } catch (err) { notify(err.response?.data?.error || 'Failed to record payment', 'error'); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600/60" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search payment, customer, txn ID…" className={`${inputCls} pl-8 w-72`} />
        </div>
        <button onClick={() => setModalOpen(true)} className={`${btnPrimary} flex items-center gap-1.5`}><Plus size={15} /> Record payment</button>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Payment</th><th>Customer</th><th>Invoice</th><th>Method</th><th>Txn ID</th><th>Date</th><th>Collected by</th><th>Amount</th></tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td className="mono">{p.payment_code}</td>
                <td><div className="font-medium">{p.customer_name}</div><div className="text-[11px] text-ink-600 mono">{p.customer_code}</div></td>
                <td className="mono">{p.invoice_number || '—'}</td>
                <td>{p.payment_method}</td>
                <td className="mono text-[11px]">{p.transaction_id || '—'}</td>
                <td>{new Date(p.payment_date).toLocaleString()}</td>
                <td>{p.collected_by_name || '—'}</td>
                <td className="mono font-semibold text-signal-dark">{currency(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <EmptyState label="No payments recorded yet" />}
        <div className="px-3 pb-3"><Pagination page={page} limit={limit} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record payment">
        <form onSubmit={onSave}>
          <Field label="Customer" required>
            <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className={inputCls}>
              <option value="">Select customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customer_code}) — due ৳{c.current_due}</option>)}
            </select>
          </Field>
          <Field label="Amount (৳)" required><input required type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Payment method" required>
              <select required value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={inputCls}>
                {methods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Transaction ID"><input value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} className={inputCls} placeholder="Optional for Cash" /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} /></Field>
          <p className="text-[11px] text-ink-600 mb-3">Payment will be applied automatically to the customer's oldest unpaid invoice, updating its status and due balance.</p>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>Record payment</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Payment receipt" width="max-w-sm">
        {receipt && (
          <div id="receipt-print">
            <div className="text-center mb-4">
              <div className="font-extrabold text-ink-900">{receipt.company?.company_name}</div>
              <div className="text-[11px] text-ink-600">{receipt.company?.address}</div>
            </div>
            <div className="border-t border-b border-dashed border-line py-3 space-y-1.5 text-[13px]">
              <Row label="Receipt no." value={receipt.payment.payment_code} />
              <Row label="Customer" value={`${receipt.payment.customer_name} (${receipt.payment.customer_code})`} />
              <Row label="Invoice" value={receipt.payment.invoice_number || '—'} />
              <Row label="Method" value={receipt.payment.payment_method} />
              <Row label="Date" value={new Date(receipt.payment.payment_date).toLocaleString()} />
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="font-bold text-ink-900">Amount paid</span>
              <span className="font-extrabold text-signal-dark text-lg mono">{currency(receipt.payment.amount)}</span>
            </div>
            <button onClick={() => window.print()} className={`${btnSecondary} w-full flex items-center justify-center gap-1.5`}><Printer size={14} /> Print receipt</button>
          </div>
        )}
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-ink-600">{label}</span><span className="font-medium text-ink-900 mono text-[12px]">{value}</span></div>;
}
