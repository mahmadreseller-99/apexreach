import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GUIDES = [
  {
    id: 'gmail',
    title: 'Gmail — App Password Setup',
    icon: '📧',
    color: 'text-brand-red',
    steps: [
      { title: 'Enable 2-Step Verification', desc: 'Go to your Google Account → Security → 2-Step Verification and turn it on. This is required to create App Passwords.' },
      { title: 'Generate App Password', desc: 'Go to Google Account → Security → 2-Step Verification → App passwords (at the bottom). Select "Mail" and "Other device", then click Generate.' },
      { title: 'Copy the 16-character password', desc: 'Google shows a 16-character password. Copy it — you won\'t see it again. Use this as your SMTP password (not your Gmail password).' },
      { title: 'SMTP Settings to use', desc: 'Host: smtp.gmail.com | Port: 587 | SSL: TLS/STARTTLS | Username: your full Gmail address | Password: 16-char app password' },
      { title: 'IMAP Settings', desc: 'Host: imap.gmail.com | Port: 993 | SSL: SSL/TLS | Username: your full Gmail address | Password: same app password' },
    ],
    notes: 'Gmail free accounts allow ~500 emails/day. Google Workspace accounts allow more.',
    link: 'https://myaccount.google.com/security',
    linkLabel: 'Open Google Security Settings',
  },
  {
    id: 'outlook',
    title: 'Outlook / Hotmail / Microsoft 365',
    icon: '💼',
    color: 'text-brand-blue',
    steps: [
      { title: 'Enable SMTP Auth for your account', desc: 'Log into Microsoft 365 Admin Center → Users → Active users → Select user → Mail tab → Manage email apps → Enable Authenticated SMTP.' },
      { title: 'Personal accounts: Enable SMTP', desc: 'For Outlook.com personal accounts go to Settings → Mail → Sync email → enable "Let devices and apps use POP" or use OAuth.' },
      { title: 'SMTP Settings', desc: 'Host: smtp.office365.com | Port: 587 | SSL: STARTTLS | Username: your full email | Password: your account password' },
      { title: 'IMAP Settings', desc: 'Host: outlook.office365.com | Port: 993 | SSL: SSL/TLS | Username: your full email' },
    ],
    notes: 'Microsoft 365 limits SMTP AUTH to 30 messages/minute per mailbox.',
    link: 'https://admin.microsoft.com',
    linkLabel: 'Open M365 Admin Center',
  },
  {
    id: 'yahoo',
    title: 'Yahoo Mail — App Password',
    icon: '🟣',
    color: 'text-purple-400',
    steps: [
      { title: 'Enable 2-Step Verification', desc: 'Go to Yahoo Account Security page → 2-Step Verification and enable it.' },
      { title: 'Generate App Password', desc: 'Go to Account Security → Generate app password. Name it (e.g. "ApexReach") and copy the generated password.' },
      { title: 'SMTP Settings', desc: 'Host: smtp.mail.yahoo.com | Port: 587 | SSL: TLS | Username: your Yahoo email | Password: generated app password' },
      { title: 'IMAP Settings', desc: 'Host: imap.mail.yahoo.com | Port: 993 | SSL: SSL/TLS' },
    ],
    notes: 'Yahoo limits outgoing mail. Not recommended for bulk outreach.',
    link: 'https://login.yahoo.com/account/security',
    linkLabel: 'Open Yahoo Security',
  },
  {
    id: 'sendgrid',
    title: 'SendGrid SMTP Relay',
    icon: '⚡',
    color: 'text-brand-green',
    steps: [
      { title: 'Create an API Key', desc: 'Log into SendGrid → Settings → API Keys → Create API Key with "Mail Send" permissions.' },
      { title: 'SMTP Settings', desc: 'Host: smtp.sendgrid.net | Port: 587 | SSL: TLS | Username: apikey (literally the word "apikey") | Password: your API key starting with SG.' },
      { title: 'Verify Sender Identity', desc: 'Before sending, go to Settings → Sender Authentication and verify either your domain (recommended) or a single sender email.' },
      { title: 'Domain Authentication (SPF/DKIM)', desc: 'Go to Settings → Sender Authentication → Authenticate Your Domain. Add the CNAME records to your DNS.' },
    ],
    notes: 'Free plan: 100 emails/day. Paid plans start at $19.95/mo for higher limits.',
    link: 'https://app.sendgrid.com/settings/api_keys',
    linkLabel: 'Open SendGrid API Keys',
  },
  {
    id: 'mailgun',
    title: 'Mailgun SMTP',
    icon: '🔫',
    color: 'text-brand-yellow',
    steps: [
      { title: 'Add and Verify Your Domain', desc: 'In Mailgun dashboard → Sending → Domains → Add New Domain. Use a subdomain like mail.yourdomain.com.' },
      { title: 'Add DNS Records', desc: 'Mailgun shows you SPF, DKIM, and CNAME records. Add them to your DNS provider (GoDaddy, Cloudflare, etc.).' },
      { title: 'Get SMTP Credentials', desc: 'Go to your domain → SMTP credentials. Create a new SMTP user and password.' },
      { title: 'SMTP Settings', desc: 'Host: smtp.mailgun.org | Port: 587 | SSL: TLS | Username: your SMTP user (e.g. postmaster@mail.yourdomain.com) | Password: SMTP password' },
    ],
    notes: 'Mailgun offers 5,000 free emails/month for 3 months. Best for transactional + bulk.',
    link: 'https://app.mailgun.com/app/sending/domains',
    linkLabel: 'Open Mailgun Domains',
  },
  {
    id: 'amazon_ses',
    title: 'Amazon SES',
    icon: '☁️',
    color: 'text-brand-yellow',
    steps: [
      { title: 'Verify your sending domain', desc: 'In AWS SES Console → Verified Identities → Create Identity → Domain. Add the DKIM records to your DNS.' },
      { title: 'Request Production Access', desc: 'By default SES is in Sandbox (only verified emails). Submit a request in SES → Account Dashboard → Request Production Access.' },
      { title: 'Create SMTP Credentials', desc: 'Go to SES → Account Dashboard → Create SMTP credentials (it creates an IAM user). Save the username and password shown.' },
      { title: 'SMTP Settings', desc: 'Host: email-smtp.[region].amazonaws.com | Port: 587 | SSL: TLS | Use your generated SMTP username and password.' },
    ],
    notes: 'AWS SES costs $0.10 per 1,000 emails. Very cost-effective at scale.',
    link: 'https://console.aws.amazon.com/ses',
    linkLabel: 'Open AWS SES Console',
  },
  {
    id: 'godaddy_domain',
    title: 'Custom Domain (GoDaddy) — DNS Setup',
    icon: '🌐',
    color: 'text-brand-green',
    steps: [
      { title: 'Log into GoDaddy DNS Manager', desc: 'Go to GoDaddy → My Products → Domains → Manage → DNS. You\'ll see a table of your DNS records.' },
      { title: 'Add SPF Record (TXT)', desc: 'Add a TXT record: Name: @ | Value: "v=spf1 include:sendgrid.net ~all" (replace sendgrid.net with your provider\'s SPF). This tells receivers your mail server is authorized.' },
      { title: 'Add DKIM Record (TXT or CNAME)', desc: 'Your SMTP provider gives you a DKIM record (usually a CNAME or TXT). Add it exactly as shown — it looks like: em1234._domainkey.yourdomain.com.' },
      { title: 'Add DMARC Record (TXT)', desc: 'Add TXT record: Name: _dmarc | Value: "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com" — This protects against spoofing.' },
      { title: 'Wait for DNS Propagation', desc: 'DNS changes take 15 minutes to 48 hours to propagate worldwide. Use mxtoolbox.com to verify your records.' },
    ],
    notes: 'Proper SPF + DKIM + DMARC setup dramatically improves deliverability and avoids spam folders.',
    link: 'https://dcc.godaddy.com/control/portfolio',
    linkLabel: 'Open GoDaddy DNS',
  },
  {
    id: 'cloudflare_domain',
    title: 'Custom Domain (Cloudflare) — DNS Setup',
    icon: '🔶',
    color: 'text-brand-yellow',
    steps: [
      { title: 'Open Cloudflare DNS Dashboard', desc: 'Log into Cloudflare → Select your domain → DNS → Records.' },
      { title: 'Add SPF Record', desc: 'Click Add record → Type: TXT | Name: @ | Content: "v=spf1 include:[your-smtp-provider] ~all" | TTL: Auto | Proxy: DNS only (grey cloud).' },
      { title: 'Add DKIM Record', desc: 'Add the CNAME or TXT record provided by your SMTP provider. Make sure Proxy status is "DNS only" for DKIM CNAME records.' },
      { title: 'Add DMARC Record', desc: 'Add TXT record: Name: _dmarc | Content: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"' },
      { title: 'Verify with MXToolbox', desc: 'Go to mxtoolbox.com and check SPF, DKIM, and DMARC for your domain to confirm everything is configured correctly.' },
    ],
    notes: 'Important: Set email-related DNS records to "DNS only" (grey cloud), NOT proxied.',
    link: 'https://dash.cloudflare.com',
    linkLabel: 'Open Cloudflare Dashboard',
  },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function GuideSection({ guide }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{guide.icon}</span>
          <span className={`text-sm font-semibold ${guide.color}`}>{guide.title}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border bg-secondary/20">
          <div className="space-y-3 mt-3">
            {guide.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {guide.notes && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-xs text-muted-foreground">
              💡 {guide.notes}
            </div>
          )}

          <a
            href={guide.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> {guide.linkLabel}
          </a>
        </div>
      )}
    </div>
  );
}

export default function SmtpProviderGuide({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> SMTP Setup Guide
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Step-by-step instructions for every provider and custom domain setup.</p>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {GUIDES.map(guide => (
            <GuideSection key={guide.id} guide={guide} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}