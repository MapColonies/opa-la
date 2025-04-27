import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className="w-64 shrink-0" />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
