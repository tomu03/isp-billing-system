import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout({ title }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 min-w-0">
        <div className="print:hidden">
          <Topbar title={title} />
        </div>
        <main className="p-6 max-w-[1400px] print:p-0 print:max-w-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
