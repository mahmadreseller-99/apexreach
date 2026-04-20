import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Mail, Users, Send, BarChart3, Settings,
  ChevronDown, ChevronRight, CheckCircle2, Zap, Flame,
  GitBranch, Layout, Activity, Shield, Upload
} from 'lucide-react';

const sections = [
  {
    id: 'overview',
    icon: Zap,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'Platform Overview',
    subtitle: 'Get familiar with ApexReach',
    steps: [
      {
        number: 1,
        title: 'What is ApexReach?',
        description: 'ApexReach is a B2B cold email outreach platform. You can manage contact lists, build campaigns, send personalized emails at scale, track opens/clicks/replies, and score leads — all from one dashboard.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-6 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
              <span className="font-heading font-bold text-foreground text-lg">ApexReach Dashboard</span>
            </div>
            {['Campaigns', 'Contacts', 'SMTP Accounts', 'Templates', 'Analytics'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        number: 2,
        title: 'Navigation',
        description: 'Use the left sidebar to navigate between sections. The sidebar includes: Dashboard, Campaigns, Contacts, SMTP Accounts, Email Warmup, Drip Sequences, Templates, Activity, and Settings.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-4 space-y-1.5">
            {[
              { icon: BarChart3, label: 'Dashboard', active: true },
              { icon: Send, label: 'Campaigns' },
              { icon: Users, label: 'Contacts' },
              { icon: Mail, label: 'SMTP Accounts' },
              { icon: Flame, label: 'Email Warmup' },
              { icon: GitBranch, label: 'Drip Sequences' },
              { icon: Layout, label: 'Templates' },
              { icon: Activity, label: 'Activity' },
              { icon: Settings, label: 'Settings' },
            ].map(({ icon: Icon, label, active }) => (
              <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: 'smtp',
    icon: Mail,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    title: 'Setting Up SMTP',
    subtitle: 'Connect your email accounts',
    steps: [
      {
        number: 1,
        title: 'Go to SMTP Accounts',
        description: 'Navigate to "SMTP Accounts" in the sidebar. This is where you add email accounts that will be used for sending your campaigns.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SMTP Accounts</p>
            <div className="p-4 bg-card rounded-xl border border-dashed border-border text-center">
              <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No SMTP accounts yet</p>
              <button className="mt-3 px-4 py-2 bg-primary text-white text-xs rounded-xl font-semibold">+ Add SMTP Account</button>
            </div>
          </div>
        ),
      },
      {
        number: 2,
        title: 'Add Your Email Provider',
        description: 'Click "+ Add SMTP Account" and enter your credentials. ApexReach supports Gmail, Outlook, Yahoo, Zoho, and any custom SMTP. Choose your provider from the quick-setup guide for auto-filled host/port settings.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Setup</p>
            {['Gmail', 'Outlook', 'Yahoo Mail', 'Zoho Mail', 'Custom SMTP'].map((provider, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{provider}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            ))}
          </div>
        ),
      },
      {
        number: 3,
        title: 'Verify Your Connection',
        description: 'After saving, click "Verify" to test the connection. A green "Verified" badge confirms your account is ready to send. Set a daily sending limit to protect your sender reputation.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
              <div>
                <p className="text-sm font-semibold text-foreground">john@company.com</p>
                <p className="text-xs text-muted-foreground">smtp.gmail.com · Port 587</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/15 text-green-500 border border-green-500/30">✓ Verified</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs text-primary font-medium">Daily limit: 500 emails · Sent today: 0</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'contacts',
    icon: Users,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    title: 'Managing Contacts',
    subtitle: 'Build and organize your contact lists',
    steps: [
      {
        number: 1,
        title: 'Create a Contact List',
        description: 'Go to "Contacts" and click "+ New List". Give it a name like "Tech Startups Q1" or "E-commerce Leads". Lists help you organize contacts by campaign, industry, or segment.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Lists</p>
            {['Tech Startups Q1', 'E-commerce Leads', 'SaaS Companies'].map((list, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-green-500" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{list}</span>
                </div>
                <span className="text-xs text-muted-foreground">{[142, 89, 210][i]} contacts</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        number: 2,
        title: 'Import Contacts via CSV',
        description: 'Click "Import CSV" to bulk-upload contacts. Your CSV should have columns: email (required), name, company, phone, website. ApexReach auto-maps the fields and skips duplicates.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">Drop your CSV here</p>
              <p className="text-xs text-muted-foreground">Columns: email, name, company, phone, website</p>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 gap-0 text-xs font-semibold text-muted-foreground bg-secondary px-3 py-2">
                <span>email</span><span>name</span><span>company</span>
              </div>
              {[['john@co.com', 'John D.', 'Acme Inc'], ['sarah@biz.io', 'Sarah K.', 'TechCorp']].map((row, i) => (
                <div key={i} className="grid grid-cols-3 gap-0 text-xs text-foreground px-3 py-2 border-t border-border">
                  {row.map((cell, j) => <span key={j} className="truncate">{cell}</span>)}
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        number: 3,
        title: 'Add Contacts Manually',
        description: 'Click "+ Add Contact" to add individual contacts. Fill in their email, name, company, and other details. You can also track lead scores as contacts engage with your campaigns.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-2.5">
            {[
              { label: 'Email *', placeholder: 'john@company.com' },
              { label: 'Full Name', placeholder: 'John Doe' },
              { label: 'Company', placeholder: 'Acme Inc.' },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <p className="text-xs font-medium text-foreground mb-1">{label}</p>
                <div className="px-3 py-2 bg-card border border-border rounded-lg text-xs text-muted-foreground">{placeholder}</div>
              </div>
            ))}
            <button className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl mt-1">Save Contact</button>
          </div>
        ),
      },
    ],
  },
  {
    id: 'campaigns',
    icon: Send,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'Creating Campaigns',
    subtitle: 'Launch personalized email campaigns',
    steps: [
      {
        number: 1,
        title: 'Create a New Campaign',
        description: 'Go to "Campaigns" and click "+ New Campaign". You\'ll enter a 4-step wizard: Campaign Details → Email Content → Delivery Settings → Review & Launch.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              {['Details', 'Content', 'Delivery', 'Launch'].map((step, i) => (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center ${i === 0 ? '' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground'}`}>{i + 1}</div>
                    <span className={`text-[10px] mt-1 font-medium ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
                  </div>
                  {i < 3 && <div className="flex-1 h-px bg-border mb-3" />}
                </React.Fragment>
              ))}
            </div>
            <div className="space-y-2">
              <div><p className="text-xs font-medium text-foreground mb-1">Campaign Name</p><div className="px-3 py-2 bg-card border border-border rounded-lg text-xs text-muted-foreground">Q2 Outreach — SaaS</div></div>
              <div><p className="text-xs font-medium text-foreground mb-1">Contact List</p><div className="px-3 py-2 bg-card border border-border rounded-lg text-xs text-muted-foreground">Tech Startups Q1 · 142 contacts</div></div>
            </div>
          </div>
        ),
      },
      {
        number: 2,
        title: 'Write Your Email Content',
        description: 'Use the rich text editor to write your email. Use personalization variables like {{first_name}}, {{company}}, {{email}} to auto-customize each email. You can also use the AI assistant to generate content.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <div><p className="text-xs font-medium text-foreground mb-1">Subject Line</p><div className="px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground">Quick question about {'{{company}}'}</div></div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Email Body</p>
              <div className="px-3 py-3 bg-card border border-border rounded-lg text-xs text-foreground space-y-1.5 leading-relaxed">
                <p>Hi {'{{first_name}}'},</p>
                <p>I noticed {'{{company}}'} is growing fast...</p>
                <p className="text-primary font-medium">{'{{first_name}}'} → personalized per contact</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded-lg font-medium">{'{{first_name}}'}</span>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded-lg font-medium">{'{{company}}'}</span>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded-lg font-medium">{'{{email}}'}</span>
            </div>
          </div>
        ),
      },
      {
        number: 3,
        title: 'Configure Delivery Settings',
        description: 'Select which SMTP accounts to use for sending (round-robin rotation for scale). Set a delay between emails (5–60 seconds recommended) to avoid spam filters. Optionally schedule for a future date/time.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <div>
              <p className="text-xs font-medium text-foreground mb-2">SMTP Accounts (round-robin)</p>
              {['john@company.com', 'sarah@company.com'].map((email, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded bg-primary flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>
                  <span className="text-xs text-foreground">{email}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Delay between emails</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-border rounded-full"><div className="w-1/3 h-full bg-primary rounded-full" /></div>
                <span className="text-xs font-bold text-primary">10s</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        number: 4,
        title: 'Launch & Monitor',
        description: 'Review your campaign summary and click "Launch Campaign". Watch real-time progress in the Campaigns list — sent count, open rate, click rate, and reply rate update live.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[['Sent', '87', 'text-foreground'], ['Open Rate', '42.5%', 'text-green-500'], ['Clicks', '18', 'text-primary'], ['Replies', '6', 'text-blue-500']].map(([label, val, color]) => (
                <div key={label} className="bg-card rounded-xl border border-border p-3 text-center">
                  <p className={`text-base font-bold ${color}`}>{val}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="p-2.5 bg-card rounded-xl border border-border">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5"><span>Progress</span><span>87/142</span></div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: '61%' }} /></div>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    title: 'Analytics & Lead Scoring',
    subtitle: 'Track engagement and find hot leads',
    steps: [
      {
        number: 1,
        title: 'View Campaign Analytics',
        description: 'Click the chart icon on any campaign to open its Analytics page. You\'ll see open/click/reply timelines, device breakdown, subject line A/B test results, and individual contact engagement logs.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Campaign Analytics</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Opens', '42.5%', 'text-blue-500'], ['Clicks', '12.3%', 'text-primary'], ['Replies', '6.9%', 'text-green-500']].map(([l, v, c]) => (
                <div key={l} className="bg-card rounded-xl border border-border p-2.5 text-center">
                  <p className={`text-sm font-bold ${c}`}>{v}</p>
                  <p className="text-[10px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-xl border border-border p-3 space-y-2">
              {[['john@co.com', 'Opened', 'text-blue-500'], ['sarah@biz.io', 'Clicked', 'text-primary'], ['mike@tech.com', 'Replied', 'text-green-500']].map(([email, status, color]) => (
                <div key={email} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate">{email}</span>
                  <span className={`font-semibold ${color}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        number: 2,
        title: 'Lead Scoring System',
        description: 'ApexReach automatically scores contacts based on engagement. Opens = +5 pts, Clicks = +10 pts, Replies = +20 pts. Leads are categorized as Cold (0-4), Engaged (5-19), Warm (20-49), or Hot (50+).',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead Score Breakdown</p>
            {[
              { label: 'Hot', score: '50+', color: 'text-orange-500', bg: 'bg-orange-500/15 border-orange-500/30', emoji: '🔥' },
              { label: 'Warm', score: '20–49', color: 'text-yellow-500', bg: 'bg-yellow-500/15 border-yellow-500/30', emoji: '📈' },
              { label: 'Engaged', score: '5–19', color: 'text-blue-500', bg: 'bg-blue-500/15 border-blue-500/30', emoji: '–' },
              { label: 'Cold', score: '0–4', color: 'text-muted-foreground', bg: 'bg-muted border-border', emoji: '❄️' },
            ].map(({ label, score, color, bg, emoji }) => (
              <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${bg}`}>
                <span className={`text-xs font-bold ${color}`}>{emoji} {label}</span>
                <span className="text-xs text-muted-foreground">{score} pts</span>
              </div>
            ))}
            <div className="pt-2 space-y-1 text-[11px] text-muted-foreground">
              <div className="flex justify-between"><span>📧 Open email</span><span className="font-semibold text-foreground">+5 pts</span></div>
              <div className="flex justify-between"><span>🖱️ Click link</span><span className="font-semibold text-foreground">+10 pts</span></div>
              <div className="flex justify-between"><span>💬 Reply</span><span className="font-semibold text-foreground">+20 pts</span></div>
            </div>
          </div>
        ),
      },
      {
        number: 3,
        title: 'Hot Leads Widget',
        description: 'Your Dashboard shows a "Hot Leads" widget listing contacts with scores ≥ 50. These are your most engaged prospects — prioritize outreach to them for best conversion rates.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-orange-500" /> Hot Leads</p>
            {[['Sarah K.', 'TechCorp', 85], ['John D.', 'Acme Inc', 70], ['Mike R.', 'StartupXYZ', 55]].map(([name, company, score]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{company}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-500 border border-orange-500/30">🔥 {score} pts</span>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: 'drip',
    icon: GitBranch,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    title: 'Drip Sequences',
    subtitle: 'Automate multi-step follow-ups',
    steps: [
      {
        number: 1,
        title: 'What are Drip Sequences?',
        description: 'Drip sequences are automated multi-step email campaigns. You define a series of emails with time delays between them — for example: Day 1 initial email → Day 3 follow-up → Day 7 final touch.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-2">
            {[['Step 1', 'Initial outreach', 'Sent immediately'], ['Step 2', 'Follow-up #1', 'After 3 days'], ['Step 3', 'Final touch', 'After 7 days']].map(([step, title, delay], i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold text-cyan-500">{i + 1}</div>
                  {i < 2 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="bg-card rounded-xl border border-border p-3 flex-1 mb-1">
                  <p className="text-xs font-semibold text-foreground">{title}</p>
                  <p className="text-[10px] text-muted-foreground">{delay}</p>
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  {
    id: 'warmup',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    title: 'Email Warmup',
    subtitle: 'Protect your sender reputation',
    steps: [
      {
        number: 1,
        title: 'Why Warm Up?',
        description: 'New email accounts have low sender reputation. Sending too many emails too fast gets you flagged as spam. Email warmup gradually increases your sending volume over days/weeks to build trust with email providers.',
        illustration: (
          <div className="rounded-2xl bg-secondary border border-border p-5 space-y-3">
            <div className="space-y-2">
              {[['Week 1', 20, 'bg-orange-500'], ['Week 2', 45, 'bg-orange-500'], ['Week 3', 70, 'bg-orange-500'], ['Week 4', 100, 'bg-green-500']].map(([week, pct, color]) => (
                <div key={week} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12">{week}</span>
                  <div className="flex-1 h-2 bg-border rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} /></div>
                  <span className="text-xs font-semibold text-foreground w-8 text-right">{pct}%</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-green-500/10 rounded-xl border border-green-500/20">
              <Shield className="w-4 h-4 text-green-500" />
              <p className="text-xs text-green-500 font-medium">Reputation fully established</p>
            </div>
          </div>
        ),
      },
    ],
  },
];

export default function Guide() {
  const [expandedSection, setExpandedSection] = useState('overview');
  const [activeStep, setActiveStep] = useState(0);

  const currentSection = sections.find(s => s.id === expandedSection);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-primary" /> User Guide
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Step-by-step walkthrough of every feature in ApexReach</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sections List */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = expandedSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => { setExpandedSection(section.id); setActiveStep(0); }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-card border-primary/40 shadow-sm'
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-foreground'}`}>{section.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{section.subtitle}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{section.steps.length}</span>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Steps Viewer */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {currentSection && (
              <motion.div
                key={expandedSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${currentSection.bg} flex items-center justify-center`}>
                    <currentSection.icon className={`w-5 h-5 ${currentSection.color}`} />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-bold text-foreground">{currentSection.title}</h2>
                    <p className="text-xs text-muted-foreground">{currentSection.subtitle}</p>
                  </div>
                </div>

                {/* Step Tabs */}
                {currentSection.steps.length > 1 && (
                  <div className="flex gap-1 px-6 pt-4 overflow-x-auto no-scrollbar">
                    {currentSection.steps.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          activeStep === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${activeStep === i ? 'bg-white/20' : 'bg-secondary'}`}>{i + 1}</span>
                        {step.title}
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="p-6"
                  >
                    {(() => {
                      const step = currentSection.steps[activeStep];
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">{step.number}</div>
                              <h3 className="font-heading text-base font-bold text-foreground">{step.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                            {/* Navigation Arrows */}
                            {currentSection.steps.length > 1 && (
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                  disabled={activeStep === 0}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  ← Previous
                                </button>
                                <button
                                  onClick={() => setActiveStep(Math.min(currentSection.steps.length - 1, activeStep + 1))}
                                  disabled={activeStep === currentSection.steps.length - 1}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:pointer-events-none"
                                >
                                  Next →
                                </button>
                              </div>
                            )}
                          </div>
                          <div>{step.illustration}</div>
                        </div>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>

                {/* Step Dots */}
                {currentSection.steps.length > 1 && (
                  <div className="flex justify-center gap-1.5 pb-5">
                    {currentSection.steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveStep(i)}
                        className={`rounded-full transition-all ${activeStep === i ? 'w-5 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-border hover:bg-muted-foreground'}`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}