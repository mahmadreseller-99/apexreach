import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, GitBranch, Clock, ChevronDown, ChevronUp, Edit, Play, Pause, Info, BarChart3, Send, MessageSquare, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/shared/EmptyState';
import StatusBadge from '../components/shared/StatusBadge';

const defaultStep = { subject: '', body: '', delay_hours: 24 };

function StepCard({ step, index, onUpdate, onDelete, isLast }) {
  const [open, setOpen] = useState(index === 0);

  const delayLabel = step.delay_hours < 24
    ? `${step.delay_hours}h after previous`
    : step.delay_hours === 24 ? '1 day after previous'
    : `${Math.round(step.delay_hours / 24)} days after previous`;

  return (
    <div className="relative">
      {/* connector line */}
      {!isLast && (
        <div className="absolute left-5 top-full w-0.5 h-4 bg-border z-10" />
      )}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors text-left"
          onClick={() => setOpen(!open)}
        >
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{step.subject || `Step ${index + 1} — (no subject)`}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{index === 0 ? 'Sent immediately' : delayLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 space-y-3 border-t border-border">
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">Subject Line</Label>
              <Input
                value={step.subject}
                onChange={e => onUpdate({ ...step, subject: e.target.value })}
                placeholder={`Follow-up ${index + 1} subject`}
                className="mt-1 bg-background border-border"
              />
            </div>
            {index > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground">Send after</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="1"
                    value={step.delay_hours}
                    onChange={e => onUpdate({ ...step, delay_hours: parseInt(e.target.value) || 24 })}
                    className="bg-background border-border w-24"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                  <span className="text-xs text-muted-foreground">({(step.delay_hours / 24).toFixed(1)} days)</span>
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {[24, 48, 72, 96, 168].map(h => (
                    <button
                      key={h}
                      onClick={() => onUpdate({ ...step, delay_hours: h })}
                      className={`text-xs px-2 py-1 rounded-lg transition-all ${step.delay_hours === h ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    >
                      {h === 24 ? '1d' : h === 48 ? '2d' : h === 72 ? '3d' : h === 96 ? '4d' : '1w'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Email Body</Label>
              <div className="mt-1.5">
                <textarea
                  value={step.body}
                  onChange={e => onUpdate({ ...step, body: e.target.value })}
                  className="w-full min-h-[250px] rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-y leading-relaxed"
                  placeholder="Hi {{name}},\n\nJust following up on my previous email..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DripSequences() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [seqForm, setSeqForm] = useState({ name: '', list_id: '', smtp_ids: [], stop_on_reply: true });
  const [steps, setSteps] = useState([{ ...defaultStep }]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch drip campaigns (each has .steps, .smtp_ids, .stats)
  const { data: sequences = [] } = useQuery({
    queryKey: ['drip-sequences'],
    queryFn: () => api.drip.list(),
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['contact-lists'],
    queryFn: () => api.lists.list(),
  });

  const { data: smtpAccounts = [] } = useQuery({
    queryKey: ['smtp-accounts'],
    queryFn: () => api.smtp.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: seqForm.name,
        list_id: seqForm.list_id,
        smtp_ids: seqForm.smtp_ids,
        stop_on_reply: seqForm.stop_on_reply,
        steps: steps.map((s, i) => ({
          subject: s.subject,
          body: s.body,
          delay_hours: i === 0 ? 0 : (s.delay_hours || 24),
        })),
      };

      if (editingId) {
        return api.drip.update(editingId, payload);
      } else {
        return api.drip.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drip-sequences'] });
      setCreateOpen(false);
      setEditingId(null);
      setSeqForm({ name: '', list_id: '', smtp_ids: [], stop_on_reply: true });
      setSteps([{ ...defaultStep }]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.drip.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drip-sequences'] }),
  });

  const startMutation = useMutation({
    mutationFn: (id) => api.drip.start(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drip-sequences'] }),
  });

  const openEdit = (seq) => {
    setSeqForm({
      name: seq.name || '',
      list_id: seq.list_id || '',
      smtp_ids: seq.smtp_ids || [],
      stop_on_reply: seq.stop_on_reply !== 0,
    });
    setSteps((seq.steps || []).map(s => ({
      subject: s.subject || '',
      body: s.body || '',
      delay_hours: s.delay_hours || 24,
    })));
    setEditingId(seq.id);
    setCreateOpen(true);
  };

  const openCreate = () => {
    setSeqForm({ name: '', list_id: '', smtp_ids: [], stop_on_reply: true });
    setSteps([{ ...defaultStep }]);
    setEditingId(null);
    setCreateOpen(true);
  };

  const updateStep = (i, val) => setSteps(prev => prev.map((s, j) => j === i ? val : s));
  const deleteStep = (i) => setSteps(prev => prev.filter((_, j) => j !== i));
  const addStep = () => setSteps(prev => [...prev, { subject: '', body: '', delay_hours: 24 }]);
  const toggleSmtp = (smtpId) => {
    setSeqForm(prev => ({
      ...prev,
      smtp_ids: prev.smtp_ids.includes(smtpId)
        ? prev.smtp_ids.filter(id => id !== smtpId)
        : [...prev.smtp_ids, smtpId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Drip Sequences</h1>
          <p className="text-sm text-muted-foreground mt-1">Automated follow-up sequences that stop when a recipient replies</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> New Sequence
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Drip sequences send a series of follow-up emails automatically. When a contact replies, they are automatically removed from the sequence. Set gaps between emails and the sequence handles the rest.
        </p>
      </div>

      {sequences.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No drip sequences"
          description="Create automated follow-up sequences to nurture your leads."
          action={<Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-2" />New Sequence</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map(seq => (
            <motion.div key={seq.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{seq.name || 'Untitled Sequence'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={seq.status} />
                    <span className="text-xs text-muted-foreground">{(seq.steps || []).length} step{(seq.steps || []).length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(seq)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Edit">
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(seq.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-secondary/50 rounded-lg py-1.5 px-2 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Send className="w-3 h-3" /> Sent</p>
                  <p className="text-sm font-bold text-foreground">{seq.stats?.total_sent || 0}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg py-1.5 px-2 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Opens</p>
                  <p className="text-sm font-bold text-foreground">{seq.stats?.total_opened || 0}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg py-1.5 px-2 text-center">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> Replied</p>
                  <p className="text-sm font-bold text-brand-green">{seq.stats?.total_replied || 0}</p>
                </div>
              </div>

              {/* Timeline preview */}
              <div className="space-y-1.5 mb-3 flex-1">
                {(seq.steps || []).slice(0, 4).map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                    <span className="truncate">{step.subject || '(no subject)'}</span>
                    {i > 0 && <span className="ml-auto flex-shrink-0 text-muted-foreground/60">+{step.delay_hours}h</span>}
                  </div>
                ))}
                {(seq.steps || []).length > 4 && <p className="text-xs text-muted-foreground pl-7">+{(seq.steps || []).length - 4} more steps</p>}
              </div>

              {seq.stop_on_reply ? (
                <div className="mb-3">
                  <span className="text-xs text-brand-green flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Stops on reply
                  </span>
                </div>
              ) : null}

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-border mt-auto">
                <Button
                  size="sm"
                  variant={seq.status === 'sending' ? 'outline' : 'default'}
                  onClick={() => startMutation.mutate(seq.id)}
                  className={`flex-1 text-xs ${seq.status === 'sending' ? 'border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                  disabled={startMutation.isPending || (!seq.smtp_ids?.length && seq.status !== 'sending')}
                >
                  {seq.status === 'sending' ? (
                    <><Pause className="w-3 h-3 mr-1" /> Pause</>
                  ) : (
                    <><Play className="w-3 h-3 mr-1" /> Start</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/campaigns/${seq.id}/analytics`)}
                  className="flex-1 text-xs"
                >
                  <BarChart3 className="w-3 h-3 mr-1" /> Analytics
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); setEditingId(null); } }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? 'Edit' : 'Create'} Drip Sequence</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Sequence settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sequence Name</Label>
                <Input
                  value={seqForm.name}
                  onChange={e => setSeqForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. SaaS Outreach Follow-up"
                  className="mt-1 bg-background border-border"
                />
              </div>
              <div>
                <Label>Contact List</Label>
                <Select value={seqForm.list_id} onValueChange={v => setSeqForm(p => ({ ...p, list_id: v }))}>
                  <SelectTrigger className="mt-1 bg-background border-border">
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {lists.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.contact_count || 0})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SMTP selection */}
            <div>
              <Label className="text-sm">SMTP Accounts</Label>
              <div className="mt-2 space-y-1.5">
                {smtpAccounts.map(smtp => (
                  <label key={smtp.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-secondary/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={seqForm.smtp_ids.includes(smtp.id)}
                      onChange={() => toggleSmtp(smtp.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm text-foreground">{smtp.name}</p>
                      <p className="text-xs text-muted-foreground">{smtp.from_email}</p>
                    </div>
                  </label>
                ))}
                {smtpAccounts.length === 0 && <p className="text-sm text-muted-foreground">No SMTP accounts yet.</p>}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
              <div>
                <p className="text-sm font-medium text-foreground">Stop sequence on reply</p>
                <p className="text-xs text-muted-foreground">Automatically removes contact when they reply</p>
              </div>
              <Switch checked={seqForm.stop_on_reply} onCheckedChange={v => setSeqForm(p => ({ ...p, stop_on_reply: v }))} />
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Email Steps ({steps.length})</Label>
                <button onClick={addStep} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add step
                </button>
              </div>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <StepCard
                    key={i}
                    step={step}
                    index={i}
                    onUpdate={val => updateStep(i, val)}
                    onDelete={() => deleteStep(i)}
                    isLast={i === steps.length - 1}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!seqForm.name || !seqForm.list_id || steps.length === 0 || saveMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Sequence' : 'Create Sequence'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}