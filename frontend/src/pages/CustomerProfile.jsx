import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Wifi } from 'lucide-react';
import api from '../api/client';
import { Badge, EmptyState } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

export default function CustomerProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/customers/${id}`).then(({ data }) => setData(data)); }, [id]);

  if (!data) return <div className="text-[13px] text-ink-600">Loading…</div>;
  const { customer: c, invoices, payments, connection } = data;

  return (
    <div>
      <Link to="/customers" className="inline-flex items-center gap-1.5 text-[12px] text-ink-600 hover:text-ink-900 mb-4"><ArrowLeft size={14} /> Back to customers</Link>

      <div className="bg-white border border-line rounded-lg p-5 shadow-card mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-ink-900">{c.name}</h2>
              <Badge status={c.status} />
            </div>
            <div className="text-[12px] text-ink-600 mono mt-0.5">{c.customer_code} · Guardian: {c.guardian_name || '—'}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-ink-600">Current due</div>
            <div className={`text-xl font-extrabold mono ${c.current_due > 0 ? 'text-rose' : 'text-signal-dark'}`}>{currency(c.current_due)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-[13px]">
          <Info icon={Phone} label="Mobile" value={c.mobile} />
          <Info icon={Mail} label="Email" value={c.email || '—'} />
          <Info icon={MapPin} label="Area / Address" value={`${c.area || '—'}, ${c.address || ''}`} />
          <Info icon={Wifi} label="Package" value={`${c.package_name || '—'} (${c.speed_mbps || '—'}Mbps)`} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-[13px] pt-4 border-t border-line">
          <Info label="IP address" value={c.ip_address || '—'} mono />
          <Info label="MAC address" value={c.mac_address || '—'} mono />
          <Info label="Router / ONU" value={c.router_info || '—'} mono />
          <Info label="Connection status" value={connection?.status || '—'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-line rounded-lg shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line font-bold text-[13px]">Bill history</div>
          <table className="data-table w-full">
            <thead><tr><th>Invoice</th><th>Period</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id}>
                  <td className="mono">{i.invoice_number}</td>
                  <td>{i.billing_period_start}</td>
                  <td className="mono">{currency(i.total_amount)}</td>
                  <td><Badge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length === 0 && <EmptyState label="No invoices yet" />}
        </div>

        <div className="bg-white border border-line rounded-lg shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-line font-bold text-[13px]">Payment history</div>
          <table className="data-table w-full">
            <thead><tr><th>Payment</th><th>Method</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="mono">{p.payment_code}</td>
                  <td>{p.payment_method}</td>
                  <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td className="mono">{currency(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <EmptyState label="No payments yet" />}
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value, mono }) {
  return (
    <div>
      <div className="text-[11px] text-ink-600 flex items-center gap-1 mb-0.5">{Icon && <Icon size={11} />} {label}</div>
      <div className={`text-ink-900 font-medium ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</div>
    </div>
  );
}
