import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

// BUG FIX #11: Safe highlight using DOM text nodes instead of dangerouslySetInnerHTML
// This completely eliminates XSS risk from document content
function SafeHighlight({ text, query }) {
    if (!text || !query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="bg-accent/30 text-accentLight rounded px-0.5 not-italic">{part}</mark>
                    : part
            )}
        </span>
    );
}

export default function Search() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);

    const doSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        try {
            const r = await api.get('/documents/search', { params: { q: query } });
            setResults(r.data);
            setSearched(true);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const snippet = (text, q, len = 220) => {
        if (!text) return '';
        const i = text.toLowerCase().indexOf(q.toLowerCase());
        const start = Math.max(0, i - 70);
        return text.substring(start, start + len);
    };

    const fmt = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <main className="max-w-5xl mx-auto w-full px-6 py-10 flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
                <div>
                    <h1 className="text-3xl font-display font-bold text-textPrimary tracking-tight">Smart Search</h1>
                    <p className="text-textSecondary mt-1">Search across all your uploaded documents</p>
                </div>
                <Link to="/dashboard" className="px-5 py-2.5 rounded-lg border border-border bg-bgCard text-textPrimary font-semibold hover:border-accent hover:bg-accentGlow transition-all whitespace-nowrap">← Dashboard</Link>
            </div>

            <form className="w-full" onSubmit={doSearch}>
                <div className="flex items-center gap-3 p-2 bg-bgCard border border-border rounded-2xl shadow-lg focus-within:border-accent focus-within:ring-4 focus-within:ring-accentGlow transition-all">
                    <div className="pl-4 text-2xl opacity-50">🔍</div>
                    <input
                        className="flex-1 bg-transparent border-none text-textPrimary text-lg outline-none placeholder-textMuted py-3"
                        type="text"
                        placeholder="Search by keyword, phrase, or topic…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center"
                        type="submit"
                        disabled={loading || !query.trim()}
                    >
                        {loading ? <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Search'}
                    </button>
                </div>
            </form>

            {searched && !loading && (
                <div className="pb-4 border-b border-border/50">
                    <p className="text-textSecondary text-lg font-medium">
                        {results.length > 0
                            ? <><strong className="text-textPrimary">{results.length}</strong> result(s) for "<strong className="text-textPrimary">{query}</strong>"</>
                            : <>No results for "<strong className="text-accent">{query}</strong>"</>
                        }
                    </p>
                </div>
            )}

            <div className="flex flex-col gap-6">
                {results.map(doc => (
                    <div
                        key={doc.id}
                        className="group flex flex-col bg-bgCard border border-border rounded-2xl p-6 hover:border-accent/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/document/${doc.id}`)}
                    >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 shrink-0 rounded-xl bg-bgElevated flex items-center justify-center text-2xl shadow-sm border border-border">📄</div>
                                <div>
                                    <div className="text-xl font-bold text-textPrimary group-hover:text-accent transition-colors">{doc.originalFilename}</div>
                                    <div className="flex items-center gap-2 text-sm text-textMuted mt-1">
                                        {doc.wordCount && <span>{doc.wordCount.toLocaleString()} words</span>}
                                        {doc.fileSize && <><span>·</span><span>{fmt(doc.fileSize)}</span></>}
                                        {doc.uploadedAt && <><span>·</span><span>{new Date(doc.uploadedAt).toLocaleDateString()}</span></>}
                                    </div>
                                </div>
                            </div>
                            <span className="px-4 py-1.5 rounded-full bg-success/10 text-success font-bold text-xs border border-success/20 group-hover:bg-success group-hover:text-white transition-colors">View →</span>
                        </div>

                        {doc.summary && (
                            <div className="bg-bgElevated p-4 rounded-xl border border-border/50 text-sm text-textSecondary leading-relaxed">
                                {/* BUG FIX #11: Use safe React-based highlight, no dangerouslySetInnerHTML */}
                                <SafeHighlight text={snippet(doc.summary, query)} query={query} />
                                <span className="text-textMuted">…</span>
                            </div>
                        )}

                        {doc.keywords?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/50">
                                {doc.keywords.slice(0, 8).map(k => (
                                    <span
                                        key={k}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                            k.toLowerCase().includes(query.toLowerCase())
                                                ? 'bg-accent/20 border border-accent/30 text-accentLight'
                                                : 'bg-bgElevated border border-border text-textSecondary'
                                        }`}
                                    >{k}</span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </main>
    );
}
