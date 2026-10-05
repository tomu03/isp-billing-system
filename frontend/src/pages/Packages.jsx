import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import api from '../api/client';
import { Badge, Modal, ConfirmDialog, EmptyState, Field, inputCls, btnPrimary, btnSecondary, Toast } from '../components/UI';

const emptyForm = { name: '', speed_mbps: '', monthly_price: '', installation_fee: '', connection_type: 'Fiber', description: '', status: 'active' };
const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };
  const load = useCallback(() => { api.get('/packages').then(({ data }) => setPackages(data.packages)); }, []);
  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(p) { setEditing(p); setForm(p); setModalOpen(true); }

  async function onSave(e) {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/packages/${editing.id}`, form); notify('Package updated'); }
      else { await api.post('/packages', form); notify('Package created'); }
      setModalOpen(false); load();
    } catch (err) { notify(err.response?.data?.error || 'Failed to save package', 'error'); }
  }

  async function toggleStatus(p) {
    const next = p.status === 'active' ? 'disabled' : 'active';
    await api.put(`/packages/${p.id}/status`, { status: next });
    notify(`Package ${next === 'active' ? 'enabled' : 'disabled'}`); load();
  }

  async function onDelete() {
    try { await api.delete(`/packages/${confirmDelete.id}`); notify('Package deleted'); load(); }
    catch (err) { notify(err.response?.data?.error || 'Cannot delete package', 'error'); }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openAdd} className={`${btnPrimary} flex items-center gap-1.5`}><Plus size={15} /> Add package</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map(p => (
          <div key={p.id} className="bg-white border border-line rounded-lg p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-ink-900">{p.name}</div>
                <div className="text-[11px] text-ink-600 mono">{p.connection_type}</div>
              </div>
              <Badge status={p.status} />
            </div>
            <div className="text-2xl font-extrabold text-ink-900 mono mt-3">{p.speed_mbps} <span className="text-[13px] font-medium text-ink-600">Mbps</span></div>
            <div className="text-[13px] text-ink-700 mt-1">{currency(p.monthly_price)}/mo · Install {currency(p.installation_fee)}</div>
            {p.description && <div className="text-[12px] text-ink-600 mt-2">{p.description}</div>}
            <div className="text-[11px] text-ink-600 mt-2 mono">{p.customer_count} customers subscribed</div>
            <div className="flex gap-1.5 mt-3 pt-3 border-t border-line">
              <button onClick={() => openEdit(p)} className="flex-1 px-2 py-1.5 rounded border border-line text-[12px] font-medium hover:bg-ink-950/5 flex items-center justify-center gap-1"><Pencil size={12} /> Edit</button>
              <button onClick={() => toggleStatus(p)} className="flex-1 px-2 py-1.5 rounded border border-line text-[12px] font-medium hover:bg-ink-950/5 flex items-center justify-center gap-1"><Power size={12} /> {p.status === 'active' ? 'Disable' : 'Enable'}</button>
              <button onClick={() => setConfirmDelete(p)} className="px-2 py-1.5 rounded border border-line text-rose hover:bg-rose/10"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
      </div>
      {packages.length === 0 && <EmptyState label="No packages yet" />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit package' : 'Add package'}>
        <form onSubmit={onSave}>
          <Field label="Package name" required><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="Speed (Mbps)" required><input required type="number" value={form.speed_mbps} onChange={(e) => setForm({ ...form, speed_mbps: e.target.value })} className={inputCls} /></Field>
            <Field label="Monthly price (৳)" required><input required type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} className={inputCls} /></Field>
            <Field label="Installation fee (৳)"><input type="number" value={form.installation_fee} onChange={(e) => setForm({ ...form, installation_fee: e.target.value })} className={inputCls} /></Field>
            <Field label="Connection type">
              <select value={form.connection_type} onChange={(e) => setForm({ ...form, connection_type: e.target.value })} className={inputCls}>
                <option>Fiber</option><option>Wireless</option><option>DSL</option>
              </select>
            </Field>
          </div>
          <Field label="Description"><textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} rows={2} /></Field>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{editing ? 'Save changes' : 'Create package'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={onDelete} danger
        title="Delete package" message={`Delete ${confirmDelete?.name}? Packages in use by customers cannot be deleted.`} />
      <Toast toast={toast} />
    </div>
  );
}
