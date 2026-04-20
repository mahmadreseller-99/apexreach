import React from 'react';
import { motion } from 'framer-motion';
import { Mail, BarChart3, Zap, Brain, GitBranch, Users, Shield, RefreshCw, Clock, Target, Inbox, Layers } from 'lucide-react';

const features = [
  {
    icon: Mail,
    title: 'Real SMTP Sending',
    description: 'Connect Gmail, Outlook, Zoho or any SMTP server. Emails send from your own accounts — no shared IP, maximum trust.',
    highlight: true,
  },
  {
    icon: Inbox,
    title: '100% Inbox Delivery',
    description: 'Smart throttling, delay randomization, and SMTP rotation ensure your emails bypass spam filters every time.',
    highlight: true,
  },
  {
    icon: RefreshCw,
    title: 'SMTP Rotation',
    description: 'Auto-rotate across multiple SMTP accounts per campaign to distribute load and maximize daily send limits.',
    highlight: false,
  },
  {
    icon: Brain,
    title: 'AI Content Generator',
    description: 'Describe your goal, get a high-converting email in seconds. AI writes personalized cold outreach that converts.',
    highlight: false,
  },
  {
    icon: Target,
    title: 'A/B Subject Testing',
    description: 'Test up to 4 subject line variants. Automatically pick the winner by open rate or click rate.',
    highlight: false,
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track opens, clicks, and replies per contact with device, country, and timestamp data.',
    highlight: false,
  },
  {
    icon: GitBranch,
    title: 'Drip Sequences',
    description: 'Build automated multi-step follow-up campaigns with custom delays between each email.',
    highlight: false,
  },
  {
    icon: Users,
    title: 'Contact Management',
    description: 'Import via CSV, organize into lists, search and filter. Bulk operations in seconds.',
    highlight: false,
  },
  {
    icon: Zap,
    title: 'Email Warmup',
    description: 'Gradually warm up new SMTP accounts to build sender reputation before sending bulk campaigns.',
    highlight: false,
  },
  {
    icon: Shield,
    title: 'Spam Score Analyzer',
    description: 'Scan your email before sending. Detects spam trigger words and gives a 0–100 deliverability score.',
    highlight: false,
  },
  {
    icon: Clock,
    title: 'Campaign Scheduling',
    description: 'Schedule campaigns for any timezone, any date. Set it and forget it.',
    highlight: false,
  },
  {
    icon: Layers,
    title: 'Template Library',
    description: 'Save and reuse your best-performing emails. Built-in library of proven cold outreach templates.',
    highlight: false,
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            Everything You Need
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            Built for Inbox Placement
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
            Every feature designed to maximize deliverability and replies — not just sends.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-card border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 group ${
                feature.highlight ? 'border-primary/30 bg-primary/5' : 'border-border'
              }`}
            >
              {feature.highlight && (
                <div className="absolute top-3 right-3 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Core Feature
                </div>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                feature.highlight ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-primary/10 group-hover:bg-primary/20'
              }`}>
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}