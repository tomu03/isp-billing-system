import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications', { params: { unread_only: true } }).then(({ data }) => setUnread(data.unreadCount)).catch(() => {});
  }, []);

  function onSearch(e) {
    e.preventDefault();
    if (q.trim()) navigate(`/customers?search=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="h-16 sticky top-0 z-10 bg-paper/90 backdrop-blur border-b border-line flex items-center justify-between px-6">
      <h1 className="text-[17px] font-bold text-ink-900 tracking-tight">{title}</h1>

      <div className="flex items-center gap-3">
        <form onSubmit={onSearch} className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer, phone, IP, invoice…"
            className="w-72 bg-white border border-line rounded-md pl-9 pr-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal/50"
          />
        </form>

        <button onClick={() => navigate('/notifications')} className="relative w-9 h-9 rounded-md border border-line bg-white flex items-center justify-center hover:bg-ink-950/5">
          <Bell size={16} className="text-ink-700" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button onClick={logout} className="w-9 h-9 rounded-md border border-line bg-white flex items-center justify-center hover:bg-ink-950/5" title="Log out">
          <LogOut size={16} className="text-ink-700" />
        </button>
      </div>
    </header>
  );
}
