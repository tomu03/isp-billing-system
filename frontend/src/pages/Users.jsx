import { useEffect, useState, useCallback } from 'react';
import { Plus, Power } from 'lucide-react';
import api from '../api/client';
import { Badge, Modal, EmptyState, Field, inputCls, btnPrimary, btnSecondary, Toast } from '../components/UI';

const emptyForm = { name: '', email: '', phone: '', password: '', role: 'support_staff' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };
  const load = useCallback(() => { api.get('/auth/users').then(({ data }) => setUsers(data.users)); }, []);
  useEffect(() => { load(); api.get('/auth/roles').then(({ data }) => setRoles(data.roles)); }, [load]);

  async function onSave(e) {
    e.preventDefault();
    try { await api.post('/auth/users', form); notify('User created'); setModalOpen(false); setForm(emptyForm); load(); }
    catch (err) { notify(err.response?.data?.error || 'Failed to create user', 'error'); }
  }

  async function toggleStatus(u) {
    const next = u.status === 'active' ? 'disabled' : 'active';
    await api.put(`/auth/users/${u.id}/status`, { status: next });
    notify(`User ${next === 'active' ? 'enabled' : 'disabled'}`); load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalOpen(true)} className={`${btnPrimary} flex items-center gap-1.5`}><Plus size={15} /> Add user</button>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Last login</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td className="mono text-[12px]">{u.email}</td>
                <td className="mono">{u.phone || '—'}</td>
                <td className="capitalize">{u.role.replace('_', ' ')}</td>
                <td className="text-[12px]">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                <td><Badge status={u.status} /></td>
                <td><button onClick={() => toggleStatus(u)} className="w-7 h-7 rounded flex items-center justify-center hover:bg-ink-950/5"><Power size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <EmptyState label="No users yet" />}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add user">
        <form onSubmit={onSave}>
          <Field label="Full name" required><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} /></Field>
          <Field label="Email" required><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
          <Field label="Password" required><input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} /></Field>
          <Field label="Role" required>
            <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
              {roles.filter(r => r.name !== 'super_admin').map(r => <option key={r.id} value={r.name}>{r.name.replace('_', ' ')}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnSecondary}>Cancel</button>
            <button type="submit" className={btnPrimary}>Create user</button>
          </div>
        </form>
      </Modal>
      <Toast toast={toast} />
    </div>
  );
}
