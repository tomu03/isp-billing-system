import { useEffect, useState } from 'react';
import {
  Users, UserCheck, UserX, UserMinus, Wallet, CalendarClock, FileWarning, AlertTriangle,
  TrendingUp, TrendingDown, PiggyBank, Package, UserPlus, Cable
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import api from '../api/client';
import { StatCard } from '../components/UI';

const currency = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
const COLORS = ['#2FBF8F', '#E8A33D', '#E8615A', '#7A8B84', '#5FE3B4'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    api.get('/dashboard/stats').then(({ data }) => setStats(data));
    api.get('/dashboard/charts').then(({ data }) => setCharts(data));
  }, []);

  if (!stats || !charts) return <div className="text-[13px] text-ink-600">Loading dashboard…</div>;

  const paidVsUnpaidData = [
    { name: 'Paid', value: charts.paidVsUnpaid.paid || 0 },
    { name: 'Unpaid', value: charts.paidVsUnpaid.unpaid || 0 },
    { name: 'Partial', value: charts.paidVsUnpaid.partially_paid || 0 },
    { name: 'Overdue', value: charts.paidVsUnpaid.overdue || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard label="Total customers" value={stats.totalCustomers} icon={Users} accent="ink" />
        <StatCard label="Active" value={stats.activeCustomers} icon={UserCheck} accent="signal" />
        <StatCard label="Inactive" value={stats.inactiveCustomers} icon={UserMinus} accent="ink" />
        <StatCard label="Suspended" value={stats.suspendedCustomers} icon={UserX} accent="rose" />

        <StatCard label="Today's collection" value={currency(stats.todaysCollection)} icon={Wallet} accent="signal" />
        <StatCard label="This month's collection" value={currency(stats.monthCollection)} icon={TrendingUp} accent="signal" />
        <StatCard label="Pending bills" value={stats.pendingBills} icon={CalendarClock} accent="amber" />
        <StatCard label="Overdue bills" value={stats.overdueBills} icon={FileWarning} accent="rose" />

        <StatCard label="Monthly revenue" value={currency(stats.monthRevenue)} icon={TrendingUp} accent="signal" />
        <StatCard label="Monthly expenses" value={currency(stats.monthExpenses)} icon={TrendingDown} accent="rose" />
        <StatCard label="Net revenue" value={currency(stats.netRevenue)} icon={PiggyBank} accent={stats.netRevenue >= 0 ? 'signal' : 'rose'} />
        <StatCard label="Active packages" value={stats.activePackages} icon={Package} accent="ink" />

        <StatCard label="New customers (month)" value={stats.newCustomersThisMonth} icon={UserPlus} accent="signal" />
        <StatCard label="Expiring / suspended" value={stats.expiringConnections} icon={Cable} accent="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Monthly revenue" sub="Last 6 months, total billed">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={charts.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={{ stroke: '#E4E7E2' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#2FBF8F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly expenses" sub="Last 6 months, total spent">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={charts.expensesByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={{ stroke: '#E4E7E2' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip formatter={(v) => currency(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="expenses" fill="#E8615A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer growth" sub="Cumulative customers over time">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={charts.customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={{ stroke: '#E4E7E2' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="customers" stroke="#1E9670" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Paid vs unpaid bills" sub="All invoices, by status">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={paidVsUnpaidData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {paidVsUnpaidData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Package-wise customer distribution" sub="Active subscriptions per package" full>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={charts.packageDistribution} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7E2" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="customers" fill="#5FE3B4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children, full }) {
  return (
    <div className={`bg-white border border-line rounded-lg p-4 shadow-card ${full ? 'lg:col-span-2' : ''}`}>
      <div className="mb-1">
        <div className="text-[13px] font-bold text-ink-900">{title}</div>
        <div className="text-[11px] text-ink-600">{sub}</div>
      </div>
      {children}
    </div>
  );
}
