import { useEffect, useState } from 'react';
import { BellRing, CheckCheck } from 'lucide-react';
import api from '../api/client';
import { EmptyState, btnSecondary } from '../components/UI';

const typeColor = {
  bill_due: 'text-amber', overdue: 'text-rose', payment_confirmation: 'text-signal-dark',
  new_customer: 'text-ink-700', suspension: 'text-rose', package_expiration: 'text-amber'
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = () => api.get('/notifications').then(({ data }) => setNotifications(data.notifications));
  useEffect(() => { load(); }, []);

  async function markRead(n) { await api.put(`/notifications/${n.id}/read`); load(); }
  async function markAllRead() { await api.put('/notifications/read-all'); load(); }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={markAllRead} className={`${btnSecondary} flex items-center gap-1.5`}><CheckCheck size={14} /> Mark all as read</button>
      </div>

      <div className="bg-white border border-line rounded-lg shadow-card divide-y divide-line">
        {notifications.map(n => (
          <div key={n.id} onClick={() => !n.is_read && markRead(n)} className={`flex items-start gap-3 px-4 py-3 cursor-pointer ${!n.is_read ? 'bg-signal/5' : ''}`}>
            <BellRing size={15} className={`mt-0.5 ${typeColor[n.type] || 'text-ink-600'}`} />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-ink-900">{n.title}</div>
              <div className="text-[12px] text-ink-600">{n.message}</div>
              {n.customer_name && <div className="text-[11px] text-ink-600 mono mt-0.5">{n.customer_name}</div>}
              <div className="text-[10px] text-ink-600 mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.is_read && <span className="w-2 h-2 rounded-full bg-signal mt-1.5" />}
          </div>
        ))}
      </div>
      {notifications.length === 0 && <EmptyState label="No notifications" />}
    </div>
  );
}
