import React, { useState, useRef, useEffect } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';

export default function EmailPreviewModal({ subject, body: rawBody, fromName, onClose }) {
  const [mode, setMode] = useState('desktop');
  const iframeRef = useRef(null);

  // Extract rendered HTML if body is a visual template JSON
  let body = rawBody || '';
  try {
    const parsed = JSON.parse(body);
    if (parsed.__html) body = parsed.__html;
  } catch {
    // Not JSON, use as-is
  }

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body { margin: 0; padding: 0; overflow-x: hidden; }
  body { padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f4; color: #333; box-sizing: border-box; }
  .email-wrap { background: #fff; border-radius: 8px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .email-header { background: #f8f8f8; padding: 16px 24px; border-bottom: 1px solid #e8e8e8; }
  .email-from { font-size: 13px; color: #666; }
  .email-subject { font-size: 16px; font-weight: 600; color: #111; margin-top: 4px; }
  .email-body { padding: 24px; font-size: 14px; line-height: 1.6; color: #333; }
  .email-body img { max-width: 100%; height: auto; }
  .email-body a { color: #f97316; }
  select, input[type=number] { -webkit-appearance: none; appearance: none; }
</style>
</head>
<body>
<div class="email-wrap">
  <div class="email-header">
    <div class="email-from">From: ${(fromName || 'Your Name').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <div class="email-subject">${(subject || '(No subject)').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  </div>
  <div class="email-body">${body || '<p style="color:#999">No email body content yet.</p>'}</div>
</div>
</body>
</html>`;

  // Auto-resize iframe to content height to eliminate scrollbars/arrows
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const resize = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          iframe.style.height = '0px';
          const h = doc.documentElement.scrollHeight || doc.body.scrollHeight;
          iframe.style.height = Math.max(300, h) + 'px';
        }
      } catch {}
    };
    iframe.addEventListener('load', resize);
    // Also resize after a short delay to catch late-rendering content
    const t = setTimeout(() => {
      if (iframe.contentDocument) resize();
    }, 200);
    return () => { iframe.removeEventListener('load', resize); clearTimeout(t); };
  }, [emailHtml, mode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-4xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-bold text-foreground">Email Preview</h2>
            <span className="text-xs text-muted-foreground">· {subject || 'No subject'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary rounded-xl p-1">
              <button
                onClick={() => setMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'desktop' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => setMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'mobile' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-6 bg-secondary/30 flex items-start justify-center">
          <div
            className="bg-white rounded-xl overflow-hidden shadow-xl transition-all duration-300"
            style={{ width: mode === 'mobile' ? '390px' : '100%', maxWidth: mode === 'desktop' ? '680px' : '390px' }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={emailHtml}
              title="Email Preview"
              className="w-full border-0 block"
              style={{ minHeight: '300px', overflow: 'hidden', display: 'block' }}
              scrolling="no"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}