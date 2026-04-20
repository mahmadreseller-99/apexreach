import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{payload[0].value}{payload[0].dataKey === 'rate' ? '%' : ''}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts() {
  const { user: currentUser } = useAuth();

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-stats', currentUser?.email],
    queryFn: async () => {
      const res = await api.campaigns.list();
      return [...res].sort((a,b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    },
    enabled: !!currentUser,
  });

  // Build send volume per campaign (last 7)
  const sendData = campaigns.slice(-7).map(c => ({
    day: c.name?.slice(0, 8) || 'Campaign',
    sent: c.sent_count || 0,
  }));

  // Build open rate per campaign (last 7)
  const openData = campaigns.slice(-7).map(c => ({
    day: c.name?.slice(0, 8) || 'Campaign',
    rate: c.sent_count > 0 ? Math.round((c.opened_count / c.sent_count) * 100) : 0,
  }));

  // Fallback placeholder data if no campaigns yet
  const placeholderSend = [
    { day: 'Mon', sent: 0 }, { day: 'Tue', sent: 0 }, { day: 'Wed', sent: 0 },
    { day: 'Thu', sent: 0 }, { day: 'Fri', sent: 0 }, { day: 'Sat', sent: 0 }, { day: 'Sun', sent: 0 },
  ];
  const placeholderOpen = [
    { day: 'Mon', rate: 0 }, { day: 'Tue', rate: 0 }, { day: 'Wed', rate: 0 },
    { day: 'Thu', rate: 0 }, { day: 'Fri', rate: 0 }, { day: 'Sat', rate: 0 }, { day: 'Sun', rate: 0 },
  ];

  const finalSend = sendData.length > 0 ? sendData : placeholderSend;
  const finalOpen = openData.length > 0 ? openData : placeholderOpen;

  // Grid line color that works in both themes
  const gridColor = 'hsl(var(--border))';
  const tickColor = 'hsl(var(--muted-foreground))';

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Send Volume */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Campaign Send Volume</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={finalSend}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sent" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Open Rate */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Open Rate Per Campaign</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={finalOpen}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="rate" stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}