import React from 'react';
import { Flame, TrendingUp, Minus, Snowflake } from 'lucide-react';

export function getLeadQuality(score) {
  if (score >= 50) return { label: 'Hot', color: 'text-orange-500', bg: 'bg-orange-500/15 border-orange-500/30', icon: Flame };
  if (score >= 20) return { label: 'Warm', color: 'text-yellow-500', bg: 'bg-yellow-500/15 border-yellow-500/30', icon: TrendingUp };
  if (score >= 5) return { label: 'Engaged', color: 'text-blue-500', bg: 'bg-blue-500/15 border-blue-500/30', icon: Minus };
  return { label: 'Cold', color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: Snowflake };
}

export default function LeadQualityBadge({ score = 0, showScore = false }) {
  const quality = getLeadQuality(score);
  const QualityIcon = quality.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${quality.bg} ${quality.color}`}>
      <QualityIcon className="w-3 h-3" />
      {quality.label}
      {showScore && <span className="opacity-70 ml-0.5">· {score}pts</span>}
    </span>
  );
}