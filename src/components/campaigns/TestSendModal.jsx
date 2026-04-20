import React, { useState } from 'react';
import { X, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/apiClient';

export default function TestSendModal({ subject, body, fromName, smtpAccounts, onClose }) {
  const [email, setEmail] = useState('');
  const [smtpId, setSmtpId] = useState(smtpAccounts?.[0]?.id || '');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!smtpId) {
      setError('Please select an active SMTP account.');
      return;
    }
    if (!subject && !body) {
      setError('No email content. Please add a subject and body first.');
      return;
    }

    setStatus('sending');
    setError('');

    try {
      await api.campaigns.testSend({
        to: email,
        subject: subject || '(No subject)',
        body: body || '(No body)',
        smtp_id: smtpId
      });
      setStatus('done');
    } catch (err) {
      setError(`Failed to send: ${err?.message || 'Unknown error'}`);
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-base font-bold text-foreground">Send Test Email</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {status === 'done' ? (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0" />
              <p className="font-semibold text-foreground text-sm">Test email sent!</p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1 mb-4">
              <p>To: <span className="text-foreground font-medium">{email}</span></p>
              <p>Subject: <span className="text-foreground font-medium">[TEST] {subject || '(No subject)'}</span></p>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Check your inbox (and spam/promotions folder) to preview how the email looks.</p>
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
              <p>Subject: <span className="text-foreground font-medium">{subject || '(No subject)'}</span></p>
              <p>From: <span className="text-foreground">{fromName || smtpAccounts?.[0]?.from_name || 'ApexReach'}</span></p>
            </div>

            <div>
              <Label>Select SMTP Account</Label>
              <select
                value={smtpId}
                onChange={e => setSmtpId(e.target.value)}
                className="w-full mt-1 mb-3 rounded-lg border border-border bg-background text-foreground text-sm px-3 py-2"
              >
                <option value="">— Select an account —</option>
                {smtpAccounts?.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.from_email})</option>
                ))}
              </select>

              <Label>Send test to (any email including Gmail)</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="youremail@gmail.com"
                className="mt-1 bg-background border-border"
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-brand-red bg-brand-red/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 border-border">Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={status === 'sending' || !email}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {status === 'sending' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><Send className="w-4 h-4 mr-2" /> Send Test</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}