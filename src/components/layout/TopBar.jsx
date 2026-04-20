import React, { useState, useEffect } from 'react';
import { Bell, Search, Sun, Moon, Check, CheckCheck } from 'lucide-react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/ThemeContext';

export default function TopBar({ onMenuClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  // Poll activity logs for replies to show as notifications
  const { data: replyLogs = [] } = useQuery({
    queryKey: ['reply-notifications'],
    queryFn: () => api.activity.replies(),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const [readLogs, setReadLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('read_notifications') || '[]'); }
    catch { return []; }
  });

  const markRead = (id, e) => {
    if (e) e.stopPropagation();
    if (readLogs.includes(id)) return;
    const next = [...readLogs, id];
    setReadLogs(next);
    localStorage.setItem('read_notifications', JSON.stringify(next));
  };

  const markAllRead = () => {
    const next = [...new Set([...readLogs, ...replyLogs.map(l => l.id)])];
    setReadLogs(next);
    localStorage.setItem('read_notifications', JSON.stringify(next));
  };

  const notifications = replyLogs.slice(0, 10);
  const hasUnread = notifications.some(l => !readLogs.includes(l.id));

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sm:px-6 gap-3">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xs sm:max-w-sm hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search campaigns, contacts..."
          className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl hover:bg-secondary transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <Moon className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
          )}
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border">
            <div className="p-3 border-b border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-heading font-semibold">Notifications</p>
                {hasUnread && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((log) => {
                  const isRead = readLogs.includes(log.id);
                  return (
                    <DropdownMenuItem
                      key={log.id}
                      className={`px-3 py-3 cursor-pointer flex flex-col items-start gap-0.5 ${!isRead ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/50'}`}
                      onClick={() => navigate(`/campaigns/${log.campaign_id}/analytics`)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {!isRead ? (
                          <div className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0" />
                        ) : (
                          <Check className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <p className={`text-sm ${!isRead ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>Reply received</p>
                        
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {log.replied_at ? new Date(log.replied_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: true}) : 'Just now'}
                          </span>
                          {!isRead && (
                            <button onClick={(e) => markRead(log.id, e)} className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10" title="Mark as read">
                              <Check className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs ml-4 ${!isRead ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                        {log.contact_email} replied in <span className="font-semibold truncate max-w-[150px] inline-block align-bottom">{log.campaign_name || 'Campaign'}</span>
                      </p>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground leading-tight">{user?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
          </div>
        </div>
      </div>
    </header>
  );
}