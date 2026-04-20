import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Sparkles, Save, Clock, Eye, Send, ShieldCheck, BookmarkPlus, Code, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import SpamScoreAnalyzer from '@/components/campaigns/SpamScoreAnalyzer';
import AttachmentUploader from '@/components/campaigns/AttachmentUploader';
import CampaignScheduler from '@/components/campaigns/CampaignScheduler';
import ABTestConfig from '@/components/campaigns/ABTestConfig';
import EmailPreviewModal from '@/components/campaigns/EmailPreviewModal';
import TestSendModal from '@/components/campaigns/TestSendModal';

const steps = ['Basic Info', 'Email Content', 'SMTP & Settings', 'Review & Launch'];

export default function CampaignCreator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showTestSend, setShowTestSend] = useState(false);
  const [showSpam, setShowSpam] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [form, setForm] = useState({
    name: '', list_id: '', subject: '', subjects: [''], body: '',
    smtp_ids: [], delay_seconds: 5, track_opens: true, track_clicks: true,
    attachment_urls: [],
    status: 'draft', scheduled_at: '', timezone: 'UTC',
    ab_test_split: 20, ab_winner_metric: 'open_rate', ab_winner_hours: 4,
  });

  const { user: currentUser } = useAuth();

  const { data: lists = [] } = useQuery({
    queryKey: ['contact-lists', currentUser?.email],
    queryFn: () => api.lists.list(),
    enabled: !!currentUser,
  });
  const { data: smtpAccounts = [] } = useQuery({
    queryKey: ['smtp-accounts', currentUser?.email],
    queryFn: () => api.smtp.list(),
    enabled: !!currentUser,
  });
  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.templates.list(),
  });

  useEffect(() => {
    if (id) {
      api.campaigns.list().then(campaigns => {
        const c = campaigns.find(camp => camp.id === id);
        if (c) setForm({
          name: c.name || '', list_id: c.list_id || '', subject: c.subject || '',
          subjects: c.subjects?.length ? c.subjects : [c.subject || ''],
          body: c.body || '',
          smtp_ids: c.smtp_ids || [], delay_seconds: c.delay_seconds || 5,
          attachment_urls: c.attachment_urls || [],
          track_opens: c.track_opens !== false, track_clicks: c.track_clicks !== false,
          status: c.status || 'draft', scheduled_at: c.scheduled_at || '', timezone: c.timezone || 'UTC',
          ab_test_split: c.ab_test_split || 20, ab_winner_metric: c.ab_winner_metric || 'open_rate',
          ab_winner_hours: c.ab_winner_hours || 4,
        });
      });
    }
  }, [id]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (id) {
        await api.campaigns.update(id, data);
        return { id: id };
      }
      return api.campaigns.create(data);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/campaigns');
    },
  });

  const handleSave = async (sendNow = false) => {
    const subjects = form.subjects.filter(s => s.trim());
    let status = 'draft';
    if (sendNow && form.scheduled_at) status = 'scheduled';
    else if (sendNow) status = 'sending';
    
    try {
      if (sendNow) {
         const stat = form.scheduled_at ? 'scheduled' : 'ready';
         await api.campaigns.create({
           ...form,
           subjects,
           subject: subjects[0] || form.subject,
           status: stat,
           scheduled_at: form.scheduled_at || null,
         });
         navigate('/campaigns');
         toast.success(stat === 'scheduled' ? 'Campaign scheduled successfully!' : 'Campaign saved and ready to start!');
      } else {
         saveMutation.mutate({
           ...form,
           subjects,
           subject: subjects[0] || form.subject,
           status,
           scheduled_at: form.scheduled_at || null,
         });
      }
    } catch(err) {
      toast.error(err.message || 'Failed to launch');
    }
  };

  const generateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await api.ai.generate(aiPrompt);
      setForm(prev => ({
        ...prev,
        body: result.body || prev.body,
        subjects: result.subject ? [result.subject, ...prev.subjects.slice(1)] : prev.subjects,
        subject: result.subject || prev.subject
      }));
      toast.success('Content generated!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAsTemplate = async () => {
    const name = form.name ? `${form.name} Template` : 'New Template';
    const primarySubject = form.subjects.find(s => s.trim()) || '';
    setSavingTemplate(true);
    await api.templates.create({ name, subject: primarySubject, body: form.body, category: 'outreach' });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
    setSavingTemplate(false);
  };

  const loadTemplate = (templateId) => {
    const t = templates.find(t => t.id === templateId);
    if (!t) return;
    // Visual templates store body as JSON with __blocks and __html
    // Extract the rendered HTML for campaign use
    let templateBody = t.body || '';
    try {
      const parsed = JSON.parse(templateBody);
      if (parsed.__html) {
        templateBody = parsed.__html;
      }
    } catch {
      // Not JSON, use body as-is (plain text or raw HTML template)
    }
    setForm(prev => ({
      ...prev,
      body: templateBody || prev.body,
      subjects: t.subject ? [t.subject, ...prev.subjects.slice(1)] : prev.subjects,
      subject: t.subject || prev.subject,
    }));
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const primarySubject = form.subjects.find(s => s.trim()) || form.subject || '';
  const selectedSmtp = smtpAccounts.filter(s => form.smtp_ids.includes(s.id));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/campaigns')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{id ? 'Edit' : 'New'} Campaign</h1>
          <p className="text-sm text-muted-foreground">{steps[step]}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                }`}
            >
              <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">{i + 1}</span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-2xl p-6">

        {/* STEP 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm text-foreground">Campaign Name</Label>
              <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="e.g. Q2 Outreach" className="mt-1.5 bg-background border-border" />
            </div>
            <div>
              <Label className="text-sm text-foreground">Contact List</Label>
              <Select value={form.list_id} onValueChange={v => updateField('list_id', v)}>
                <SelectTrigger className="mt-1.5 bg-background border-border">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {lists?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.contact_count || 0} contacts)</SelectItem>)}
                </SelectContent>
              </Select>
              {(!lists || lists.length === 0) && (
                <p className="text-xs text-muted-foreground mt-1">No lists yet. <a href="/contacts" className="text-primary">Create one first.</a></p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Email Content */}
        {step === 1 && (
          <div className="space-y-5">
            {/* A/B Test Config */}
            <ABTestConfig form={form} updateField={updateField} />

            {/* Load from template */}
            {templates.length > 0 && (
              <div className="flex items-center gap-3">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Load template:</Label>
                <Select onValueChange={loadTemplate}>
                  <SelectTrigger className="bg-background border-border text-sm h-8">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* AI Generator */}
            <div className="bg-secondary/50 border border-border rounded-xl p-4">
              <Label className="text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AI Content Generator
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Describe the email you want..."
                  className="bg-background border-border"
                  onKeyDown={e => e.key === 'Enter' && generateAI()}
                />
                <Button onClick={generateAI} disabled={isGenerating} className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <Label className="text-sm text-foreground">Email Body</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {htmlMode ? 'HTML mode — use colors, styles, images' : 'Plain text mode — simple personal email'} · Variables: <code className="text-primary">{'{{name}}'}</code> <code className="text-primary">{'{{company}}'}</code> <code className="text-primary">{'{{email}}'}</code>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    onClick={() => setHtmlMode(!htmlMode)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors h-7 ${htmlMode ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                  >
                    {htmlMode ? <><AlignLeft className="w-3 h-3" /> Plain Text</> : <><Code className="w-3 h-3" /> HTML Mode</>}
                  </button>
                  <Button size="sm" variant="outline" onClick={() => setShowPreview(true)} className="border-border h-7 text-xs gap-1.5">
                    <Eye className="w-3 h-3" /> Preview
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTestSend(true)} className="border-border h-7 text-xs gap-1.5">
                    <Send className="w-3 h-3" /> Test Send
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowSpam(!showSpam)} className="border-border h-7 text-xs gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Spam Check
                  </Button>
                  <Button size="sm" variant="outline" onClick={saveAsTemplate} disabled={savingTemplate || !form.body} className="border-border h-7 text-xs gap-1.5">
                    <BookmarkPlus className="w-3 h-3" /> {savingTemplate ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
              <div className="mt-1">
                {htmlMode ? (
                  <textarea
                    value={form.body}
                    onChange={e => updateField('body', e.target.value)}
                    className="w-full min-h-[300px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    placeholder={`<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px;">\n  <h2 style="color: #007BFF;">Hello {{name}},</h2>\n  <p>Your message here...</p>\n</div>`}
                    spellCheck={false}
                  />
                ) : (
                  <>
                    <textarea
                      value={form.body}
                      onChange={e => updateField('body', e.target.value)}
                      className="w-full min-h-[300px] rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y leading-relaxed"
                      placeholder={`Hi {{name}},\n\nI hope you're doing well. I wanted to reach out because...\n\nBest regards,\n[Your Name]`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Plain text mode — sends as a simple personal email, no formatting. Best for cold outreach.</p>
                  </>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <Label className="text-sm text-foreground">Attachments</Label>
              <p className="text-xs text-muted-foreground mb-2">Files attached here will be included in every email sent</p>
              <AttachmentUploader
                urls={form.attachment_urls || []}
                onChange={v => updateField('attachment_urls', v)}
              />
            </div>

            {/* Spam Score */}
            {showSpam && (
              <SpamScoreAnalyzer
                subject={primarySubject}
                body={form.body}
                onApplyFix={({ body: fixedBody, subject: fixedSubject }) => {
                  setForm(prev => ({
                    ...prev,
                    body: fixedBody,
                    subjects: prev.subjects.map((s, i) => i === 0 ? fixedSubject : s),
                    subject: fixedSubject,
                  }));
                }}
              />
            )}
          </div>
        )}

        {/* STEP 2: SMTP & Settings */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm text-foreground">SMTP Accounts (auto-rotates for deliverability)</Label>
              <div className="mt-2 space-y-2">
                {smtpAccounts?.map(smtp => (
                  <label key={smtp.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.smtp_ids.includes(smtp.id)}
                      onChange={e => {
                        if (e.target.checked) updateField('smtp_ids', [...form.smtp_ids, smtp.id]);
                        else updateField('smtp_ids', form.smtp_ids.filter(sid => sid !== smtp.id));
                      }}
                      className="rounded border-border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{smtp.name}</p>
                      <p className="text-xs text-muted-foreground">{smtp.from_email} · {smtp.host}:{smtp.port}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${smtp.status === 'active' ? 'bg-brand-green' : 'bg-brand-red'}`} />
                  </label>
                ))}
                {(!smtpAccounts || smtpAccounts.length === 0) && (
                  <p className="text-sm text-muted-foreground p-3 bg-secondary/50 rounded-xl">
                    No SMTP accounts found. <a href="/smtp" className="text-primary">Add one first.</a>
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Delay Between Emails: <span className="text-primary font-semibold">{form.delay_seconds}s</span></Label>
              <p className="text-xs text-muted-foreground mb-2">Longer delays improve deliverability and avoid spam filters</p>
              <Slider value={[form.delay_seconds]} onValueChange={v => updateField('delay_seconds', v[0])} min={3} max={120} step={1} className="mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>3s (faster)</span><span>120s (safer)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
              <div>
                <Label className="text-sm text-foreground">Track Opens</Label>
                <p className="text-xs text-muted-foreground">Inserts a tiny 1×1 pixel to detect when email is opened</p>
              </div>
              <Switch checked={form.track_opens} onCheckedChange={v => updateField('track_opens', v)} />
            </div>



            <div className="border-t border-border pt-5">
              <CampaignScheduler
                scheduledAt={form.scheduled_at}
                timezone={form.timezone}
                onScheduledAtChange={v => updateField('scheduled_at', v)}
                onTimezoneChange={v => updateField('timezone', v)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Review Campaign</h3>

            {/* Validation warnings */}
            {(!form.list_id || !form.body || !primarySubject || form.smtp_ids.length === 0) && (
              <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl p-4 space-y-1">
                <p className="text-sm font-semibold text-brand-yellow">⚠️ Missing required fields:</p>
                {!form.list_id && <p className="text-xs text-muted-foreground">• No contact list selected</p>}
                {!primarySubject && <p className="text-xs text-muted-foreground">• No subject line set</p>}
                {!form.body && <p className="text-xs text-muted-foreground">• No email body</p>}
                {form.smtp_ids.length === 0 && <p className="text-xs text-muted-foreground">• No SMTP account selected</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Campaign Name</p>
                <p className="text-sm font-medium text-foreground mt-1">{form.name || '—'}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject Variants</p>
                <p className="text-sm font-medium text-foreground mt-1">{form.subjects.filter(s => s).length} variant(s)</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">SMTP Accounts</p>
                <p className="text-sm font-medium text-foreground mt-1">{form.smtp_ids.length} selected</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Send Delay</p>
                <p className="text-sm font-medium text-foreground mt-1">{form.delay_seconds}s between emails</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Attachments</p>
                <p className="text-sm font-medium text-foreground mt-1">{(form.attachment_urls || []).length} file{(form.attachment_urls || []).length !== 1 ? 's' : ''} attached</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tracking</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {[form.track_opens && 'Opens', form.track_clicks && 'Clicks'].filter(Boolean).join(' + ') || 'Disabled'}
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Contact List</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {lists?.find(l => l.id === form.list_id)?.name || '—'}
                </p>
              </div>
              {form.subjects.filter(s => s).length > 1 && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 col-span-2">
                  <p className="text-xs text-primary uppercase tracking-wider">A/B Test Active</p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {form.subjects.filter(s => s).length} variants · {form.ab_test_split}% split · Winner by {form.ab_winner_metric?.replace('_', ' ')} after {form.ab_winner_hours}h
                  </p>
                </div>
              )}
              {form.scheduled_at && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 col-span-2">
                  <p className="text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Scheduled Send Time
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {new Date(form.scheduled_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {form.timezone}
                  </p>
                </div>
              )}
            </div>

            {/* Spam check */}
            <SpamScoreAnalyzer
              subject={primarySubject}
              body={form.body}
              onApplyFix={({ body: fixedBody, subject: fixedSubject }) => {
                setForm(prev => ({
                  ...prev,
                  body: fixedBody,
                  subjects: prev.subjects.map((s, i) => i === 0 ? fixedSubject : s),
                  subject: fixedSubject,
                }));
              }}
            />

            {/* Preview buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(true)} className="border-border flex-1">
                <Eye className="w-4 h-4 mr-2" /> Preview Email
              </Button>
              <Button variant="outline" onClick={() => setShowTestSend(true)} className="border-border flex-1">
                <Send className="w-4 h-4 mr-2" /> Send Test Email
              </Button>
            </div>

            {form.body && (
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Email Body Preview</p>
                <div className="bg-background rounded-lg p-4 text-sm text-foreground max-h-60 overflow-y-auto prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.body }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="border-border">
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saveMutation.isPending} className="border-border">
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => handleSave(true)}
              disabled={saveMutation.isPending || !form.list_id || !form.body || form.smtp_ids.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saveMutation.isPending ? 'Saving...' : form.scheduled_at
                ? <><Clock className="w-4 h-4 mr-2" /> Schedule Campaign</>
                : 'Launch Campaign'
              }
            </Button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPreview && (
        <EmailPreviewModal
          subject={primarySubject}
          body={form.body}
          fromName={selectedSmtp[0]?.from_name || ''}
          onClose={() => setShowPreview(false)}
        />
      )}
      {showTestSend && (
        <TestSendModal
          subject={primarySubject}
          body={form.body}
          fromName={selectedSmtp[0]?.from_name || ''}
          smtpAccounts={selectedSmtp}
          onClose={() => setShowTestSend(false)}
        />
      )}
    </div>
  );
}