import React, { useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SPAM_KEYWORDS = [
  'free', 'winner', 'won', 'prize', 'cash', 'money', 'earn', 'income', 'profit',
  'guarantee', 'guaranteed', 'no obligation', 'no risk', 'risk-free',
  'act now', 'limited time', 'urgent', 'expires', "don't miss",
  'click here', 'click below', 'buy now', 'order now', 'purchase now',
  'cheap', 'lowest price', 'best price', 'discount', 'save big', 'save up to',
  'congratulations', 'selected', 'you have been chosen',
  'weight loss', 'lose weight', 'amazing', 'incredible', 'miracle',
  'unsecured', 'debt', 'loan', 'mortgage', 'credit', 'investment',
  'million dollars', 'billion', 'inheritance', 'nigerian',
  '100% free', '100% satisfied', 'satisfaction guaranteed',
  'unsubscribe', 'opt out', 'remove me',
  'verify', 'confirm your', 'account suspended',
];

// Replacements for spam keywords
const KEYWORD_REPLACEMENTS = {
  'free': 'complimentary',
  'winner': 'selected recipient',
  'won': 'been chosen',
  'prize': 'reward',
  'cash': 'funds',
  'money': 'budget',
  'earn': 'generate',
  'income': 'revenue',
  'profit': 'returns',
  'guarantee': 'assurance',
  'guaranteed': 'assured',
  'act now': 'take action today',
  'limited time': 'time-sensitive',
  'urgent': 'important',
  'click here': 'learn more',
  'click below': 'see below',
  'buy now': 'get started',
  'order now': 'request access',
  'cheap': 'affordable',
  'lowest price': 'competitive pricing',
  'best price': 'great value',
  'discount': 'special offer',
  'save big': 'reduce costs',
  'amazing': 'impressive',
  'incredible': 'remarkable',
  'miracle': 'breakthrough',
};

const FORMATTING_CHECKS = [
  { id: 'all_caps', label: 'Excessive CAPS in subject', check: (subject) => (subject.match(/[A-Z]/g) || []).length / Math.max(subject.length, 1) > 0.5 && subject.length > 5, severity: 'high' },
  { id: 'exclamation', label: 'Multiple exclamation marks', check: (subject, body) => (subject + body).split('!').length - 1 > 2, severity: 'medium' },
  { id: 'dollar_sign', label: 'Dollar signs in content', check: (subject, body) => (subject + body).includes('$'), severity: 'medium' },
  { id: 'short_body', label: 'Email body is too short', check: (subject, body) => body.replace(/<[^>]*>/g, '').trim().length < 50 && body.length > 0, severity: 'low' },
  { id: 'no_body', label: 'No email body content', check: (subject, body) => !body || body.replace(/<[^>]*>/g, '').trim().length === 0, severity: 'high' },
  { id: 'no_subject', label: 'Missing subject line', check: (subject) => !subject || subject.trim().length === 0, severity: 'high' },
  { id: 'too_many_links', label: 'Too many links (>5)', check: (subject, body) => (body.match(/href=/gi) || []).length > 5, severity: 'medium' },
  { id: 'question_marks', label: 'Multiple question marks', check: (subject, body) => (subject + body).split('?').length - 1 > 3, severity: 'low' },
  { id: 'no_text_ratio', label: 'Too many HTML tags vs text', check: (subject, body) => body.length > 0 && body.replace(/<[^>]*>/g, '').trim().length < body.length * 0.15, severity: 'medium' },
];

function analyzeSpam(subject, body) {
  const combined = (subject + ' ' + body.replace(/<[^>]*>/g, '')).toLowerCase();
  const foundKeywords = SPAM_KEYWORDS.filter(kw => combined.includes(kw.toLowerCase()));

  const formattingIssues = FORMATTING_CHECKS
    .filter(check => check.check(subject, body))
    .map(check => ({ id: check.id, label: check.label, severity: check.severity }));

  let score = 100;
  foundKeywords.forEach(kw => { score -= kw.length > 8 ? 8 : 5; });
  formattingIssues.forEach(issue => {
    if (issue.severity === 'high') score -= 15;
    else if (issue.severity === 'medium') score -= 8;
    else score -= 4;
  });
  score = Math.max(0, Math.min(100, score));

  return { score, foundKeywords, formattingIssues };
}

export default function SpamScoreAnalyzer({ subject, body, onApplyFix }) {
  const [expanded, setExpanded] = useState(false);
  const { score, foundKeywords, formattingIssues } = useMemo(() => analyzeSpam(subject, body), [subject, body]);

  const hasContent = subject || body;
  if (!hasContent) return null;

  const getLevel = () => {
    if (score >= 80) return { label: 'Low Risk', color: 'text-brand-green', bg: 'bg-brand-green/10 border-brand-green/30', Icon: ShieldCheck, bar: 'bg-brand-green' };
    if (score >= 55) return { label: 'Medium Risk', color: 'text-brand-yellow', bg: 'bg-brand-yellow/10 border-brand-yellow/30', Icon: ShieldAlert, bar: 'bg-brand-yellow' };
    return { label: 'High Risk', color: 'text-brand-red', bg: 'bg-brand-red/10 border-brand-red/30', Icon: ShieldX, bar: 'bg-brand-red' };
  };

  const level = getLevel();
  const Icon = level.Icon;
  const totalIssues = foundKeywords.length + formattingIssues.length;

  const handleApplyFix = () => {
    if (!onApplyFix || !foundKeywords.length) return;
    let fixedBody = body;
    let fixedSubject = subject;
    foundKeywords.forEach(kw => {
      const replacement = KEYWORD_REPLACEMENTS[kw] || kw;
      const regex = new RegExp(kw, 'gi');
      fixedBody = fixedBody.replace(regex, replacement);
      fixedSubject = fixedSubject.replace(regex, replacement);
    });
    // Fix exclamation marks
    fixedBody = fixedBody.replace(/!{2,}/g, '.');
    fixedSubject = fixedSubject.replace(/!{2,}/g, '.');
    onApplyFix({ body: fixedBody, subject: fixedSubject });
  };

  const canFix = foundKeywords.length > 0 || formattingIssues.some(f => f.id === 'exclamation');

  return (
    <div className={`rounded-xl border p-4 ${level.bg}`}>
      <button className="w-full flex items-center justify-between" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${level.color}`} />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Spam Score Analyzer</p>
            <p className={`text-xs ${level.color} font-medium`}>{level.label} — {score}/100 {totalIssues > 0 ? `· ${totalIssues} issue${totalIssues > 1 ? 's' : ''} found` : '· Looks clean!'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden hidden sm:block">
            <div className={`h-full rounded-full transition-all ${level.bar}`} style={{ width: `${score}%` }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
          {/* Progress bar mobile */}
          <div className="sm:hidden">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Score</span>
              <span className={`font-semibold ${level.color}`}>{score}/100</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all ${level.bar}`} style={{ width: `${score}%` }} />
            </div>
          </div>

          {formattingIssues.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Formatting Issues</p>
              <div className="space-y-1.5">
                {formattingIssues.map(issue => (
                  <div key={issue.id} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${issue.severity === 'high' ? 'bg-brand-red' : issue.severity === 'medium' ? 'bg-brand-yellow' : 'bg-brand-blue'}`} />
                    <span className="text-xs text-foreground">{issue.label}</span>
                    <span className={`text-xs ml-auto font-medium ${issue.severity === 'high' ? 'text-brand-red' : issue.severity === 'medium' ? 'text-brand-yellow' : 'text-muted-foreground'}`}>{issue.severity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {foundKeywords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Spam Trigger Words ({foundKeywords.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {foundKeywords.slice(0, 15).map(kw => (
                  <span key={kw} className="px-2 py-0.5 rounded-md bg-brand-red/20 text-brand-red text-xs font-medium">{kw}</span>
                ))}
                {foundKeywords.length > 15 && <span className="text-xs text-muted-foreground">+{foundKeywords.length - 15} more</span>}
              </div>
            </div>
          )}

          {totalIssues === 0 ? (
            <p className="text-xs text-brand-green flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> No spam triggers detected. Your email looks clean!
            </p>
          ) : onApplyFix && canFix ? (
            <Button
              size="sm"
              onClick={handleApplyFix}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Wand2 className="w-3.5 h-3.5" /> Auto-Fix: Replace Spam Words &amp; Apply Suggestions
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}