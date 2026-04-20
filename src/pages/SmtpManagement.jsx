import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Trash2, Zap, BookOpen, Wifi, CheckCircle, XCircle, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EmptyState from '../components/shared/EmptyState';
import StatusBadge from '../components/shared/StatusBadge';
import SmtpProviderGuide from '../components/smtp/SmtpProviderGuide';

const PROVIDERS = [
  { id: 'gmail', label: 'Gmail', host: 'smtp.gmail.com', port: 587, imap_host: 'imap.gmail.com', imap_port: 993, secure: true },
  { id: 'outlook', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: 587, imap_host: 'outlook.office365.com', imap_port: 993, secure: true },
  { id: 'yahoo', label: 'Yahoo Mail', host: 'smtp.mail.yahoo.com', port: 587, imap_host: 'imap.mail.yahoo.com', imap_port: 993, secure: true },
  { id: 'sendgrid', label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, imap_host: '', imap_port: 993, secure: true },
  { id: 'mailgun', label: 'Mailgun', host: 'smtp.mailgun.org', port: 587, imap_host: '', imap_port: 993, secure: true },
  { id: 'amazon_ses', label: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, imap_host: '', imap_port: 993, secure: true },
  { id: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.com', port: 587, imap_host: 'imap.zoho.com', imap_port: 993, secure: true },
  { id: 'fastmail', label: 'Fastmail', host: 'smtp.fastmail.com', port: 587, imap_host: 'imap.fastmail.com', imap_port: 993, secure: true },
  { id: 'icloud', label: 'iCloud Mail', host: 'smtp.mail.me.com', port: 587, imap_host: 'imap.mail.me.com', imap_port: 993, secure: true },
  { id: 'protonmail', label: 'ProtonMail Bridge', host: '127.0.0.1', port: 1025, imap_host: '127.0.0.1', imap_port: 1143, secure: false },
  { id: 'brevo', label: 'Brevo (Sendinblue)', host: 'smtp-relay.brevo.com', port: 587, imap_host: '', imap_port: 993, secure: true },
  { id: 'postmark', label: 'Postmark', host: 'smtp.postmarkapp.com', port: 587, imap_host: '', imap_port: 993, secure: true },
  { id: 'custom', label: 'Custom / Own Domain', host: '', port: 587, imap_host: '', imap_port: 993, secure: true },
];

const defaultForm = {
  provider: '', name: '', host: '', port: 587, secure: true,
  username: '', password: '', from_email: '', from_name: '',
  imap_host: '', imap_port: 993, daily_limit: 500, warmup_enabled: false,
};

export default function SmtpManagement() {
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [testStatus, setTestStatus] = useState('idle');
  const [testError, setTestError] = useState('');
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['smtp-accounts', currentUser?.email],
    queryFn: () => api.smtp.list(),
    enabled: !!currentUser,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const { provider, ...data } = form;
      return api.smtp.create({ ...data, status: 'active', sent_today: 0, is_verified: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] });
      setForm(defaultForm);
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.smtp.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] }),
  });

  const toggleWarmup = useMutation({
    mutationFn: (acc) => api.smtp.toggleWarmup(acc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smtp-accounts'] }),
  });

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTestStatus('idle');
    setTestError('');
  };

  const handleProviderChange = (providerId) => {
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return;
    setForm(prev => ({
      ...prev,
      provider: providerId,
      host: provider.host,
      port: provider.port,
      imap_host: provider.imap_host,
      imap_port: provider.imap_port,
      secure: provider.secure,
      // Auto-set display name if not already set
      name: prev.name || provider.label,
    }));
  };

  const isFormValid = form.name && form.host && form.username && form.password && form.from_email;

  const handleTestConnection = async () => {
    if (!isFormValid) return;
    setTestStatus('testing');
    setTestError('');
    try {
      const result = await api.smtp.test({
        host: form.host, port: form.port,
        secure: form.secure,
        username: form.username, password: form.password,
        from_email: form.from_email, from_name: form.from_name
      });
      if (result.success || result.id) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
        setTestError(result.error?.message || result.error || 'Connection failed.');
      }
    } catch (e) {
      setTestStatus('error');
      setTestError(e.message || 'Could not validate settings. Please double-check your credentials.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">SMTP Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setGuideOpen(true)} className="border-border">
            <BookOpen className="w-4 h-4 mr-2" /> Setup Guide
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Add SMTP
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Add SMTP Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                {/* Provider Selector */}
                <div>
                  <Label className="text-sm">Email Provider</Label>
                  <select
                    value={form.provider}
                    onChange={e => handleProviderChange(e.target.value)}
                    className="w-full mt-1 rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">— Select a provider —</option>
                    {PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="text-xs text-primary hover:text-primary/80 mt-1.5 flex items-center gap-1"
                  >
                    <BookOpen className="w-3 h-3" /> Need help? View setup guide
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Display Name</Label>
                    <Input value={form.name} onChange={e => update('name', e.target.value)} className="mt-1 bg-background border-border" placeholder="My SMTP" />
                  </div>
                  <div>
                    <Label>From Name</Label>
                    <Input value={form.from_name} onChange={e => update('from_name', e.target.value)} className="mt-1 bg-background border-border" placeholder="John Doe" />
                  </div>
                </div>

                <div>
                  <Label>From Email</Label>
                  <Input value={form.from_email} onChange={e => update('from_email', e.target.value)} className="mt-1 bg-background border-border" placeholder="you@company.com" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SMTP Host</Label>
                    <Input value={form.host} onChange={e => update('host', e.target.value)} className="mt-1 bg-background border-border" placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <Label>Port</Label>
                    <Input type="number" value={form.port} onChange={e => update('port', parseInt(e.target.value))} className="mt-1 bg-background border-border" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username / Email</Label>
                    <Input value={form.username} onChange={e => update('username', e.target.value)} className="mt-1 bg-background border-border" placeholder="you@gmail.com" />
                  </div>
                  <div>
                    <Label>Password / App Password</Label>
                    <Input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="mt-1 bg-background border-border" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>IMAP Host <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input value={form.imap_host} onChange={e => update('imap_host', e.target.value)} className="mt-1 bg-background border-border" placeholder="imap.gmail.com" />
                  </div>
                  <div>
                    <Label>IMAP Port</Label>
                    <Input type="number" value={form.imap_port} onChange={e => update('imap_port', parseInt(e.target.value))} className="mt-1 bg-background border-border" />
                  </div>
                </div>

                <div>
                  <Label>Daily Send Limit</Label>
                  <Input type="number" value={form.daily_limit} onChange={e => update('daily_limit', parseInt(e.target.value))} className="mt-1 bg-background border-border" />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Use TLS / SSL</Label>
                  <Switch checked={form.secure} onCheckedChange={v => update('secure', v)} />
                </div>

                {/* Test Connection */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={!isFormValid || testStatus === 'testing'}
                    className="w-full border-border gap-2"
                  >
                    {testStatus === 'testing' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Testing Connection...</>
                    ) : (
                      <><Wifi className="w-4 h-4" /> Test Connection</>
                    )}
                  </Button>
                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 text-sm text-brand-green bg-brand-green/10 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" /> SMTP settings look valid! You're good to add this account.
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="flex items-start gap-2 text-sm text-brand-red bg-brand-red/10 p-3 rounded-lg">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {testError}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!isFormValid || createMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No SMTP accounts"
          description="Add an SMTP account to start sending emails. Click 'Setup Guide' for help."
          action={
            <Button variant="outline" onClick={() => setGuideOpen(true)} className="border-border">
              <BookOpen className="w-4 h-4 mr-2" /> View Setup Guide
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${acc.status === 'active' ? 'bg-brand-green' : acc.status === 'error' ? 'bg-brand-red' : 'bg-muted-foreground'}`} />
                  <h3 className="text-sm font-semibold text-foreground">{acc.name}</h3>
                </div>
                <button onClick={() => deleteMutation.mutate(acc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
              {acc.from_name && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <User className="w-3 h-3 text-primary flex-shrink-0" />
                  <p className="text-xs font-medium text-foreground">{acc.from_name}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-1">{acc.from_email}</p>
              <p className="text-xs text-muted-foreground mb-3">{acc.host}:{acc.port}</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">Daily: {acc.sent_today || 0}/{acc.daily_limit}</span>
                <StatusBadge status={acc.status} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Warmup</span>
                </div>
                <Switch checked={acc.warmup_enabled || false} onCheckedChange={() => toggleWarmup.mutate(acc)} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <SmtpProviderGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}