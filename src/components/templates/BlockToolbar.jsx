import React from 'react';
import { Type, Image, MousePointer, Minus, AlignLeft, Heading1 } from 'lucide-react';

const blockTypes = [
  { type: 'heading', label: 'Heading', icon: Heading1, desc: 'Large title text' },
  { type: 'text', label: 'Text', icon: AlignLeft, desc: 'Paragraph content' },
  { type: 'button', label: 'Button', icon: MousePointer, desc: 'Call-to-action' },
  { type: 'image', label: 'Image', icon: Image, desc: 'Image block' },
  { type: 'divider', label: 'Divider', icon: Minus, desc: 'Horizontal rule' },
];

export default function BlockToolbar({ onAdd }) {
  return (
    <div className="space-y-1">
      {blockTypes.map(({ type, label, icon: Icon, desc }) => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary text-left transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}