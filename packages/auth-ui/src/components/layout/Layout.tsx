import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

export const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar className={isCollapsed ? 'w-16' : 'w-64'} isCollapsed={isCollapsed} onCollapse={setIsCollapsed} />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
