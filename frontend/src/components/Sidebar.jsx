import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Users, Package, Receipt, Wallet, AlarmClock, Cable, PiggyBank,
  FileBarChart, UserCog, Bell, Settings, Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/packages', label: 'Packages', icon: Package },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/due-collection', label: 'Due Collection', icon: AlarmClock },
  { to: '/connections', label: 'Connections', icon: Cable },
  { to: '/expenses', label: 'Expenses', icon: PiggyBank },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const { user, can } = useAuth();

  return (
    <aside className="w-60 shrink-0 bg-ink-950 text-white/90 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="w-7 h-7 rounded-md bg-signal/15 flex items-center justify-center">
          <Radio size={16} className="text-signal" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-bold tracking-tight">SwiftNet</div>
          <div className="text-[10px] text-white/40 mono">Billing Console</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {nav.filter(item => !item.roles || can(...item.roles)).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive ? 'bg-signal/15 text-signal' : 'text-white/60 hover:text-white/95 hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3.5 border-t border-white/10">
        <div className="text-[12px] font-semibold text-white/85 truncate">{user?.name}</div>
        <div className="text-[10px] uppercase tracking-wide text-signal/80 mono mt-0.5">{user?.role?.replace('_', ' ')}</div>
      </div>
    </aside>
  );
}
