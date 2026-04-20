import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Marcus Johnson',
    role: 'Founder, LeadForge',
    avatar: 'MJ',
    rating: 5,
    text: 'ApexReach is the first tool where my cold emails actually land in the inbox. Went from 8% open rate to 63% in two weeks. The SMTP rotation is a game changer.',
  },
  {
    name: 'Sarah Chen',
    role: 'SDR Lead, CloudScale',
    avatar: 'SC',
    rating: 5,
    text: 'The AI content generator writes better cold emails than most of my team. Saves hours every week and the replies have tripled since we switched.',
  },
  {
    name: 'Ahmed Al-Rashid',
    role: 'Agency Owner, OutboundX',
    avatar: 'AA',
    rating: 5,
    text: "I manage 12 clients through ApexReach. The multi-list management, SMTP rotation, and drip sequences let me run campaigns I'd normally need 3 tools for.",
  },
  {
    name: 'Elena Vasquez',
    role: 'Growth @ TechStart',
    avatar: 'EV',
    rating: 5,
    text: 'Set up in 10 minutes. First campaign sent 400 emails, 58% open rate, 12 booked calls. This is the real deal for cold outreach.',
  },
  {
    name: 'David Park',
    role: 'B2B Sales, Nexus',
    avatar: 'DP',
    rating: 5,
    text: 'The warmup feature alone is worth it. Built my sender reputation over 2 weeks and now hit 70%+ inbox rate. No other tool does this so simply.',
  },
  {
    name: 'Priya Sharma',
    role: 'Co-founder, Orbis',
    avatar: 'PS',
    rating: 5,
    text: 'Spam score analyzer caught issues I never would have noticed. Auto-fix button cleaned up our template in one click. Deliverability jumped immediately.',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 sm:py-32 px-4 sm:px-6 bg-secondary/20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
            Testimonials
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Teams Getting Real Results
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Real users, real inboxes, real replies.
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="break-inside-avoid bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{t.avatar}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}