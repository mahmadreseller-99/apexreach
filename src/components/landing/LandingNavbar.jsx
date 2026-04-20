import React, { useState, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogin = () => window.location.href = '/login';

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-xl shadow-sm border-b border-border' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">ApexReach</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleLogin}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium px-3 py-2"
          >
            Sign In
          </button>
          <button
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-5 py-2.5 text-sm transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Get Started Free →
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-card/98 backdrop-blur-xl border-t border-border px-4 py-4 space-y-1">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground font-medium px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <button
              onClick={handleLogin}
              className="block w-full text-left text-sm text-muted-foreground font-medium px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleLogin}
              className="block w-full text-center bg-primary text-primary-foreground font-bold rounded-xl px-5 py-3 text-sm shadow-lg shadow-primary/25"
            >
              Get Started Free →
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}