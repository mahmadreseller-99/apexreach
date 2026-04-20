import React, { useRef, useState } from 'react';
import { api } from '@/api/apiClient';
import { Paperclip, X, Loader2, FileText, Image, File } from 'lucide-react';

function getFileIcon(url) {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return Image;
  if (['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'].includes(ext)) return FileText;
  return File;
}

function getFileName(url) {
  try {
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1].split('?')[0]) || 'attachment';
  } catch {
    return 'attachment';
  }
}

export default function AttachmentUploader({ urls = [], onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    const newUrls = [...urls];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:3000/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (data.url) newUrls.push(data.url);
      } catch (e) {
        console.error('File Upload Error', e);
      }
    }
    onChange(newUrls);
    setUploading(false);
  };

  const remove = (index) => {
    const updated = urls.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
          {uploading ? 'Uploading...' : 'Attach Files'}
        </button>
        <span className="text-xs text-muted-foreground">Images, PDFs, docs, etc.</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => {
            const Icon = getFileIcon(url);
            return (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary rounded-lg border border-border text-xs text-foreground max-w-[200px]">
                <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{getFileName(url)}</span>
                <button onClick={() => remove(i)} className="flex-shrink-0 hover:text-destructive transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}