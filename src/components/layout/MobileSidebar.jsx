import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Send, Users, Mail, Layout, Activity, Settings, LogOut, Zap, Flame, GitBranch, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/campaigns', label: 'Campaigns', icon: Send },
  { path: '/contacts', label: 'Contacts', icon: Users },
  { path: '/smtp', label: 'SMTP Accounts', icon: Mail },
  { path: '/smtp/warmup', label: 'Email Warmup', icon: Flame },
  { path: '/drip', label: 'Drip Sequences', icon: GitBranch },
  { path: '/templates', label: 'Templates', icon: Layout },
  { path: '/activity', label: 'Activity', icon: Activity },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileSidebar({ open, onClose }) {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col lg:hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-heading text-lg font-bold text-foreground">ApexReach</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path || location.pathname.startsWith(path + '/');
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
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
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}