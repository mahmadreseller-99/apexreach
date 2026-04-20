import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Send, Users, Mail, Layout, Activity, Settings, LogOut, Zap, Flame, GitBranch, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/campaigns', label: 'Campaigns', icon: Send },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/smtp', label: 'SMTP Accounts', icon: Mail },
  { path: '/smtp/warmup', label: 'Email Warmup', icon: Flame },
  { path: '/drip', label: 'Drip Sequences', icon: GitBranch },
  { path: '/templates', label: 'Templates', icon: Layout },
  { path: '/activity', label: 'Activity', icon: Activity },
  { path: '/guide', label: 'User Guide', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <aside className="h-screen w-64 bg-card border-r border-border flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-heading text-xl font-bold text-foreground">ApexReach</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}