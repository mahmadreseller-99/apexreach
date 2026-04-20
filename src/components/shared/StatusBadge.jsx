import React from 'react';

const statusConfig = {
  draft: { label: 'Draft', bg: 'bg-muted', text: 'text-muted-foreground' },
  sending: { label: 'Sending', bg: 'bg-brand-blue/20', text: 'text-brand-blue' },
  completed: { label: 'Completed', bg: 'bg-brand-green/20', text: 'text-brand-green' },
  paused: { label: 'Paused', bg: 'bg-brand-yellow/20', text: 'text-brand-yellow' },
  scheduled: { label: 'Scheduled', bg: 'bg-primary/20', text: 'text-primary' },
  active: { label: 'Active', bg: 'bg-brand-green/20', text: 'text-brand-green' },
  inactive: { label: 'Inactive', bg: 'bg-muted', text: 'text-muted-foreground' },
  error: { label: 'Error', bg: 'bg-brand-red/20', text: 'text-brand-red' },
  sent: { label: 'Sent', bg: 'bg-brand-green/20', text: 'text-brand-green' },
  opened: { label: 'Opened', bg: 'bg-brand-blue/20', text: 'text-brand-blue' },
  clicked: { label: 'Clicked', bg: 'bg-primary/20', text: 'text-primary' },
  replied: { label: 'Replied', bg: 'bg-brand-green/20', text: 'text-brand-green' },
  failed: { label: 'Failed', bg: 'bg-brand-red/20', text: 'text-brand-red' },
  bounced: { label: 'Bounced', bg: 'bg-brand-red/20', text: 'text-brand-red' },
  delivered: { label: 'Delivered', bg: 'bg-brand-green/20', text: 'text-brand-green' },
  unsubscribed: { label: 'Unsubscribed', bg: 'bg-brand-yellow/20', text: 'text-brand-yellow' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}