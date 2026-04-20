import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import StatusBadge from '../shared/StatusBadge';
import { ArrowRight, Send } from 'lucide-react';
import EmptyState from '../shared/EmptyState';

export default function RecentCampaigns() {
  const { user: currentUser } = useAuth();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-recent', currentUser?.email],
    queryFn: async () => {
      const res = await api.campaigns.list();
      return [...res].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
    },
    enabled: !!currentUser,
  });

  return (
    <div className="bg-card border border-border rounded-2xl">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="font-heading text-sm font-semibold text-foreground">Recent Campaigns</h3>
        <Link to="/campaigns" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No campaigns yet"
          description="Create your first email campaign to get started."
          action={
            <Link to="/campaigns/new" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-5 py-2.5 text-sm">
              Create Campaign
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {campaigns.map((c) => (
            <Link key={c.id} to={`/campaigns/${c.id}/analytics`} className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.processed_count || 0}/{c.total_contacts || 0} sent
                </p>
              </div>
              <StatusBadge status={c.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}