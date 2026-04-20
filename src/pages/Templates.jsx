import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Layout, Trash2, Edit, FileText, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EmptyState from '../components/shared/EmptyState';

const categories = ['outreach', 'follow_up', 'newsletter', 'promotional', 'other'];

export default function Templates() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', category: 'outreach' });
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.templates.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await api.templates.update(editingId, form);
      } else {
        await api.templates.create(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setForm({ name: '', subject: '', body: '', category: 'outreach' });
      setEditingId(null);
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.templates.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const openEdit = (t) => {
    setForm({ name: t.name, subject: t.subject || '', body: t.body || '', category: t.category || 'outreach' });
    setEditingId(t.id);
    setOpen(true);
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">{templates.length} templates</p>
        </div>
        <div className="flex gap-2">
        <Link to="/templates/editor" className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl px-4 py-2.5 text-sm transition-all border border-border">
          <Wand2 className="w-4 h-4" /> Visual Editor
        </Link>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditingId(null); setForm({ name: '', subject: '', body: '', category: 'outreach' }); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-heading">{editingId ? 'Edit' : 'Create'} Template</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1 bg-background border-border" placeholder="Template name" /></div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => update('category', v)}>
                    <SelectTrigger className="mt-1 bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Subject Line</Label><Input value={form.subject} onChange={e => update('subject', e.target.value)} className="mt-1 bg-background border-border" placeholder="Email subject" /></div>
              <div>
                <Label className="text-sm font-medium text-foreground">Email Body</Label>
                <textarea
                  value={form.body}
                  onChange={e => update('body', e.target.value)}
                  className="mt-1.5 w-full min-h-[300px] rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 resize-y leading-relaxed"
                  placeholder="Write your email body here... Use {{name}}, {{company}}, {{email}} for personalization."
                />
              </div>
              <Button onClick={() => saveMutation.mutate()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{editingId ? 'Update' : 'Create'} Template</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={FileText} title="No templates" description="Create reusable email templates to speed up your campaigns." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <span className="inline-block text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5 capitalize mb-2">{t.category?.replace('_', ' ') || 'outreach'}</span>
              {t.subject && <p className="text-xs text-muted-foreground truncate">Subject: {t.subject}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}