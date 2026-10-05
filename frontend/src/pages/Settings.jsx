import { useEffect, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import { Field, inputCls, btnPrimary, Toast, Badge } from '../components/UI';

export default function Settings() {
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('company');

  const notify = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };

  useEffect(() => { api.get('/settings').then(({ data }) => setForm(data.settings)); }, []);
  useEffect(() => { if (tab === 'audit') api.get('/settings/audit-logs').then(({ data }) => setLogs(data.logs)); }, [tab]);

  async function onSave(e) {
    e.preventDefault();
    try { await api.put('/settings', form); notify('Settings saved'); }
    catch (err) { notify(err.response?.data?.error || 'Failed to save settings', 'error'); }
  }

  if (!form) return <div className="text-[13px] text-ink-600">Loading…</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['company', 'billing', 'audit'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium border capitalize ${tab === t ? 'bg-ink-950 text-white border-ink-950' : 'border-line bg-white hover:bg-ink-950/5'}`}>
            {t === 'audit' ? 'Audit logs' : `${t} info`}
          </button>
        ))}
      </div>

      {tab !== 'audit' ? (
        <form onSubmit={onSave} className="bg-white border border-line rounded-lg p-5 shadow-card max-w-2xl">
          {tab === 'company' && (
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Company name"><input value={form.company_name || ''} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className={inputCls} /></Field>
              <Field label="Website"><input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} /></Field>
              <Field label="Phone"><input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>
              <Field label="Email"><input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
              <div className="col-span-2"><Field label="Address"><textarea value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} rows={2} /></Field></div>
              <Field label="Logo URL"><input value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} className={inputCls} /></Field>
            </div>
          )}
          {tab === 'billing' && (
            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Invoice number prefix"><input value={form.invoice_prefix || ''} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })} className={inputCls} /></Field>
              <Field label="Payment number prefix"><input value={form.payment_prefix || ''} onChange={(e) => setForm({ ...form, payment_prefix: e.target.value })} className={inputCls} /></Field>
              <Field label="Default late fee (flat, ৳)"><input type="number" value={form.late_fee_flat || 0} onChange={(e) => setForm({ ...form, late_fee_flat: e.target.value })} className={inputCls} /></Field>
              <Field label="Default late fee (%)"><input type="number" value={form.late_fee_percent || 0} onChange={(e) => setForm({ ...form, late_fee_percent: e.target.value })} className={inputCls} /></Field>
              <Field label="Billing cycle day"><input type="number" min="1" max="28" value={form.billing_cycle_day || 1} onChange={(e) => setForm({ ...form, billing_cycle_day: e.target.value })} className={inputCls} /></Field>
              <Field label="Currency"><input value={form.currency || 'BDT'} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls} /></Field>
              <div className="col-span-2 text-[12px] text-ink-600 -mt-2 mb-3">
                Payment methods accepted: Cash, bKash, Nagad, Rocket, Bank Transfer, Online Payment (configured in code; contact your developer to add more).
              </div>
            </div>
          )}
          <button type="submit" className={`${btnPrimary} flex items-center gap-1.5`}><Save size={14} /> Save settings</button>
        </form>
      ) : (
        <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
          <table className="data-table w-full">
            <thead><tr><th>Action</th><th>Entity</th><th>User</th><th>Date</th></tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-signal-dark" /> {l.action}</td>
                  <td className="mono text-[12px]">{l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ''}</td>
                  <td>{l.user_name || 'System'}</td>
                  <td className="text-[12px]">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
