import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Send, Eye, MousePointer, MessageSquare, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/shared/StatCard';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import RecentCampaigns from '../components/dashboard/RecentCampaigns';
import StatusBadge from '../components/shared/StatusBadge';


export default function Dashboard() {
  const { user: currentUser } = useAuth();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.campaigns.list(),
  });

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const totalOpened = campaigns.reduce((s, c) => s + (c.opened_count || 0), 0);
  const totalReplied = campaigns.reduce((s, c) => s + (c.replied_count || 0), 0);

  const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
  
  // For the Recent Campaigns list, sort the same array
  const recentCampaigns = [...campaigns].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);

  const { data: smtpAccounts = [] } = useQuery({
    queryKey: ['smtp-accounts', currentUser?.email],
    queryFn: () => api.smtp.list(),
    enabled: !!currentUser,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Welcome back{currentUser?.full_name ? `, ${currentUser.full_name.split(' ')[0]}` : ''}. Here's your outreach overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Sent" value={totalSent.toLocaleString()} icon={Send} color="primary" />
        <StatCard label="Opened (Rate)" value={`${totalOpened.toLocaleString()} (${openRate.toFixed(1)}%)`} icon={Eye} color="blue" />
        <StatCard label="Replied" value={`${totalReplied.toLocaleString()} (${replyRate.toFixed(1)}%)`} icon={MessageSquare} color="green" />
      </div>

      <DashboardCharts />

      {/* Recent Campaigns */}
      <RecentCampaigns campaigns={recentCampaigns} />

      {/* SMTP Health */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-sm font-semibold text-foreground">SMTP Health</h3>
          <Link to="/smtp" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
            Manage <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        {smtpAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">No SMTP accounts connected yet.</p>
            <Link to="/smtp" className="text-primary hover:underline text-sm mt-2">Connect your first account →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {smtpAccounts.slice(0, 6).map(acc => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    acc.status === 'active' ? 'bg-brand-green' :
                    acc.status === 'error' ? 'bg-brand-red' : 'bg-muted-foreground'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{acc.from_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{acc.sent_today || 0}/{acc.daily_limit || 500}</span>
                  <StatusBadge status={acc.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}