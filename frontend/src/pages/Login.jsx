import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@ispbilling.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-ink-950">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-white/90 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-signal/10 blur-3xl" />
        <div className="absolute -left-10 bottom-10 w-72 h-72 rounded-full bg-signal/5 blur-3xl" />
        <div className="flex items-center gap-2.5 relative">
          <div className="w-8 h-8 rounded-md bg-signal/15 flex items-center justify-center"><Radio size={18} className="text-signal" /></div>
          <span className="font-bold tracking-tight">SwiftNet Broadband</span>
        </div>
        <div className="relative max-w-md">
          <div className="text-[13px] mono text-signal/80 mb-3">BILLING CONSOLE — v1.0</div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">One dashboard for customers, connections and collections.</h2>
          <p className="text-white/50 text-[14px] mt-4 leading-relaxed">
            Track every connection across your network, generate bills automatically, and see today's collection the moment it lands.
          </p>
        </div>
        <div className="text-[12px] text-white/30 relative">© 2026 SwiftNet Broadband Ltd. — Dhaka, Bangladesh</div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-paper px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-md bg-signal/15 flex items-center justify-center"><Radio size={18} className="text-signal-dark" /></div>
            <span className="font-bold tracking-tight text-ink-900">SwiftNet Broadband</span>
          </div>
          <h1 className="text-xl font-extrabold text-ink-900 tracking-tight">Sign in to your console</h1>
          <p className="text-[13px] text-ink-600 mt-1.5 mb-6">Enter your billing console credentials to continue.</p>

          <form onSubmit={onSubmit}>
            <label className="block mb-3.5">
              <span className="block text-[12px] font-semibold text-ink-700 mb-1">Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="w-full bg-white border border-line rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal/50" />
            </label>
            <label className="block mb-1.5">
              <span className="block text-[12px] font-semibold text-ink-700 mb-1">Password</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                className="w-full bg-white border border-line rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal/50" />
            </label>

            {error && <div className="text-[12px] text-rose font-medium mt-2">{error}</div>}

            <button disabled={loading} type="submit"
              className="w-full mt-5 flex items-center justify-center gap-2 bg-signal hover:bg-signal-dark disabled:opacity-60 text-white font-semibold text-[13px] py-2.5 rounded-md transition-colors">
              {loading ? 'Signing in…' : 'Sign in'} {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="mt-6 border border-line rounded-md p-3.5 bg-white">
            <div className="text-[11px] font-semibold text-ink-700 mb-1.5">Demo accounts (password: password123)</div>
            <div className="text-[11px] text-ink-600 mono space-y-0.5">
              <div>superadmin@ispbilling.com — Super Admin</div>
              <div>admin@ispbilling.com — Admin</div>
              <div>billing@ispbilling.com — Billing Manager</div>
              <div>support@ispbilling.com — Support Staff</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
