// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Trash2, Copy, Pause, Play, BarChart3, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import CampaignStatsPanel from '@/components/campaigns/CampaignStatsPanel';

import { motion, AnimatePresence } from 'framer-motion';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const statusTabs = ['all', 'draft', 'sending', 'completed', 'paused', 'scheduled'];

export default function Campaigns() {
  const [activeTab, setActiveTab] = useState('all');
  const [showStats, setShowStats] = useState(true);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', currentUser?.email],
    queryFn: () => api.campaigns.list(),
    enabled: !!currentUser,
    refetchInterval: 30000,
  });

  const { data: smtpAccounts = [] } = useQuery({
    queryKey: ['smtp-accounts', currentUser?.email],
    queryFn: () => api.smtp.list(),
    enabled: !!currentUser,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.campaigns.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const cloneMutation = useMutation({
    mutationFn: async (campaign) => api.campaigns.clone(campaign.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const togglePause = useMutation({
    mutationFn: async (campaign) => {
      await api.campaigns.pause(campaign.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const startCampaign = useMutation({
    mutationFn: (campaign) => api.campaigns.start(campaign.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
    onError: (err) => alert('Failed to start: ' + err.message)
  });

  const filtered = activeTab === 'all' ? campaigns : campaigns.filter(c => c.status === activeTab);
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{campaigns.length} total campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4 py-2.5 text-sm transition-all shadow-lg shadow-primary/20 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Campaign</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Stats Panel */}
      {campaigns.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowStats(s => !s)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Real-Time Statistics</span>
            </div>
            {showStats ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showStats && (
            <div className="px-5 pb-5">
              <CampaignStatsPanel campaigns={campaigns} />
            </div>
          )}
        </div>
      )}

      {/* Status Tabs - scrollable on mobile */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto no-scrollbar">
        {statusTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab}
            {tab !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {campaigns.filter(c => c.status === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-secondary/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Send}
          title={activeTab === 'all' ? 'No campaigns yet' : `No ${activeTab} campaigns`}
          description="Create a campaign to start sending personalized emails at scale."
          action={
            <Link to="/campaigns/new" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-5 py-2.5 text-sm shadow-lg shadow-primary/20">
              Create Your First Campaign
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Campaign</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Progress</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Open Rate</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Reply Rate</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {filtered.map(c => {
                      const processed = (c.sent_count || 0) + (c.failed_count || 0);
                      const openRate = processed > 0 ? ((c.opened_count || 0) / processed * 100).toFixed(1) : '0.0';
                      const replyRate = processed > 0 ? ((c.replied_count || 0) / processed * 100).toFixed(1) : '0.0';
                      const progress = c.total_contacts > 0 ? Math.round(processed / c.total_contacts * 100) : 0;
                      return (
                        <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-4 max-w-[200px]">
                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.subject || 'No subject'}</p>
                          </td>
                          <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                          <td className="px-5 py-4 min-w-[200px]">
                            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                              <span>Sent: {c.sent_count || 0}</span>
                              <span className="px-1 text-border">|</span>
                              <span>Failed: {c.failed_count || 0}</span>
                              <span className="px-1 text-border">|</span>
                              <span>Opened: {c.opened_count || 0}</span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-sm font-semibold ${parseFloat(openRate) > 40 ? 'text-brand-green' : 'text-foreground'}`}>
                              {openRate}%
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-sm font-semibold ${parseFloat(replyRate) > 10 ? 'text-brand-green' : 'text-foreground'}`}>
                              {replyRate}%
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Link to={`/campaigns/${c.id}/analytics`} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Analytics">
                                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              </Link>
                              <Link to={`/campaigns/${c.id}/edit`} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Edit">
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </Link>
                              <button onClick={() => cloneMutation.mutate(c)} className="p-2 rounded-lg hover:bg-secondary transition-colors" title="Clone">
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              </button>
                              {['draft', 'paused', 'ready', 'scheduled'].includes(c.status) && (
                                <button onClick={() => startCampaign.mutate(c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors" title="Start">
                                  <Play className="w-3.5 h-3.5 fill-current" /> <span className="text-xs font-semibold">Start</span>
                                </button>
                              )}
                              {c.status === 'sending' && (
                                <button onClick={() => togglePause.mutate(c)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-yellow/10 text-brand-yellow hover:bg-brand-yellow/20 transition-colors" title="Pause">
                                  <Pause className="w-3.5 h-3.5 fill-current" /> <span className="text-xs font-semibold">Pause</span>
                                </button>
                              )}
                              {c.status === 'completed' && (
                                <span className="px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold border border-border">
                                  Completed
                                </span>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="p-2 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-card border-border">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{c.name}". This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-secondary border-border">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence>
              {filtered.map(c => {
                const processed = (c.sent_count || 0) + (c.failed_count || 0);
                const openRate = processed > 0 ? ((c.opened_count || 0) / processed * 100).toFixed(1) : '0.0';
                const progress = c.total_contacts > 0 ? Math.round(processed / c.total_contacts * 100) : 0;
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{c.subject || 'No subject'}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                        <span>Sent: {c.sent_count || 0}</span>
                        <span>Failed: {c.failed_count || 0}</span>
                        <span>Opened: {c.opened_count || 0}</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Open: </span>
                        <span className={`font-semibold ${parseFloat(openRate) > 40 ? 'text-brand-green' : 'text-foreground'}`}>{openRate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Replies: </span>
                        <span className="font-semibold text-foreground">{c.replied_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed: </span>
                        <span className="font-semibold text-foreground">{c.failed_count || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-border">
                      <Link to={`/campaigns/${c.id}/analytics`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors">
                        <BarChart3 className="w-3.5 h-3.5" /> Analytics
                      </Link>
                      <Link to={`/campaigns/${c.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors">
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </Link>
                      {['draft', 'paused', 'ready', 'scheduled'].includes(c.status) && (
                        <button onClick={() => startCampaign.mutate(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-green/10 text-brand-green font-semibold hover:bg-brand-green/20 text-xs transition-colors">
                          <Play className="w-3.5 h-3.5 fill-current" /> Start
                        </button>
                      )}
                      {c.status === 'sending' && (
                        <button onClick={() => togglePause.mutate(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-yellow/10 text-brand-yellow font-semibold hover:bg-brand-yellow/20 text-xs transition-colors">
                          <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                        </button>
                      )}
                      {c.status === 'completed' && (
                        <div className="flex-1 flex items-center justify-center py-2 rounded-xl bg-secondary text-muted-foreground font-semibold text-xs border border-border">
                          Completed
                        </div>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border mx-4">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete "{c.name}".</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary border-border">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}