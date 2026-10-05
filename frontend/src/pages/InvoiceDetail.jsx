import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Wallet, Radio } from 'lucide-react';
import api from '../api/client';
import { Badge } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => { api.get(`/invoices/${id}`).then(({ data }) => setData(data)); }, [id]);
  if (!data) return <div className="text-[13px] text-ink-600">Loading…</div>;
  const { invoice: inv, payments, company } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link to="/billing" className="inline-flex items-center gap-1.5 text-[12px] text-ink-600 hover:text-ink-900"><ArrowLeft size={14} /> Back to billing</Link>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/payments?invoice_id=${inv.id}&customer_id=${inv.customer_id}`)} className="px-3.5 py-1.5 rounded-md bg-signal text-white text-[13px] font-semibold hover:bg-signal-dark flex items-center gap-1.5"><Wallet size={14} /> Record payment</button>
          <button onClick={() => window.print()} className="px-3.5 py-1.5 rounded-md border border-line text-[13px] font-medium hover:bg-ink-950/5 flex items-center gap-1.5"><Printer size={14} /> Print / PDF</button>
        </div>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card p-8 max-w-3xl mx-auto print:shadow-none print:border-0">
        <div className="flex items-start justify-between pb-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-signal/10 flex items-center justify-center"><Radio size={20} className="text-signal-dark" /></div>
            <div>
              <div className="font-extrabold text-ink-900">{company?.company_name}</div>
              <div className="text-[11px] text-ink-600 max-w-xs">{company?.address}</div>
              <div className="text-[11px] text-ink-600">{company?.phone} · {company?.email}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-ink-600 font-semibold">Invoice</div>
            <div className="text-lg font-extrabold text-ink-900 mono">{inv.invoice_number}</div>
            <div className="mt-1"><Badge status={inv.status} /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6 border-b border-line text-[13px]">
          <div>
            <div className="text-[11px] text-ink-600 font-semibold mb-1">Billed to</div>
            <div className="font-bold text-ink-900">{inv.customer_name}</div>
            <div className="text-ink-600 mono">{inv.customer_code}</div>
            <div className="text-ink-600">{inv.address}, {inv.area}</div>
            <div className="text-ink-600 mono">{inv.mobile}</div>
          </div>
          <div className="text-right">
            <Row label="Package" value={`${inv.package_name} (${inv.speed_mbps}Mbps)`} />
            <Row label="Billing period" value={`${inv.billing_period_start} – ${inv.billing_period_end}`} />
            <Row label="Due date" value={inv.due_date} />
          </div>
        </div>

        <table className="w-full text-[13px] mt-6">
          <tbody>
            <LineRow label="Previous due" value={inv.previous_due} />
            <LineRow label="Current bill" value={inv.current_bill} />
            <LineRow label="Late fee" value={inv.late_fee} />
            <LineRow label="Discount" value={-inv.discount} />
            <tr className="border-t-2 border-ink-900">
              <td className="py-2.5 font-bold text-ink-900">Total amount</td>
              <td className="py-2.5 text-right font-extrabold text-ink-900 mono">{currency(inv.total_amount)}</td>
            </tr>
            <LineRow label="Paid amount" value={inv.paid_amount} muted />
            <tr>
              <td className="py-2.5 font-bold text-rose">Due amount</td>
              <td className="py-2.5 text-right font-extrabold text-rose mono">{currency(inv.due_amount)}</td>
            </tr>
          </tbody>
        </table>

        {payments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-line">
            <div className="text-[11px] font-semibold text-ink-700 mb-2">Payments against this invoice</div>
            {payments.map(p => (
              <div key={p.id} className="flex justify-between text-[12px] py-1 text-ink-700">
                <span className="mono">{p.payment_code} · {p.payment_method} · {new Date(p.payment_date).toLocaleDateString()}</span>
                <span className="mono font-semibold">{currency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center text-[11px] text-ink-600 mt-8 pt-4 border-t border-line">
          Thank you for staying connected with {company?.company_name}.
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return <div className="mb-1"><span className="text-ink-600">{label}: </span><span className="font-medium text-ink-900">{value}</span></div>;
}
function LineRow({ label, value, muted }) {
  return (
    <tr>
      <td className={`py-1.5 ${muted ? 'text-ink-600' : 'text-ink-700'}`}>{label}</td>
      <td className={`py-1.5 text-right mono ${muted ? 'text-ink-600' : 'text-ink-900'}`}>{currency(value)}</td>
    </tr>
  );
}
