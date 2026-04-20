import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Zap, Shield, TrendingUp } from 'lucide-react';

const badges = [
  { icon: Shield, text: '99.9% Delivery Rate' },
  { icon: Zap, text: 'Real SMTP Sending' },
  { icon: TrendingUp, text: 'Inbox Placement' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.04)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Announcement bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 mb-8 text-sm"
        >
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-primary font-medium">Send directly via your own SMTP — 100% inbox delivery</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-heading text-4xl sm:text-5xl lg:text-7xl font-extrabold text-foreground leading-[1.05] mb-6 tracking-tight"
        >
          Send Cold Emails That{' '}
          <span className="text-primary relative">
            Actually Land
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 10 C80 2, 220 2, 298 10" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
            </svg>
          </span>
          {' '}in the Inbox
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          ApexReach connects your own SMTP accounts — Gmail, Outlook, Zoho — and sends personalized outreach at scale with smart throttling, A/B testing, and real-time tracking.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <button
            onClick={() => window.location.href = '/login'}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl px-8 py-4 text-base transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            Start Sending Free
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border hover:border-primary/40 bg-card hover:bg-secondary text-foreground font-semibold rounded-2xl px-8 py-4 text-base transition-all duration-300"
          >
            Login to Dashboard
            <ArrowRight className="w-4 h-4 opacity-60" />
          </button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-16"
        >
          {badges.map((badge, i) => {
            const BadgeIcon = badge.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <BadgeIcon className="w-4 h-4 text-primary" />
                <span>{badge.text}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span>No credit card required</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {[
            { value: '2M+', label: 'Emails Delivered' },
            { value: '99%', label: 'Inbox Rate' },
            { value: '3,000+', label: 'Active Users' },
            { value: '58%', label: 'Avg Open Rate' },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center hover:border-primary/30 transition-colors">
              <p className="text-2xl sm:text-3xl font-heading font-extrabold text-primary">{stat.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Dashboard preview hint */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mt-16 relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-b from-transparent to-background z-10 rounded-3xl pointer-events-none" />
          <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 bg-secondary rounded-lg h-6 max-w-xs mx-auto flex items-center justify-center">
                <span className="text-xs text-muted-foreground">app.apexreach.io/dashboard</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Campaigns', val: '24', color: 'text-primary' },
                { label: 'Sent Today', val: '1,847', color: 'text-brand-green' },
                { label: 'Open Rate', val: '61%', color: 'text-brand-blue' },
                { label: 'Replies', val: '38', color: 'text-brand-yellow' },
              ].map((s, i) => (
                <div key={i} className="bg-secondary rounded-xl p-3 text-center">
                  <p className={`text-lg font-bold font-heading ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {['Q2 Outreach — 2,400 sent — 63% open', 'Product Launch — 850 sent — 58% open', 'Follow-up Seq. — 340 sent — 71% open'].map((row, i) => (
                <div key={i} className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-xs text-foreground font-medium">{row}</span>
                  <div className="ml-auto">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Sent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}