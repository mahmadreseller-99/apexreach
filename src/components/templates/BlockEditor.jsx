import React from 'react';
import { Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function BlockEditor({ block, onChange, onDelete }) {
  if (!block) return null;

  const update = (key, value) => onChange({ [key]: value });
  const updateStyle = (key, value) => onChange({ style: { ...block.style, [key]: value } });

  return (
    <div className="space-y-3 text-xs">
      {/* Content */}
      {block.type !== 'divider' && block.type !== 'image' && (
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Content</Label>
          <textarea
            value={block.content}
            onChange={e => update('content', e.target.value)}
            className="mt-1 w-full min-h-[70px] rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
          />
        </div>
      )}

      {block.type === 'image' && (
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Image URL</Label>
          <Input value={block.content} onChange={e => update('content', e.target.value)} className="mt-1 bg-background border-border text-xs h-7" />
        </div>
      )}

      {/* Color */}
      {block.type !== 'divider' && (
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Text Color</Label>
          <div className="flex gap-2 mt-1 items-center">
            <input type="color" value={block.style?.color || '#444444'} onChange={e => updateStyle('color', e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
            <Input value={block.style?.color || '#444444'} onChange={e => updateStyle('color', e.target.value)} className="flex-1 bg-background border-border text-xs h-7" />
          </div>
        </div>
      )}

      {/* Button Props */}
      {block.type === 'button' && (
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Button Link (URL)</Label>
            <Input value={block.url || ''} onChange={e => update('url', e.target.value)} placeholder="https://..." className="mt-1 bg-background border-border text-xs h-7" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Button Color</Label>
            <div className="flex gap-2 mt-1 items-center">
              <input type="color" value={block.style?.backgroundColor || '#f97316'} onChange={e => updateStyle('backgroundColor', e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
              <Input value={block.style?.backgroundColor || '#f97316'} onChange={e => updateStyle('backgroundColor', e.target.value)} className="flex-1 bg-background border-border text-xs h-7" />
            </div>
          </div>
        </div>
      )}

      {/* Font Size */}
      {(block.type === 'text' || block.type === 'heading') && (
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Font Size</Label>
          <Input
            type="number"
            value={parseInt(block.style?.fontSize || '15')}
            onChange={e => updateStyle('fontSize', `${e.target.value}px`)}
            className="mt-1 bg-background border-border text-xs h-7"
            min={10} max={60}
          />
        </div>
      )}

      {/* Alignment */}
      {block.type !== 'divider' && (
        <div>
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Alignment</Label>
          <div className="flex gap-1 mt-1">
            {['left', 'center', 'right'].map(align => (
              <button
                key={align}
                onClick={() => updateStyle('textAlign', align)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${
                  (block.style?.textAlign || 'left') === align
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-[10px] font-semibold"
      >
        <Trash2 className="w-3 h-3" /> Delete Block
      </button>
    </div>
  );
}