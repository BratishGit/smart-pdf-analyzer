import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ALLOWED = ['application/pdf'];

export default function Upload() {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');


  const handleFile = useCallback((f) => {
    setError('');
    if (!ALLOWED.includes(f.type) && !f.name.match(/\.(pdf)$/i)) {
      setError('Only PDF files are supported for stabilization.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      setError('File must be under 50 MB.');
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const onPickFile = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/document/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const fmt = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <main className="max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl font-display font-bold text-textPrimary tracking-tight">Upload PDF Document</h1>
          <p className="text-textSecondary mt-1">Supports PDF — up to 50 MB</p>
        </div>
        <button className="px-5 py-2.5 rounded-lg border border-border bg-bgCard text-textPrimary font-semibold hover:border-accent hover:bg-accentGlow transition-all" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </div>

      <div className="w-full flex flex-col gap-6">
        <div
          className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300 min-h-[300px] text-center ${dragging ? 'border-accent bg-accentGlow/20 scale-[1.02]' : file ? 'border-success/50 bg-success/5' : 'border-border bg-bgElevated hover:border-accent/40'}`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {file ? (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
              <div className="text-6xl text-accent">📄</div>
              <div className="flex flex-col">
                <div className="text-lg font-bold text-textPrimary">{file.name}</div>
                <div className="text-sm font-medium text-textSecondary uppercase tracking-widest">{fmt(file.size)}</div>
              </div>
              <button className="mt-4 px-4 py-2 rounded border border-danger/30 text-danger font-semibold hover:bg-danger/10 hover:border-danger transition-all text-sm" onClick={() => setFile(null)}>✕ Remove File</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl text-textMuted opacity-50 animate-bounce mb-2">📥</div>
              <p className="text-xl font-semibold text-textPrimary">Drag & drop your PDF here</p>
              <span className="text-sm font-medium text-textMuted uppercase tracking-widest my-2">or</span>
              <label className="cursor-pointer px-6 py-3 rounded-xl border border-accent text-accentLight font-bold bg-transparent hover:bg-accent hover:text-white transition-all shadow-sm">
                Browse Files
                <input type="file" accept=".pdf" hidden onChange={onPickFile} />
              </label>
            </div>
          )}
        </div>

        {error && <p className="p-4 rounded-xl bg-danger/10 text-danger font-medium border border-danger/20 text-center animate-in slide-in-from-top-2">{error}</p>}

        {file && (
          <button
            className="w-full py-4 mt-4 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 animate-in fade-in"
            onClick={upload}
            disabled={uploading}
          >
            {uploading ? (
              <><span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Uploading & Analyzing…</>
            ) : (
              'Start Analysis Process 🚀'
            )}
          </button>
        )}
      </div>
    </main>
  );
}
