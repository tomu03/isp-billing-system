import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api/client';
import { Modal, ConfirmDialog, EmptyState, Field, inputCls, btnPrimary, btnSecondary, Toast } from '../components/UI';

const categories = ['Internet Bandwidth', 'Electricity', 'Office Rent', 'Staff Salary', 'Maintenance', 'Equipment', 'Transportation', 'Marketing', 'Other'];
const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
const emptyForm = { title: '', category: categories[0], amount: '', expense_date: new Date().toISOString().slice(0, 10), paid_by: '', description: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [byCategory, setByCategory] = useState([]);
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };
  const load = useCallback(() => {
    api.get('/expenses', { params: { category, limit: 100 } }).then(({ data }) => {
      setExpenses(data.expenses); setTotalAmount(data.totalAmount); setByCategory(data.byCategory);
    });
  }, [category]);
  useEffect(() => { load(); }, [load]);

  async function onSave(e) {
    e.preventDefault();
    try { await api.post('/expenses', form); notify('Expense recorded'); setModalOpen(false); setForm(emptyForm); load(); }
    catch (err) { notify(err.response?.data?.error || 'Failed to save expense', 'error'); }
  }

  async function onDelete() {
    await api.delete(`/expenses/${confirmDelete.id}`);
    notify('Expense deleted'); load();
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-line rounded-lg p-4 shadow-card">
          <div className="text-[12px] text-ink-600 font-medium">Total expenses</div>
          <div className="text-2xl font-extrabold text-ink-900 mono mt-1">{currency(totalAmount)}</div>
        </div>
        <div className="bg-white border border-line rounded-lg p-4 shadow-card">
          <div className="text-[12px] text-ink-600 font-medium mb-2">By category</div>
          <div className="space-y-1 max-h-20 overflow-y-auto text-[12px]">
            {byCategory.slice(0, 4).map(c => (
              <div key={c.category} className="flex justify-between"><span className="text-ink-700">{c.category}</span><span className="mono font-semibold">{currency(c.total)}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} w-52`}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setModalOpen(true)} className={`${btnPrimary} flex items-center gap-1.5`}><Plus size={15} /> Add expense</button>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Paid by</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td className="font-medium">{e.title}</td>
                <td>{e.category}</td>
                <td>{e.expense_date}</td>
                <td>{e.paid_by || '—'}</td>
                <td className="mono font-semibold text-rose">{currency(e.amount)}</td>
                <td><button onClick={() => setConfirmDelete(e)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-rose/10 text-rose"><Trash2 size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <EmptyState label="No expenses recorded yet" />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add expense">
        <form onSubmit={onSave}>
          <Field label="Title" required><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Category" required>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (৳)" required><input required type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} /></Field>
            <Field label="Date" required><input required type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className={inputCls} /></Field>
            <Field label="Paid by"><input value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })} className={inputCls} placeholder="Office cash, Bank…" /></Field>
          </div>
          <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={2} /></Field>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>Save expense</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={onDelete} danger
        title="Delete expense" message={`Delete "${confirmDelete?.title}"?`} />
      <Toast toast={toast} />
    </div>
  );
}
