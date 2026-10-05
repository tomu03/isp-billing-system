import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Packages from './pages/Packages';
import Billing from './pages/Billing';
import InvoiceDetail from './pages/InvoiceDetail';
import Payments from './pages/Payments';
import DueCollection from './pages/DueCollection';
import Connections from './pages/Connections';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { can } = useAuth();
  if (!can(...roles)) return <Navigate to="/" replace />;
  return children;
}

const titles = {
  '/': 'Dashboard', '/customers': 'Customers', '/packages': 'Packages', '/billing': 'Billing',
  '/payments': 'Payments', '/due-collection': 'Due & Collection', '/connections': 'Connections',
  '/expenses': 'Expenses', '/reports': 'Reports', '/users': 'Users', '/notifications': 'Notifications', '/settings': 'Settings'
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout title="Dashboard" /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/customers" element={<PrivateRoute><Layout title="Customers" /></PrivateRoute>}>
        <Route index element={<Customers />} />
      </Route>
      <Route path="/customers/:id" element={<PrivateRoute><Layout title="Customer profile" /></PrivateRoute>}>
        <Route index element={<CustomerProfile />} />
      </Route>
      <Route path="/packages" element={<PrivateRoute><Layout title="Internet Packages" /></PrivateRoute>}>
        <Route index element={<Packages />} />
      </Route>
      <Route path="/billing" element={<PrivateRoute><Layout title="Billing" /></PrivateRoute>}>
        <Route index element={<Billing />} />
      </Route>
      <Route path="/billing/:id" element={<PrivateRoute><Layout title="Invoice" /></PrivateRoute>}>
        <Route index element={<InvoiceDetail />} />
      </Route>
      <Route path="/payments" element={<PrivateRoute><Layout title="Payments" /></PrivateRoute>}>
        <Route index element={<Payments />} />
      </Route>
      <Route path="/due-collection" element={<PrivateRoute><Layout title="Due & Collection" /></PrivateRoute>}>
        <Route index element={<DueCollection />} />
      </Route>
      <Route path="/connections" element={<PrivateRoute><Layout title="Connections" /></PrivateRoute>}>
        <Route index element={<Connections />} />
      </Route>
      <Route path="/expenses" element={<PrivateRoute><Layout title="Expenses" /></PrivateRoute>}>
        <Route index element={<Expenses />} />
      </Route>
      <Route path="/reports" element={<PrivateRoute><Layout title="Reports" /></PrivateRoute>}>
        <Route index element={<Reports />} />
      </Route>
      <Route path="/users" element={<PrivateRoute><RoleRoute roles={['admin']}><Layout title="Users" /></RoleRoute></PrivateRoute>}>
        <Route index element={<Users />} />
      </Route>
      <Route path="/notifications" element={<PrivateRoute><Layout title="Notifications" /></PrivateRoute>}>
        <Route index element={<Notifications />} />
      </Route>
      <Route path="/settings" element={<PrivateRoute><RoleRoute roles={['admin']}><Layout title="Settings" /></RoleRoute></PrivateRoute>}>
        <Route index element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
