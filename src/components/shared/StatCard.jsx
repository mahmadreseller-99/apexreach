import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, change, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'text-primary bg-primary/10',
    green: 'text-brand-green bg-brand-green/10',
    blue: 'text-brand-blue bg-brand-blue/10',
    yellow: 'text-brand-yellow bg-brand-yellow/10',
    red: 'text-brand-red bg-brand-red/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
              {change >= 0 ? '+' : ''}{change}% vs last week
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}