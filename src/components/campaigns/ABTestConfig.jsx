import React from 'react';
import { Plus, Trash2, Trophy, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export default function ABTestConfig({ form, updateField }) {
  const subjects = form.subjects || [''];
  const abEnabled = subjects.length > 1;
  const testSplit = form.ab_test_split || 20; // % of list to test on per variant
  const winnerMetric = form.ab_winner_metric || 'open_rate';
  const winnerHours = form.ab_winner_hours || 4;

  const addVariant = () => updateField('subjects', [...subjects, '']);
  const removeVariant = (i) => updateField('subjects', subjects.filter((_, j) => j !== i));
  const updateSubject = (i, val) => {
    const next = [...subjects];
    next[i] = val;
    updateField('subjects', next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">Subject Lines / A/B Test</Label>
        {abEnabled && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">A/B Test Active</span>
        )}
      </div>

      <div className="space-y-2">
        {subjects.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground w-6 flex-shrink-0">{String.fromCharCode(65 + i)}</span>
            <Input
              value={s}
              onChange={e => updateSubject(i, e.target.value)}
              placeholder={`Subject line ${String.fromCharCode(65 + i)}`}
              className="bg-background border-border flex-1"
            />
            {subjects.length > 1 && (
              <button onClick={() => removeVariant(i)} className="p-2 hover:bg-destructive/10 rounded-lg flex-shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            )}
          </div>
        ))}
        {subjects.length < 4 && (
          <button onClick={addVariant} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 mt-1">
            <Plus className="w-3 h-3" /> Add variant
          </button>
        )}
      </div>

      {abEnabled && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-2">
            <Trophy className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Auto-Winner Selection</p>
              <p className="text-xs text-muted-foreground mt-0.5">Send each variant to a test group, then automatically send the winner to remaining contacts.</p>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Test Split — {testSplit}% of list per variant</Label>
            <Slider
              value={[testSplit]}
              onValueChange={v => updateField('ab_test_split', v[0])}
              min={5} max={40} step={5}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Each variant will be sent to {testSplit}% of your list. Remaining {Math.max(0, 100 - subjects.length * testSplit)}% get the winner.
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Winner Metric</Label>
            <div className="flex gap-2 mt-1.5">
              {[
                { val: 'open_rate', label: 'Open Rate' },
                { val: 'click_rate', label: 'Click Rate' },
                { val: 'reply_rate', label: 'Reply Rate' },
              ].map(m => (
                <button
                  key={m.val}
                  onClick={() => updateField('ab_winner_metric', m.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${winnerMetric === m.val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Declare winner after: {winnerHours} hour{winnerHours > 1 ? 's' : ''}</Label>
            <Slider
              value={[winnerHours]}
              onValueChange={v => updateField('ab_winner_hours', v[0])}
              min={1} max={48} step={1}
              className="mt-2"
            />
          </div>
        </div>
      )}
    </div>
  );
}