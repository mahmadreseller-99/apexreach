import React, { useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Send, Eye, MousePointer, MessageSquare, AlertCircle, CheckCircle, TrendingUp, Award, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatusBadge from '../components/shared/StatusBadge';


const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#eab308'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.name?.includes('%') ? p.value.toFixed(1) + '%' : p.value}</p>
      ))}
    </div>
  );
};

function StatBox({ label, value, sub, icon: Icon, color = 'text-foreground' }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 text-center">
      {Icon && <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />}
      <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CampaignAnalytics() {
  const { id } = useParams();

  const { data: campaign, isLoading: loadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.campaigns.get(id),
  });

  const { data: analytics } = useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: () => api.campaigns.analytics(id),
    enabled: !!id,
    refetchInterval: 15000, 
  });

  const logs = analytics?.logs || [];

  const stats = useMemo(() => {
    const fallbackSent = campaign?.sent_count || 0;
    const fallbackOpened = campaign?.opened_count || 0;
    const fallbackReplied = campaign?.replied_count || 0;
    const fallbackFailed = campaign?.failed_count || 0;

    const actualSent = analytics?.stats?.sent > 0 ? analytics.stats.sent : fallbackSent;
    const actualOpened = analytics?.stats?.opened > 0 ? analytics.stats.opened : fallbackOpened;
    const actualReplied = analytics?.stats?.replied > 0 ? analytics.stats.replied : fallbackReplied;
    const actualFailed = analytics?.stats?.failed > 0 ? analytics.stats.failed : fallbackFailed;

    return {
      sent: actualSent,
      opened: actualOpened,
      replied: actualReplied,
      failed: actualFailed,
      openRate: actualSent > 0 ? (actualOpened / actualSent) * 100 : 0,
      replyRate: actualSent > 0 ? (actualReplied / actualSent) * 100 : 0,
    };
  }, [analytics, campaign]);

  // Build day-by-day timeline from logs
  const timelineData = useMemo(() => {
    if (logs.length > 0) {
      const dayMap = {};
      logs.forEach(log => {
        const day = log.sent_at ? new Date(log.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
        if (!dayMap[day]) dayMap[day] = { day, sent: 0, opens: 0 };
        dayMap[day].sent++;
        if (log.status === 'opened' || !!log.opened_at) dayMap[day].opens++;
      });
      return Object.values(dayMap).slice(-14);
    }
    
    // Dynamic Fallback for historical migrated campaigns safely mapped
    if (stats.sent > 0 || stats.opened > 0) {
      const creationDay = campaign?.created_at
        ? new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'All Time';
      return [{ day: creationDay, sent: stats.sent, opens: stats.opened }];
    }

    return [];
  }, [logs, stats, campaign]);

  // Open vs Not Opened vs Replied Pie
  const pieData = useMemo(() => [
    { name: 'Opened', value: Math.max(0, stats.opened - stats.replied), color: '#f97316' },
    { name: 'Replied', value: stats.replied, color: '#22c55e' },
    { name: 'Not Opened', value: Math.max(0, stats.sent - Math.max(stats.opened, stats.replied)), color: '#3b82f6' }
  ].filter(d => d.value > 0), [stats]);

  // Subject line analysis from logs
  const subjectPerformance = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const sub = log.subject_used || 'Default';
      if (!map[sub]) map[sub] = { subject: sub, sent: 0, opened: 0 };
      map[sub].sent++;
      if (log.status === 'opened' || log.status === 'replied') map[sub].opened++;
    });
    return Object.values(map)
      .map(s => ({ ...s, openRate: s.sent > 0 ? ((s.opened / s.sent) * 100).toFixed(1) : 0 }))
      .sort((a, b) => parseFloat(b.openRate) - parseFloat(a.openRate));
  }, [logs]);

  const exportCsv = () => {
    const headers = ['email', 'status', 'subject_used', 'opened', 'replied', 'date'];
    const rows = logs.map(log => [
      `"${log.contact_email || ''}"`,
      `"${log.status || ''}"`,
      `"${(log.subject_used || '').replace(/"/g, '""')}"`,
      log.status === 'opened' || log.status === 'replied' ? 'Yes' : 'No',
      log.status === 'replied' ? 'Yes' : 'No',
      log.sent_at ? new Date(log.sent_at).toLocaleDateString() : '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign?.name?.replace(/\s+/g, '_') || 'campaign'}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportRepliedCsv = async () => {
    try {
      const replied = await api.campaigns.repliedContacts(id);
      if (!replied.length) {
        alert('No replied contacts yet for this campaign.');
        return;
      }
      const headers = ['email', 'first_name', 'last_name', 'company', 'replied_at', 'sent_at', 'opened_at'];
      const rows = replied.map(r => {
        let company = '';
        try { company = JSON.parse(r.custom_fields || '{}').company || ''; } catch {}
        return [
          `"${r.email || ''}"`,
          `"${r.first_name || ''}"`,
          `"${r.last_name || ''}"`,
          `"${company}"`,
          r.replied_at ? new Date(r.replied_at).toLocaleString() : '',
          r.sent_at ? new Date(r.sent_at).toLocaleString() : '',
          r.opened_at ? new Date(r.opened_at).toLocaleString() : '',
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaign?.name?.replace(/\s+/g, '_') || 'campaign'}_replied_contacts.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export replied contacts:', err);
    }
  };

  if (loadingCampaign) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Loading campaign analytics...</p></div>;
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Campaign not found.</p>
        <Link to="/campaigns" className="text-primary hover:underline text-sm">← Back to campaigns</Link>
      </div>
    );
  }

  try {
    return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/campaigns" className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold text-foreground truncate">{analytics?.campaign?.name || campaign.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <StatusBadge status={analytics?.campaign?.status || campaign.status} />
            <p className="text-sm text-muted-foreground truncate">{analytics?.campaign?.subject || campaign.subject}</p>
          </div>
        </div>
        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportRepliedCsv}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-green/30 bg-brand-green/5 hover:bg-brand-green/10 transition-colors text-sm text-brand-green font-medium"
            >
              <MessageSquare className="w-4 h-4" /> Export Replied
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary transition-colors text-sm text-foreground"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        )}
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox label="Sent (All Time)" value={stats.sent} icon={Send} color="text-foreground" />
        <StatBox label="Opened (All Time)" value={stats.opened} icon={Eye} color="text-brand-blue" />
        <StatBox label="Replied (All Time)" value={stats.replied} icon={MessageSquare} color="text-brand-green" />
        <StatBox label="Not Replied" value={Math.max(0, stats.sent - stats.replied)} icon={AlertCircle} color="text-brand-yellow" />
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatBox label="Open Rate" value={`${stats.openRate.toFixed(1)}%`} icon={TrendingUp} color="text-brand-blue" />
        <StatBox label="Reply Rate" value={`${stats.replyRate.toFixed(1)}%`} icon={MessageSquare} color="text-brand-green" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline - Opens, Clicks, Bounces */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Opens & Engagement Over Time</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
                <Line type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={2} dot={false} name="Opens" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No engagement data yet. Campaign logs will appear here as emails are sent.
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Engagement Breakdown</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.color || COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color || COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm text-center">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Subject Line Performance */}
      {subjectPerformance.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Subject Line Performance
          </h3>
          <div className="space-y-3">
            {subjectPerformance.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {i === 0 && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">Best</span>}
                    <p className="text-sm text-foreground truncate">{s.subject}</p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, parseFloat(s.openRate))}%` }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{s.openRate}%</p>
                  <p className="text-xs text-muted-foreground">open rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bar chart - send volume per day */}
      {timelineData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Daily Send Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sent" fill="#f97316" radius={[4, 4, 0, 0]} name="Sent" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-contact log */}
      {logs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground">Per-Contact Results ({logs.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Subject Used</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.slice(0, 100).map(log => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3 text-sm text-foreground">{log.contact_email}</td>
                    <td className="px-5 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-5 py-3 text-sm text-muted-foreground truncate max-w-xs">{log.subject_used || '—'}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{log.sent_at ? new Date(log.sent_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    );
  } catch (err) {
    console.error('Analytics Render Error:', err);
    return <div className="p-8 text-center text-red-500 font-bold">Failed to load analytics: {err.message}</div>;
  }
}