import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import api from '../api/client';
import { Badge, Pagination, EmptyState, inputCls } from '../components/UI';

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const limit = 15;

  const load = useCallback(() => {
    api.get('/connections', { params: { search, status, page, limit } }).then(({ data }) => { setConnections(data.connections); setTotal(data.total); });
  }, [search, status, page]);
  useEffect(() => { load(); }, [load]);

  async function updateStatus(c, newStatus) {
    await api.put(`/connections/${c.id}`, { status: newStatus });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600/60" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search username, IP, MAC…" className={`${inputCls} pl-8 w-64`} />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} w-40`}>
          <option value="">All statuses</option>
          <option value="active">Active</option><option value="suspended">Suspended</option>
          <option value="disconnected">Disconnected</option><option value="pending">Pending installation</option>
        </select>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Customer</th><th>Username</th><th>IP address</th><th>MAC address</th><th>Router / ONU</th><th>Package</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {connections.map(c => (
              <tr key={c.id}>
                <td><div className="font-medium">{c.customer_name}</div><div className="text-[11px] text-ink-600 mono">{c.customer_code}</div></td>
                <td className="mono">{c.username || '—'}</td>
                <td className="mono">{c.ip_address || '—'}</td>
                <td className="mono">{c.mac_address || '—'}</td>
                <td className="mono">{c.router_onu || '—'}</td>
                <td>{c.package_name || '—'}</td>
                <td><Badge status={c.status} /></td>
                <td>
                  <select value={c.status} onChange={(e) => updateStatus(c, e.target.value)} className="text-[11px] border border-line rounded px-1.5 py-1">
                    <option value="active">Active</option><option value="suspended">Suspended</option>
                    <option value="disconnected">Disconnected</option><option value="pending">Pending</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {connections.length === 0 && <EmptyState label="No connections found" />}
        <div className="px-3 pb-3"><Pagination page={page} limit={limit} total={total} onPage={setPage} /></div>
      </div>
    </div>
  );
}
