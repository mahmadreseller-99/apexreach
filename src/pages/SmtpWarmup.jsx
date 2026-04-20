import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, TrendingUp, Shield, Info, ArrowLeft, Zap, CheckCircle, Play, Loader2, Mail, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Warmup schedule: day -> daily limit
function getWarmupSchedule(startLimit = 10) {
  const schedule = [];
  let limit = startLimit;
  for (let day = 1; day <= 30; day++) {
    schedule.push({ day: `D${day}`, limit: Math.round(limit) });
    if (day <= 7) limit = Math.min(limit * 1.5, 50);
    else if (day <= 14) limit = Math.min(limit * 1.3, 150);
    else if (day <= 21) limit = Math.min(limit * 1.2, 300);
    else limit = Math.min(limit * 1.15, 500);
  }
  return schedule;
}

// In-memory session logs per account
const warmupLogs = {};

// Tooltip (i) component
function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer flex-shrink-0"
        tabIndex={0}
        onBlur={() => setShow(false)}
      >
        i
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-6 top-0 w-56 bg-popover border border-border rounded-xl p-3 text-xs text-muted-foreground shadow-xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function WarmupCard({ account, onToggle, onRunBatch }) {
  const schedule = getWarmupSchedule(10);
  const daysRunning = account.warmup_days || 0;
  const currentDay = Math.min(daysRunning, 30);
  const todayLimit = currentDay > 0 ? schedule[currentDay - 1]?.limit : 10;
  const progress = (currentDay / 30) * 100;
  const logs = warmupLogs[account.id] || [];
  const [running, setRunning] = useState(false);
  const [localLogs, setLocalLogs] = useState(logs);

  const handleRunBatch = async () => {
    setRunning(true);
    await onRunBatch(account, Math.min(Math.ceil(todayLimit / 5), 5));
    setLocalLogs([...(warmupLogs[account.id] || [])]);
    setRunning(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${account.warmup_enabled ? 'bg-brand-green animate-pulse' : 'bg-muted-foreground'}`} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{account.name}</h3>
            <p className="text-xs text-muted-foreground">{account.from_name ? `${account.from_name} <${account.from_email}>` : account.from_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <InfoTooltip text="Toggle warmup to start/stop the gradual email sending program. Warmup trains email providers to trust your domain over 30 days." />
          <Switch checked={account.warmup_enabled || false} onCheckedChange={() => onToggle(account)} />
        </div>
      </div>

      {account.warmup_enabled ? (
        <>
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                Day {currentDay} of 30
                <InfoTooltip text="Each batch you run counts as one warmup day. Run at least once daily for best results." />
              </span>
              <span className="text-primary font-semibold flex items-center gap-1">
                {todayLimit} emails/day cap
                <InfoTooltip text="This is the maximum emails to send today per the warmup schedule. Sending more can trigger spam filters." />
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-brand-green rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center bg-secondary/40 rounded-xl py-2">
              <p className="text-base font-heading font-bold text-foreground">{currentDay}</p>
              <p className="text-xs text-muted-foreground">Days done</p>
            </div>
            <div className="text-center bg-secondary/40 rounded-xl py-2">
              <p className="text-base font-heading font-bold text-primary">{todayLimit}</p>
              <p className="text-xs text-muted-foreground">Today cap</p>
            </div>
            <div className="text-center bg-secondary/40 rounded-xl py-2">
              <p className="text-base font-heading font-bold text-brand-green">{Math.max(0, 30 - currentDay)}</p>
              <p className="text-xs text-muted-foreground">Days left</p>
            </div>
          </div>

          {currentDay >= 30 ? (
            <div className="flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 rounded-xl px-3 py-2 text-xs text-brand-green">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> Warmup complete! Full capacity unlocked.
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleRunBatch}
              disabled={running}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 gap-1.5"
            >
              {running
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending warmup emails...</>
                : <><Play className="w-3.5 h-3.5" /> Run Today's Warmup Batch</>
              }
            </Button>
          )}

          {/* Session logs */}
          {localLogs.length > 0 && (
            <div className="bg-secondary/30 rounded-xl p-2.5 space-y-1 max-h-28 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Recent sends this session:</p>
              {localLogs.slice(-8).reverse().map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Mail className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground truncate flex-1">{log.to}</span>
                  <span className={`font-medium flex-shrink-0 ${log.ok ? 'text-brand-green' : 'text-brand-red'}`}>
                    {log.ok ? '✓ sent' : '✗ failed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <Flame className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Warmup disabled</p>
          <p className="text-xs text-muted-foreground mt-1">Enable to gradually build sender reputation</p>
        </div>
      )}
    </motion.div>
  );
}

export default function SmtpWarmup() {
  const queryClient = useQueryClient();
  const [batchStatus, setBatchStatus] = useState(null);
  const autoTimerRef = useRef(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { user: currentUser } = useAuth();

  const { data: accounts = [] } = useQuery({
    queryKey: ['smtp-accounts', currentUser?.email],
    queryFn: () => api.smtp.list(),
    enabled: !!currentUser,
  });

  const toggleWarmup = useMutation({
    mutationFn: (acc) => api.smtp.toggleWarmup(acc.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['smtp-accounts', currentUser?.email] }),
  });

  const runWarmupBatch = async (account, count = 3) => {
    setBatchStatus({ type: 'loading', msg: `Preparing warmup batch for ${account.name}...` });

    if (!warmupLogs[account.id]) warmupLogs[account.id] = [];

    try {
      const res = await api.smtp.runWarmup(account.id);
      warmupLogs[account.id].push({ to: account.from_email, subject: `Warmup batch executed (${res.sent || 5} emails)`, ok: true, ts: Date.now() });
      
      queryClient.invalidateQueries({ queryKey: ['smtp-accounts', currentUser?.email] });
      setForceUpdate(n => n + 1);
      setBatchStatus({ type: 'success', msg: `✓ Warmup day ${res.day} complete: ${res.sent} real emails delivered to ${account.from_email}` });
      setTimeout(() => setBatchStatus(null), 5000);
    } catch (e) {
      warmupLogs[account.id].push({ to: account.from_email, subject: 'Warmup execution failed', ok: false, ts: Date.now() });
      setBatchStatus({ type: 'error', msg: `Warmup failed: ${e.message}` });
    }
  };

  // Auto-trigger warmup for enabled accounts once per day on page load
  useEffect(() => {
    const enabledAccounts = accounts.filter(a => a.warmup_enabled);
    if (enabledAccounts.length === 0) return;

    const key = 'apexreach_warmup_last_run';
    const lastRun = localStorage.getItem(key);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastRun || now - parseInt(lastRun) > oneDay) {
      autoTimerRef.current = setTimeout(async () => {
        for (const acc of enabledAccounts) {
          await runWarmupBatch(acc, 3);
        }
        localStorage.setItem(key, String(now));
      }, 3000);
    }
    return () => clearTimeout(autoTimerRef.current);
  }, [accounts.length]);

  const schedule = getWarmupSchedule(10);
  const warmupEnabled = accounts.filter(a => a.warmup_enabled).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/smtp" className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            Email Warmup
            <InfoTooltip text="Email warmup gradually increases your daily send volume over 30 days so email providers learn to trust your domain, ensuring inbox delivery instead of spam folders." />
          </h1>
          <p className="text-sm text-muted-foreground">{warmupEnabled} account{warmupEnabled !== 1 ? 's' : ''} warming up</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">How Email Warmup Works</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              New email accounts risk being flagged as spam if they immediately send bulk emails. Warmup gradually
              increases daily send volume over 30 days — real emails are sent to build a positive reputation with Gmail,
              Outlook, and other providers. This ensures your campaigns land in the inbox, not spam.
            </p>
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { icon: Flame, label: 'Week 1', desc: 'Up to 50/day', tip: 'Starting slow builds initial trust with email providers.' },
                { icon: TrendingUp, label: 'Week 2', desc: 'Up to 150/day', tip: 'Increasing volume shows consistent sending behavior.' },
                { icon: Zap, label: 'Week 3', desc: 'Up to 300/day', tip: 'Domain reputation is now established.' },
                { icon: Shield, label: 'Week 4+', desc: 'Up to 500/day', tip: 'Full warmup complete — inbox delivery guaranteed.' },
              ].map(({ icon: Icon, label, desc, tip }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span className="font-medium text-foreground">{label}:</span> {desc}
                  <InfoTooltip text={tip} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          30-Day Warmup Schedule
          <InfoTooltip text="This chart shows how many emails will be sent each day during the 30-day warmup program. The gradual increase builds sender reputation safely." />
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={schedule} barSize={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
            <RechartsTooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}
              itemStyle={{ color: 'hsl(var(--primary))', fontSize: '12px' }}
              formatter={(v) => [v + ' emails', 'Daily Limit']}
            />
            <Bar dataKey="limit" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Global batch status */}
      <AnimatePresence>
        {batchStatus && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm border ${
              batchStatus.type === 'loading'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : batchStatus.type === 'success'
                ? 'bg-brand-green/10 border-brand-green/30 text-brand-green'
                : 'bg-brand-red/10 border-brand-red/30 text-brand-red'
            }`}
          >
            {batchStatus.type === 'loading'
              ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              : batchStatus.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />
            }
            <span className="flex-1">{batchStatus.msg}</span>
            <button onClick={() => setBatchStatus(null)}>
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Per-account cards */}
      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No SMTP accounts found.</p>
          <Link to="/smtp" className="text-primary text-sm hover:underline mt-1 inline-block">Add an SMTP account →</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => (
            <WarmupCard
              key={acc.id + forceUpdate}
              account={acc}
              onToggle={(a) => toggleWarmup.mutate(a)}
              onRunBatch={runWarmupBatch}
            />
          ))}
        </div>
      )}

      {/* Best practices */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Inbox Deliverability Best Practices
          <InfoTooltip text="Following these practices alongside warmup ensures maximum inbox placement rates for your campaigns." />
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { tip: 'Set up SPF, DKIM, and DMARC records on your domain', info: 'These DNS records authenticate your emails and prevent spoofing. Essential for inbox delivery.' },
            { tip: 'Use a custom domain — avoid Gmail/Yahoo for bulk sending', info: 'Free email providers have strict sending limits and lower deliverability for bulk campaigns.' },
            { tip: 'Keep bounce rate below 2% and spam rate below 0.1%', info: 'High bounce rates signal bad lists to email providers and damage sender reputation quickly.' },
            { tip: 'Always include an unsubscribe link in every email', info: 'Required by law (CAN-SPAM, GDPR). Unsubscribes protect reputation; spam complaints hurt it.' },
            { tip: 'Personalize emails with recipient name/company', info: 'Personalized emails have 26% higher open rates and are less likely to be flagged as bulk.' },
            { tip: 'Avoid spam trigger words (FREE, URGENT, !!!)', info: 'Words like FREE, WINNER, ACT NOW trigger spam filters. Use the Spam Analyzer in campaigns.' },
            { tip: 'Send from a consistent IP and domain', info: 'Switching IPs or domains resets your sender reputation. Consistency is key to deliverability.' },
            { tip: 'Keep contact lists clean — remove bounced emails', info: 'Regularly prune bounced and inactive contacts. Upload clean lists to maintain sending reputation.' },
          ].map(({ tip, info }, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" />
              <span className="flex-1">{tip}</span>
              <InfoTooltip text={info} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}