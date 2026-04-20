import React from 'react';
import { Zap, Mail, Twitter, Github } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-card py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold text-foreground">ApexReach</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              The professional cold email platform that sends through your own SMTP accounts for maximum inbox delivery.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Twitter className="w-4 h-4 text-muted-foreground" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/10 transition-colors">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground mb-4">Product</h4>
            <ul className="space-y-2.5">
              {['Features', 'How it Works', 'Pricing', 'Changelog'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {['Documentation', 'Blog', 'SMTP Setup Guide', 'Cold Email Tips'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-heading text-sm font-bold text-foreground mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About', 'Privacy Policy', 'Terms of Service', 'Contact'].map(item => (
                <li key={item}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 ApexReach. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-4 py-2 text-sm transition-all"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}