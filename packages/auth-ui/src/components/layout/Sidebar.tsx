import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Users, Link as LinkIcon, Globe, Menu, X, Key, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { SiteSwitcher } from './SiteSwitcher';

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const Sidebar = ({ className, isCollapsed, onCollapse }: SidebarProps) => {
  const location = useLocation();

  const navItems = [
    {
      title: 'Clients',
      href: '/clients',
      icon: Users,
    },
    {
      title: 'Connections',
      href: '/connections',
      icon: LinkIcon,
    },
    {
      title: 'Domains',
      href: '/domains',
      icon: Globe,
    },
    {
      title: 'JWT Inspector',
      href: '/jwt-inspector',
      icon: Key,
    },
    {
      title: 'OPA Validator',
      href: '/opa-validator',
      icon: Shield,
    },
  ];

  return (
    <div className={cn('flex flex-col h-full border-r bg-background transition-all duration-300', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className={cn('text-xl font-bold transition-all duration-300', isCollapsed ? 'hidden' : 'block')}>OPA Admin</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onCollapse(!isCollapsed)} 
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="p-4 border-b">
          <SiteSwitcher />
        </div>
      )}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                isCollapsed ? 'justify-center' : ''
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
