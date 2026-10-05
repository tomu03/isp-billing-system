import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import api from '../api/client';
import { EmptyState, inputCls, btnSecondary } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

const REPORT_TYPES = [
  { key: 'collection', label: 'Collection report', endpoint: '/reports/collection', dateFilter: true },
  { key: 'due', label: 'Due / overdue report', endpoint: '/reports/due', dateFilter: false },
  { key: 'customers', label: 'Customer report', endpoint: '/reports/customers', dateFilter: true },
  { key: 'expenses', label: 'Expense report', endpoint: '/reports/expenses', dateFilter: true },
  { key: 'revenue', label: 'Revenue report', endpoint: '/reports/revenue', dateFilter: true },
  { key: 'packages', label: 'Package report', endpoint: '/reports/packages', dateFilter: false },
];

export default function Reports() {
  const [active, setActive] = useState(REPORT_TYPES[0]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [result, setResult] = useState(null);

  async function run(type) {
    setActive(type);
    const params = type.dateFilter ? { date_from: dateFrom || undefined, date_to: dateTo || undefined } : {};
    const { data } = await api.get(type.endpoint, { params });
    setResult(data);
  }

  function exportCSV() {
    const rows = result?.rows || [];
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${active.key}-report.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const rows = result?.rows || [];

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {REPORT_TYPES.map(t => (
          <button key={t.key} onClick={() => run(t)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium border ${active.key === t.key ? 'bg-ink-950 text-white border-ink-950' : 'border-line bg-white hover:bg-ink-950/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {active.dateFilter && (
        <div className="flex items-center gap-2 mb-4">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputCls} w-40`} />
          <span className="text-ink-600 text-[12px]">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputCls} w-40`} />
          <button onClick={() => run(active)} className={btnSecondary}>Apply</button>
        </div>
      )}

      {result && (
        <>
          <div className="flex items-center justify-between mb-3">
            <SummaryLine result={result} reportKey={active.key} />
            <div className="flex gap-2 print:hidden">
              <button onClick={exportCSV} className={`${btnSecondary} flex items-center gap-1.5`}><Download size={14} /> Export CSV</button>
              <button onClick={() => window.print()} className={`${btnSecondary} flex items-center gap-1.5`}><Printer size={14} /> Print / PDF</button>
            </div>
          </div>

          <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>{rows[0] && Object.keys(rows[0]).slice(0, 8).map(k => <th key={k}>{k.replace(/_/g, ' ')}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    {Object.keys(rows[0]).slice(0, 8).map(k => (
                      <td key={k} className={typeof r[k] === 'number' ? 'mono' : ''}>{typeof r[k] === 'number' ? (k.includes('amount') || k.includes('due') || k.includes('total') || k.includes('bill') ? currency(r[k]) : r[k]) : String(r[k] ?? '—')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState label="No data for this report" />}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryLine({ result, reportKey }) {
  if (reportKey === 'collection') return <div className="text-[13px] font-semibold">Total collected: <span className="mono text-signal-dark">{currency(result.total)}</span></div>;
  if (reportKey === 'due') return <div className="text-[13px] font-semibold">Total outstanding: <span className="mono text-rose">{currency(result.total)}</span></div>;
  if (reportKey === 'expenses') return <div className="text-[13px] font-semibold">Total expenses: <span className="mono text-rose">{currency(result.total)}</span></div>;
  if (reportKey === 'revenue') return <div className="text-[13px] font-semibold">Billed: <span className="mono">{currency(result.totalBilled)}</span> · Collected: <span className="mono text-signal-dark">{currency(result.totalCollected)}</span> · Outstanding: <span className="mono text-rose">{currency(result.totalOutstanding)}</span></div>;
  return <div className="text-[13px] font-semibold text-ink-600">{result.rows?.length || 0} records</div>;
}
