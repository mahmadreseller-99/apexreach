import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Flame, ExternalLink, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import LeadQualityBadge from '@/components/shared/LeadQualityBadge';
import { motion } from 'framer-motion';

export default function HotLeads() {
  const { user: currentUser } = useAuth();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['hot-leads', currentUser?.email],
    queryFn: async () => {
      // Hot leads query: contacts with high engagement
      const all = await api.contacts.list();
      return all.filter(c => (c.lead_score || 0) >= 20).sort((a,b) => (b.lead_score || 0) - (a.lead_score || 0));
    },
    enabled: !!currentUser,
    refetchInterval: 30000,
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="font-heading text-sm font-semibold text-foreground">Hot Leads</h3>
          {contacts.length > 0 && (
            <span className="text-xs bg-orange-500/15 text-orange-500 font-bold px-2 py-0.5 rounded-full">
              {contacts.length}
            </span>
          )}
        </div>
        <Link to="/contacts" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
          View All <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-secondary/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Flame className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No hot leads yet.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Contacts score 50+ points from opens, clicks & replies.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.slice(0, 8).map((contact, idx) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-orange-500">
                    {(contact.name || contact.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {contact.name || contact.email}
                  </p>
                  {contact.name && (
                    <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                  )}
                  {contact.company && (
                    <p className="text-xs text-muted-foreground/70 truncate">{contact.company}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <LeadQualityBadge score={contact.lead_score || 0} showScore />
              </div>
            </motion.div>
          ))}
          {contacts.length > 8 && (
            <Link to="/contacts" className="block text-center text-xs text-primary hover:underline pt-1">
              +{contacts.length - 8} more hot leads →
            </Link>
          )}
        </div>
      )}

      {/* Scoring legend */}
      <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 flex-wrap">
        <p className="text-xs text-muted-foreground font-medium">Score: </p>
        <span className="text-xs text-muted-foreground">📧 Open <span className="text-foreground font-semibold">+5</span></span>
        <span className="text-xs text-muted-foreground">🔗 Click <span className="text-foreground font-semibold">+10</span></span>
        <span className="text-xs text-muted-foreground">↩️ Reply <span className="text-foreground font-semibold">+20</span></span>
      </div>
    </div>
  );
}