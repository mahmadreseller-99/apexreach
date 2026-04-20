import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Code, Eye, ArrowLeft, Save, Plus, Trash2, GripVertical, Type, Image, Minus, Square, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import BlockToolbar from '../components/templates/BlockToolbar';
import BlockEditor from '../components/templates/BlockEditor';
import { renderBlocksToHtml } from '../components/templates/templateUtils';

const categories = ['outreach', 'follow_up', 'newsletter', 'promotional', 'other'];

const defaultBlocks = [
  { id: 'b1', type: 'heading', content: 'Your Email Heading', style: { fontSize: '24px', color: '#1a1a1a', textAlign: 'left' } },
  { id: 'b2', type: 'text', content: 'Hi {{first_name}},\n\nWrite your message here. You can use {{company}}, {{email}}, and {{website}} as personalization tags.', style: { fontSize: '15px', color: '#444444', textAlign: 'left' } },
  { id: 'b3', type: 'button', content: 'Click Here', style: { backgroundColor: '#f97316', color: '#ffffff', textAlign: 'center' } },
  { id: 'b4', type: 'divider', content: '', style: { color: '#e5e7eb' } },
  { id: 'b5', type: 'text', content: 'Best regards,\nYour Name', style: { fontSize: '14px', color: '#888888', textAlign: 'left' } },
];

let blockCounter = 100;

export default function TemplateEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const queryClient = useQueryClient();

  const [mode, setMode] = useState('visual'); // 'visual' | 'code' | 'preview'
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('outreach');
  const [blocks, setBlocks] = useState(defaultBlocks);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [codeValue, setCodeValue] = useState('');

  // Load existing template
  useQuery({
    queryKey: ['template', editId],
    queryFn: async () => {
      const templates = await api.templates.list();
      return templates.find(t => t.id === editId) || null;
    },
    enabled: !!editId,
    onSuccess: (t) => {
      if (!t) return;
      setName(t.name || '');
      setSubject(t.subject || '');
      setCategory(t.category || 'outreach');
      if (t.body) {
        try {
          const parsed = JSON.parse(t.body);
          if (parsed.__blocks) { setBlocks(parsed.__blocks); return; }
        } catch {}
        setCodeValue(t.body);
        setMode('code');
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = mode === 'code'
        ? codeValue
        : JSON.stringify({ __blocks: blocks, __html: renderBlocksToHtml(blocks) });

      const data = { name, subject, category, body };
      if (editId) {
        await api.templates.update(editId, data);
      } else {
        await api.templates.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
  });

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const reordered = Array.from(blocks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setBlocks(reordered);
  }, [blocks]);

  const addBlock = (type) => {
    blockCounter++;
    const newBlock = {
      id: `b${blockCounter}`,
      type,
      content: type === 'heading' ? 'New Heading' : type === 'button' ? 'Click Here' : type === 'image' ? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600' : type === 'divider' ? '' : 'New text block',
      style: type === 'button'
        ? { backgroundColor: '#f97316', color: '#ffffff', textAlign: 'center' }
        : type === 'heading'
        ? { fontSize: '22px', color: '#1a1a1a', textAlign: 'left' }
        : { fontSize: '15px', color: '#444444', textAlign: 'left' },
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const updateBlock = (id, updates) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const previewHtml = mode === 'code' ? codeValue : renderBlocksToHtml(blocks);

  return (
    <div className="flex flex-col h-full space-y-0 -m-6">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-6 py-4 bg-card border-b border-border flex-shrink-0">
        <button onClick={() => navigate('/templates')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Template name..."
            className="max-w-[200px] bg-secondary border-border text-sm font-semibold"
          />
          <Input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject line..."
            className="max-w-[260px] bg-secondary border-border text-sm"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36 bg-secondary border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map(c => (
                <SelectItem key={c} value={c} className="capitalize text-xs">{c.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {[
            { id: 'visual', label: 'Visual', icon: Square },
            { id: 'code', label: 'Code', icon: Code },
            { id: 'preview', label: 'Preview', icon: Eye },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={!name || saveMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Visual Editor */}
        {mode === 'visual' && (
          <>
            {/* Block Toolbar (left) */}
            <div className="w-56 flex-shrink-0 border-r border-border bg-card overflow-y-auto p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">Add Block</p>
              <BlockToolbar onAdd={addBlock} />

              {selectedBlock && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">Edit Block</p>
                  <BlockEditor
                    block={blocks.find(b => b.id === selectedBlock)}
                    onChange={(updates) => updateBlock(selectedBlock, updates)}
                    onDelete={() => deleteBlock(selectedBlock)}
                  />
                </div>
              )}
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-y-auto bg-secondary/40 p-6">
              <div className="max-w-[600px] mx-auto bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="email-blocks">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[400px]">
                        {blocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                onClick={() => setSelectedBlock(block.id)}
                                className={`group relative transition-all ${
                                  selectedBlock === block.id ? 'ring-2 ring-primary ring-inset' : 'hover:ring-1 hover:ring-border hover:ring-inset'
                                } ${snapshot.isDragging ? 'shadow-2xl opacity-90' : ''}`}
                              >
                                {/* Drag Handle */}
                                <div {...provided.dragHandleProps} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                                </div>
                                {/* Delete */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                                  className="absolute right-1 top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-destructive/80 text-white"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <VisualBlock block={block} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          </>
        )}

        {/* Code Editor */}
        {mode === 'code' && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden p-4 bg-[#1e1e2e]">
              <textarea
                value={codeValue || (mode === 'code' && !codeValue ? renderBlocksToHtml(blocks) : '')}
                onChange={e => setCodeValue(e.target.value)}
                onFocus={() => { if (!codeValue) setCodeValue(renderBlocksToHtml(blocks)); }}
                className="w-full h-full bg-transparent text-green-300 font-mono text-sm resize-none outline-none leading-relaxed"
                placeholder="<!-- Write your HTML email here -->"
                spellCheck={false}
              />
            </div>
            <div className="flex-1 overflow-y-auto bg-secondary/40 p-6">
              <div className="max-w-[600px] mx-auto bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
                <iframe
                  srcDoc={codeValue || '<p style="color:#aaa;padding:40px;text-align:center">Start writing HTML to see preview</p>'}
                  title="preview"
                  className="w-full min-h-[500px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview Only */}
        {mode === 'preview' && (
          <div className="flex-1 overflow-y-auto bg-secondary/40 p-6">
            <div className="max-w-[600px] mx-auto">
              <div className="bg-card border border-border rounded-xl px-5 py-3 mb-4 text-sm">
                <span className="text-muted-foreground">Subject: </span>
                <span className="text-foreground font-medium">{subject || '(No subject)'}</span>
              </div>
              <div className="bg-white rounded-2xl shadow-lg border border-border overflow-hidden">
                <iframe
                  srcDoc={previewHtml}
                  title="email preview"
                  className="w-full min-h-[600px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VisualBlock({ block }) {
  const { type, content, style } = block;

  if (type === 'divider') {
    return <div className="px-8 py-3"><hr style={{ borderColor: style?.color || '#e5e7eb' }} /></div>;
  }
  if (type === 'image') {
    return (
      <div className="px-8 py-3" style={{ textAlign: style?.textAlign || 'center' }}>
        <img src={content} alt="" className="max-w-full rounded-lg" style={{ maxHeight: 200, objectFit: 'cover' }} />
      </div>
    );
  }
  if (type === 'button') {
    return (
      <div className="px-8 py-4" style={{ textAlign: style?.textAlign || 'center' }}>
        <span className="inline-block px-6 py-3 rounded-lg text-sm font-semibold cursor-default"
          style={{ backgroundColor: style?.backgroundColor || '#f97316', color: style?.color || '#fff' }}>
          {content}
        </span>
      </div>
    );
  }
  if (type === 'heading') {
    return (
      <div className="px-8 py-4">
        <div style={{ fontSize: style?.fontSize || '24px', color: style?.color || '#1a1a1a', textAlign: style?.textAlign || 'left', fontWeight: 700 }}>
          {content}
        </div>
      </div>
    );
  }
  // text
  return (
    <div className="px-8 py-3">
      <div style={{ fontSize: style?.fontSize || '15px', color: style?.color || '#444', textAlign: style?.textAlign || 'left', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
        {content}
      </div>
    </div>
  );
}