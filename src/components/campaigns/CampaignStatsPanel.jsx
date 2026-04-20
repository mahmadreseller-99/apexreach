import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Send, Eye, MousePointer, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';

const COLORS = {
  opened: '#3b82f6',
  clicked: '#f97316',
  replied: '#22c55e',
  failed: '#ef4444',
  sent: '#8b5cf6',
};

function pct(num, denom) {
  if (!denom) return 0;
  return parseFloat(((num / denom) * 100).toFixed(1));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground">{p.value}{p.name.includes('Rate') ? '%' : ''}</span>
        </div>
      ))}
    </div>
  );
};

export default function CampaignStatsPanel({ campaigns = [] }) {
  const completedCampaigns = campaigns.filter(c => c.sent_count > 0);

  const aggregates = useMemo(() => {
    const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
    const totalOpened = campaigns.reduce((s, c) => s + (c.opened_count || 0), 0);
    const totalClicked = campaigns.reduce((s, c) => s + (c.clicked_count || 0), 0);
    const totalReplied = campaigns.reduce((s, c) => s + (c.replied_count || 0), 0);
    const totalFailed = campaigns.reduce((s, c) => s + (c.failed_count || 0), 0);
    return { totalSent, totalOpened, totalClicked, totalReplied, totalFailed };
  }, [campaigns]);

  // Per-campaign bar data
  const campaignBarData = useMemo(() =>
    completedCampaigns.slice(-8).map(c => ({
      name: c.name.length > 14 ? c.name.slice(0, 14) + '…' : c.name,
      'Open Rate': pct(c.opened_count, c.sent_count),
      'Reply Rate': pct(c.replied_count, c.sent_count),
    })),
    [completedCampaigns]
  );

  // Engagement pie
  const pieData = useMemo(() => {
    const { totalOpened, totalClicked, totalReplied, totalFailed, totalSent } = aggregates;
    const engaged = totalOpened + totalClicked + totalReplied;
    const notEngaged = Math.max(0, totalSent - engaged - totalFailed);
    return [
      { name: 'Opened', value: totalOpened, color: COLORS.opened },
      { name: 'Clicked', value: totalClicked, color: COLORS.clicked },
      { name: 'Replied', value: totalReplied, color: COLORS.replied },
      { name: 'Failed', value: totalFailed, color: COLORS.failed },
      { name: 'No Engagement', value: notEngaged, color: '#e5e7eb' },
    ].filter(d => d.value > 0);
  }, [aggregates]);

  // Volume area chart (campaigns over time)
  const volumeData = useMemo(() =>
    completedCampaigns.slice(-10).map(c => ({
      name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
      Sent: c.sent_count || 0,
      Opened: c.opened_count || 0,
    })),
    [completedCampaigns]
  );

  const { totalSent, totalOpened, totalClicked, totalReplied, totalFailed } = aggregates;
  const openRate = pct(totalOpened, totalSent);
  const clickRate = pct(totalClicked, totalSent);
  const replyRate = pct(totalReplied, totalSent);
  const bounceRate = pct(totalFailed, totalSent);

  if (campaigns.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Real-Time Campaign Statistics
        </h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> Live · refreshes every 5s
        </span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Rate', value: `${openRate}%`, icon: Eye, color: 'text-blue-500', bg: 'bg-blue-500/10', raw: `${totalOpened.toLocaleString()} opens` },
          { label: 'Reply Rate', value: `${replyRate}%`, icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-500/10', raw: `${totalReplied.toLocaleString()} replies` },
          { label: 'Total Sent', value: totalSent.toLocaleString(), icon: Send, color: 'text-purple-500', bg: 'bg-purple-500/10', raw: `${campaigns.length} campaigns` },
        ].map(({ label, value, icon: Icon, color, bg, raw }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-foreground font-heading">{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{raw}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Volume Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Email Volume by Campaign</h3>
          {volumeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={volumeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="Sent" stroke="#8b5cf6" strokeWidth={2} fill="url(#sentGrad)" />
                <Area type="monotone" dataKey="Opened" stroke="#3b82f6" strokeWidth={2} fill="url(#openGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>

        {/* Engagement Pie */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Engagement Breakdown</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value.toLocaleString(), name]} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </div>
      </div>

      {/* Per-Campaign Rate Bar Chart */}
      {campaignBarData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Open / Reply Rate per Campaign</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={campaignBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={12} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Open Rate" fill={COLORS.opened} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Reply Rate" fill={COLORS.replied} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}