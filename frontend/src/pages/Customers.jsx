import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Pencil, Power, Trash2 } from 'lucide-react';
import api from '../api/client';
import { Badge, Modal, ConfirmDialog, Pagination, EmptyState, Field, inputCls, btnPrimary, btnSecondary, Toast } from '../components/UI';

const emptyForm = {
  name: '', guardian_name: '', mobile: '', alt_mobile: '', email: '', nid_number: '', address: '', area: '',
  connection_type: 'Fiber', package_id: '', monthly_bill: '', ip_address: '', mac_address: '', router_info: '',
  connection_date: '', billing_date: 5, due_date: 15, status: 'active', notes: ''
};

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [areas, setAreas] = useState([]);
  const [packages, setPackages] = useState([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [status, setStatus] = useState('');
  const [area, setArea] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const limit = 12;

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };

  const load = useCallback(() => {
    api.get('/customers', { params: { search, status, area, page, limit } }).then(({ data }) => {
      setCustomers(data.customers); setTotal(data.total);
    });
  }, [search, status, area, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/customers/areas').then(({ data }) => setAreas(data.areas));
    api.get('/packages').then(({ data }) => setPackages(data.packages));
  }, []);

  function openAdd() { setEditing(null); setForm(emptyForm); setModalOpen(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({ ...emptyForm, ...c, package_id: c.package_id || '' });
    setModalOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    const payload = { ...form, package_id: form.package_id || null, monthly_bill: form.monthly_bill || 0 };
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
        notify('Customer updated');
      } else {
        await api.post('/customers', payload);
        notify('Customer added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify(err.response?.data?.error || 'Failed to save customer', 'error');
    }
  }

  async function toggleStatus(c) {
    const next = c.status === 'active' ? 'suspended' : 'active';
    await api.put(`/customers/${c.id}/status`, { status: next });
    notify(`Customer ${next === 'active' ? 'activated' : 'suspended'}`);
    load();
  }

  async function onDelete() {
    await api.delete(`/customers/${confirmDelete.id}`);
    notify('Customer deleted');
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600/60" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers…"
              className={`${inputCls} pl-8 w-60`} />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} w-36`}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={area} onChange={(e) => { setArea(e.target.value); setPage(1); }} className={`${inputCls} w-36`}>
            <option value="">All areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className={`${btnPrimary} flex items-center gap-1.5`}><Plus size={15} /> Add customer</button>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Customer</th><th>Mobile</th><th>Area</th><th>Package</th><th>Monthly bill</th><th>Due</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="font-semibold text-ink-900">{c.name}</div>
                  <div className="text-[11px] text-ink-600 mono">{c.customer_code}</div>
                </td>
                <td className="mono">{c.mobile}</td>
                <td>{c.area || '—'}</td>
                <td>{c.package_name || '—'}</td>
                <td className="mono">৳{Number(c.monthly_bill).toLocaleString()}</td>
                <td className={`mono ${c.current_due > 0 ? 'text-rose font-semibold' : 'text-ink-600'}`}>৳{Number(c.current_due).toLocaleString()}</td>
                <td><Badge status={c.status} /></td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <Link to={`/customers/${c.id}`} className="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-950/5" title="View"><Eye size={14} /></Link>
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-950/5" title="Edit"><Pencil size={14} /></button>
                    <button onClick={() => toggleStatus(c)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-950/5" title="Toggle status"><Power size={14} /></button>
                    <button onClick={() => setConfirmDelete(c)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-rose/10 text-rose" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <EmptyState label="No customers match your filters" />}
        <div className="px-3 pb-3"><Pagination page={page} limit={limit} total={total} onPage={setPage} /></div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit customer' : 'Add customer'} width="max-w-2xl">
        <form onSubmit={onSave} className="grid grid-cols-2 gap-x-4">
          <Field label="Full name" required><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Father's / Mother's name"><input value={form.guardian_name || ''} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} className={inputCls} /></Field>
          <Field label="Mobile number" required><input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputCls} /></Field>
          <Field label="Alternative number"><input value={form.alt_mobile || ''} onChange={(e) => setForm({ ...form, alt_mobile: e.target.value })} className={inputCls} /></Field>
          <Field label="Email"><input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
          <Field label="NID number"><input value={form.nid_number || ''} onChange={(e) => setForm({ ...form, nid_number: e.target.value })} className={inputCls} /></Field>
          <Field label="Area"><input value={form.area || ''} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputCls} /></Field>
          <Field label="Address"><input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} /></Field>
          <Field label="Package">
            <select value={form.package_id || ''} onChange={(e) => {
              const pkg = packages.find(p => String(p.id) === e.target.value);
              setForm({ ...form, package_id: e.target.value, monthly_bill: pkg ? pkg.monthly_price : form.monthly_bill });
            }} className={inputCls}>
              <option value="">Select package</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} — {p.speed_mbps}Mbps</option>)}
            </select>
          </Field>
          <Field label="Monthly bill (৳)"><input type="number" value={form.monthly_bill} onChange={(e) => setForm({ ...form, monthly_bill: e.target.value })} className={inputCls} /></Field>
          <Field label="Connection type">
            <select value={form.connection_type} onChange={(e) => setForm({ ...form, connection_type: e.target.value })} className={inputCls}>
              <option>Fiber</option><option>Wireless</option><option>DSL</option>
            </select>
          </Field>
          <Field label="Connection date"><input type="date" value={form.connection_date || ''} onChange={(e) => setForm({ ...form, connection_date: e.target.value })} className={inputCls} /></Field>
          <Field label="IP address"><input value={form.ip_address || ''} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} className={inputCls} placeholder="10.10.0.1" /></Field>
          <Field label="MAC address"><input value={form.mac_address || ''} onChange={(e) => setForm({ ...form, mac_address: e.target.value })} className={inputCls} placeholder="00:1B:44:11:3A:B7" /></Field>
          <Field label="Router / ONU"><input value={form.router_info || ''} onChange={(e) => setForm({ ...form, router_info: e.target.value })} className={inputCls} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
              <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
            </select>
          </Field>
          <Field label="Billing date (day)"><input type="number" min="1" max="28" value={form.billing_date} onChange={(e) => setForm({ ...form, billing_date: e.target.value })} className={inputCls} /></Field>
          <Field label="Due date (day)"><input type="number" min="1" max="28" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} /></Field>
          <div className="col-span-2">
            <Field label="Notes"><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} /></Field>
          </div>
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>{editing ? 'Save changes' : 'Add customer'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={onDelete} danger
        title="Delete customer" message={`Delete ${confirmDelete?.name}? This will remove all related records and cannot be undone.`} />

      <Toast toast={toast} />
    </div>
  );
}
