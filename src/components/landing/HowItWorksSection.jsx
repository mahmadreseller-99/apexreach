import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Settings, TrendingUp } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Connect Your SMTP',
    description: 'Add Gmail, Outlook, or any custom SMTP. Your emails come from YOUR address — not a shared pool.',
  },
  {
    icon: Mail,
    step: '02',
    title: 'Upload Your Contacts',
    description: 'Import a CSV, add manually, or integrate your CRM. Segment into lists with tags and custom fields.',
  },
  {
    icon: Settings,
    step: '03',
    title: 'Create Your Campaign',
    description: 'Write your email (or use AI), set delays, pick SMTP accounts, add A/B test variants, schedule your send.',
  },
  {
    icon: TrendingUp,
    step: '04',
    title: 'Track & Optimize',
    description: 'Watch opens, clicks, and replies in real-time. Pause, resume, or adjust on the fly.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32 px-4 sm:px-6 bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            How It Works
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            From Zero to Inbox in Minutes
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            No complex setup. No shared sending pools. Just your own accounts sending like a human.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
              )}
              <div className="relative inline-flex w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mb-4">
                <step.icon className="w-6 h-6 text-primary" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-heading text-base font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}