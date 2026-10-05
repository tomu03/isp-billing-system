import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Badge, EmptyState, inputCls } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

export default function DueCollection() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [byArea, setByArea] = useState([]);
  const [byPackage, setByPackage] = useState([]);
  const [areas, setAreas] = useState([]);
  const [packages, setPackages] = useState([]);
  const [area, setArea] = useState('');
  const [packageId, setPackageId] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(() => {
    api.get('/reports/due', { params: { area, package_id: packageId, status } }).then(({ data }) => {
      setRows(data.rows); setTotal(data.total); setByArea(data.byArea); setByPackage(data.byPackage);
    });
  }, [area, packageId, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/customers/areas').then(({ data }) => setAreas(data.areas));
    api.get('/packages').then(({ data }) => setPackages(data.packages));
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-line rounded-lg p-4 shadow-card">
          <div className="text-[12px] text-ink-600 font-medium">Total outstanding due</div>
          <div className="text-2xl font-extrabold text-rose mono mt-1">{currency(total)}</div>
          <div className="text-[11px] text-ink-600 mt-1">{rows.length} customers with a balance</div>
        </div>
        <div className="bg-white border border-line rounded-lg p-4 shadow-card">
          <div className="text-[12px] text-ink-600 font-medium mb-2">Due by area</div>
          <div className="space-y-1 max-h-24 overflow-y-auto text-[12px]">
            {byArea.slice(0, 5).map(a => (
              <div key={a.area} className="flex justify-between"><span className="text-ink-700">{a.area || 'Unspecified'}</span><span className="mono font-semibold">{currency(a.total)}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-line rounded-lg p-4 shadow-card">
          <div className="text-[12px] text-ink-600 font-medium mb-2">Due by package</div>
          <div className="space-y-1 max-h-24 overflow-y-auto text-[12px]">
            {byPackage.slice(0, 5).map(p => (
              <div key={p.name} className="flex justify-between"><span className="text-ink-700">{p.name}</span><span className="mono font-semibold">{currency(p.total)}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={area} onChange={(e) => setArea(e.target.value)} className={`${inputCls} w-40`}>
          <option value="">All areas</option>{areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className={`${inputCls} w-44`}>
          <option value="">All packages</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} w-40`}>
          <option value="">All statuses</option>
          <option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Customer</th><th>Mobile</th><th>Area</th><th>Package</th><th>Status</th><th>Due amount</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td><div className="font-semibold">{r.name}</div><div className="text-[11px] text-ink-600 mono">{r.customer_code}</div></td>
                <td className="mono">{r.mobile}</td>
                <td>{r.area || '—'}</td>
                <td>{r.package_name || '—'}</td>
                <td><Badge status={r.status} /></td>
                <td className="mono font-bold text-rose">{currency(r.current_due)}</td>
                <td><Link to={`/payments?customer_id=${r.id}`} className="text-[12px] font-semibold text-signal-dark hover:underline">Collect</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState label="No outstanding dues match your filters" />}
      </div>
    </div>
  );
}
