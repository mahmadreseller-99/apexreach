import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/apiClient';
import { Activity, Eye, MousePointer, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import EmptyState from '../components/shared/EmptyState';

const eventIcons = {
  email_sent: Send,
  email_opened: Eye,
  email_clicked: MousePointer,
  email_replied: MessageSquare,
  email_failed: AlertCircle,
};

const eventColors = {
  email_sent: 'text-primary bg-primary/10',
  email_opened: 'text-brand-blue bg-brand-blue/10',
  email_clicked: 'text-brand-green bg-brand-green/10',
  email_replied: 'text-brand-yellow bg-brand-yellow/10',
  email_failed: 'text-brand-red bg-brand-red/10',
};

export default function ActivityPage() {
  const [filter, setFilter] = useState('all');

  const { data: activities = [] } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => api.activity.list(),
  });

  const filtered = filter === 'all' ? activities : activities.filter(a => a.action === filter);

  const filterTabs = ['all', 'email_sent', 'email_opened', 'email_clicked', 'email_replied'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time feed of email events</p>
      </div>

      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${
              filter === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All' : tab.replace('email_', '').replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" description="Activity will appear here as emails are sent and interacted with." />
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {filtered.map((a, i) => {
            const Icon = eventIcons[a.action] || Activity;
            const colorClass = eventColors[a.action] || 'text-muted-foreground bg-secondary';
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 hover:bg-secondary/20 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{a.contact_email || 'Unknown'}</span>
                    <span className="text-muted-foreground"> — {a.action?.replace('email_', '').replace('_', ' ')}</span>
                  </p>
                  {a.campaign_name && <p className="text-xs text-muted-foreground truncate">Campaign: {a.campaign_name}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {a.created_date ? new Date(a.created_date).toLocaleString() : '—'}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}