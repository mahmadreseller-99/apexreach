import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    sub: 'Forever',
    description: 'Perfect for solo founders and small teams getting started with cold outreach.',
    features: [
      '500 emails / month',
      '1 SMTP account',
      '1 active campaign',
      'Basic analytics',
      'CSV import',
      'Email templates',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    sub: 'per month',
    description: 'For teams serious about cold outreach and inbox placement at scale.',
    features: [
      'Unlimited emails',
      'Unlimited SMTP accounts',
      'Unlimited campaigns',
      'A/B subject testing',
      'SMTP rotation',
      'Email warmup',
      'Drip sequences',
      'Advanced analytics',
      'AI content generation',
      'Spam score analyzer',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Agency',
    price: '$79',
    sub: 'per month',
    description: 'For agencies managing outreach across multiple clients and domains.',
    features: [
      'Everything in Pro',
      'Multi-client workspaces',
      'White-label options',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            Pricing
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            No per-email costs. No hidden fees. Pay for the platform, not the volume.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
                plan.highlighted
                  ? 'border-primary shadow-xl shadow-primary/10 scale-105'
                  : 'border-border'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-extrabold text-foreground font-heading">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.sub}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => window.location.href = '/login'}
                className={`w-full flex items-center justify-center gap-2 font-semibold rounded-xl px-5 py-3 text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25'
                    : 'border border-border hover:border-primary/30 text-foreground hover:bg-secondary'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}