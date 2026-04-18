import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Avatar from '../components/Avatar';

const PROCESSING_STATUSES = new Set([
    'PROCESSING', 'UPLOADING', 'EXTRACTING_TEXT', 'DETECTING_LANGUAGE', 'SUMMARIZING'
]);

function StatusBadge({ status }) {
    if (status === 'DONE')
        return <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-success bg-success/20 rounded-full border border-success/30">✓ Done</span>;
    if (status === 'ERROR')
        return <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-danger bg-danger/20 rounded-full border border-danger/30">✗ Error</span>;
    if (status === 'EMPTY_CONTENT')
        return <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/20 rounded-full border border-amber-500/30">⚠ Empty</span>;
    if (PROCESSING_STATUSES.has(status))
        return <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-warn bg-warn/20 rounded-full border border-warn/30 animate-pulse">⟳ Processing</span>;
    return <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-accentLight bg-accentGlow rounded-full">{status}</span>;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [docs, setDocs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }
        api.get('/documents')
            .then(r => setDocs(r.data))
            .catch(() => setError('Could not load documents. Is the backend running?'))
            .finally(() => setLoading(false));
    }, [navigate]);

    const remove = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete this document? This cannot be undone.')) return;
        try {
            await api.delete(`/documents/${id}`);
            setDocs(d => d.filter(x => x.id !== id));
        } catch {
            alert('Failed to delete document.');
        }
    };

    const fmt = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—';

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Strip markdown for card preview
    const stripMd = (txt) => txt
        ? txt.replace(/[#*`_~>-]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').substring(0, 130)
        : '';

    return (
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
                <div className="flex items-center gap-4">
                    <Avatar name={user.fullName || user.username || 'User'} size="lg" glow />
                    <div>
                        <h1 className="text-3xl font-display font-bold text-textPrimary tracking-tight">My Documents</h1>
                        <p className="text-textSecondary text-sm">Welcome back, <strong>{user.fullName || user.username || 'User'}</strong></p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Link to="/search"   className="px-5 py-2.5 rounded-lg border border-border bg-bgCard text-textPrimary font-semibold hover:border-accent hover:bg-accentGlow transition-all text-sm">🔍 Search</Link>
                    <Link to="/upload"   className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-accent to-purple-500 text-white font-semibold shadow hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm">+ Upload PDF</Link>
                    <button onClick={logout} className="px-5 py-2.5 rounded-lg border border-border bg-bgCard text-danger font-semibold hover:border-danger hover:bg-danger/10 transition-all text-sm">Logout</button>
                </div>
            </div>

            {/* Stats */}
            {!loading && docs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Documents', value: docs.length, icon: '📁' },
                        { label: 'Processed',       value: docs.filter(d => d.status === 'DONE').length, icon: '✅' },
                        { label: 'Total Words',     value: docs.reduce((s, d) => s + (d.wordCount || 0), 0).toLocaleString(), icon: '📝' },
                        { label: 'With Keywords',   value: docs.filter(d => d.keywords?.length > 0).length, icon: '🔑' },
                    ].map(s => (
                        <div key={s.label} className="bg-bgCard border border-border rounded-2xl p-4 flex flex-col gap-1">
                            <span className="text-2xl">{s.icon}</span>
                            <span className="text-2xl font-display font-bold text-textPrimary">{s.value}</span>
                            <span className="text-xs text-textMuted font-medium uppercase tracking-wide">{s.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* States */}
            {loading && (
                <div className="py-20 flex flex-col items-center gap-4 text-textSecondary">
                    <div className="w-8 h-8 rounded-full border-4 border-t-accent animate-spin" />
                    Loading your documents…
                </div>
            )}
            {error && (
                <p className="p-4 rounded-xl bg-danger/10 text-danger font-medium border border-danger/20 text-center">{error}</p>
            )}
            {!loading && !error && docs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-border rounded-3xl bg-bgElevated gap-4 text-center">
                    <div className="text-6xl mb-2 animate-bounce">📂</div>
                    <h3 className="text-2xl font-display font-bold text-textPrimary">No documents yet</h3>
                    <p className="text-textSecondary max-w-md">Upload your first PDF to extract insights, generate AI summaries, and enable smart search.</p>
                    <Link to="/upload" className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl transition-all">Upload Your First PDF</Link>
                </div>
            )}

            {/* Document Grid */}
            {!loading && docs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {docs.map(doc => (
                        <div
                            key={doc.id}
                            className="group relative flex flex-col justify-between bg-bgCard border border-border rounded-2xl p-5 hover:border-accent/40 hover:shadow-[0_15px_30px_rgba(79,70,229,0.1)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => navigate(`/document/${doc.id}`)}
                        >
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 shrink-0 rounded-lg bg-bgElevated flex items-center justify-center text-xl shadow-sm border border-border">📄</div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-textPrimary truncate group-hover:text-accent transition-colors text-sm" title={doc.originalFilename}>
                                                {doc.originalFilename}
                                            </div>
                                            <div className="text-xs text-textMuted mt-0.5">{fmt(doc.fileSize)} · {fmtDate(doc.uploadedAt)}</div>
                                        </div>
                                    </div>
                                </div>

                                <StatusBadge status={doc.status} />

                                {doc.summary && doc.status === 'DONE' && (
                                    <p className="text-xs text-textSecondary leading-relaxed line-clamp-3">{stripMd(doc.summary)}…</p>
                                )}

                                {doc.keywords?.filter(k => k.trim()).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {doc.keywords.slice(0, 4).map(k => (
                                            <span key={k} className="px-2 py-0.5 rounded bg-bgElevated border border-border text-xs text-textSecondary">{k}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
                                <span className="text-xs text-textMuted font-medium">
                                    {doc.wordCount ? `${doc.wordCount.toLocaleString()} words` : doc.pageCount ? `${doc.pageCount} pages` : ''}
                                </span>
                                <button
                                    className="text-xs font-semibold text-textMuted hover:text-danger hover:bg-danger/10 px-2 py-1 rounded transition-colors"
                                    onClick={(e) => remove(doc.id, e)}
                                    title="Delete document"
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
