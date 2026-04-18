import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { chatWithDocument, getDocumentChatHistory } from '../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Avatar from '../components/Avatar';

// ── Helpers ───────────────────────────────────────────────────────────────────
const POLL_INTERVAL = 2500;
const PROCESSING_STATUSES = new Set([
    'PROCESSING', 'UPLOADING', 'EXTRACTING_TEXT', 'DETECTING_LANGUAGE', 'SUMMARIZING'
]);

function isProcessing(status) {
    return PROCESSING_STATUSES.has(status);
}

function StatusBadge({ status }) {
    if (status === 'DONE')
        return <span className="px-3 py-1 rounded-full bg-success/20 text-success font-bold text-xs uppercase tracking-widest border border-success/30">✓ Indexed</span>;
    if (status === 'ERROR')
        return <span className="px-3 py-1 rounded-full bg-danger/20 text-danger font-bold text-xs uppercase tracking-widest border border-danger/30">✗ Error</span>;
    if (status === 'EMPTY_CONTENT')
        return <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-widest border border-amber-500/30">⚠ Empty</span>;
    return (
        <span className="px-3 py-1 rounded-full bg-warn/20 text-warn font-bold text-xs uppercase tracking-widest border border-warn/30 animate-pulse">
            ⟳ {status?.replace(/_/g, ' ') || 'Processing'}…
        </span>
    );
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-bgElevated border border-border text-textSecondary text-sm font-semibold hover:border-accent hover:text-accent transition-all"
        >
            {copied ? '✓ Copied!' : '⧉ Copy Text'}
        </button>
    );
}

function StatPill({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <span className="px-3 py-1.5 rounded-full bg-bgElevated border border-border text-sm font-medium text-textSecondary">
            <span className="text-textMuted text-xs uppercase tracking-wide mr-1">{label}</span>
            <span className="text-textPrimary font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        </span>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DocumentView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [doc, setDoc]           = useState(null);
    const [loading, setLoading]   = useState(true);
    const [tab, setTab]           = useState('summary');

    // Raw text tab
    const [rawText, setRawText]         = useState('');
    const [textLoading, setTextLoading] = useState(false);

    // PDF preview tab
    const [pdfUrl, setPdfUrl]           = useState(null);
    const [pdfLoading, setPdfLoading]   = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput]       = useState('');
    const [chatLoading, setChatLoading]   = useState(false);
    const [chatMode, setChatMode]         = useState('detailed');
    const chatEndRef = useRef(null);
    const intervalRef = useRef(null);

    const user     = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.fullName || user.username || 'You';

    // ── Polling ──────────────────────────────────────────────────────────────
    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        if (intervalRef.current) return; // already polling
        intervalRef.current = setInterval(async () => {
            try {
                const res = await api.get(`/documents/${id}`);
                setDoc(res.data);
                if (!isProcessing(res.data.status)) {
                    stopPolling();
                }
            } catch {
                stopPolling();
            }
        }, POLL_INTERVAL);
    }, [id, stopPolling]);

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!localStorage.getItem('token')) { navigate('/login'); return; }

        const init = async () => {
            try {
                const [docRes, histRes] = await Promise.all([
                    api.get(`/documents/${id}`),
                    getDocumentChatHistory(id),
                ]);
                setDoc(docRes.data);

                // Load chat history
                const msgs = [];
                histRes.data.forEach(it => {
                    msgs.push({ role: 'user', text: it.question });
                    msgs.push({ role: 'ai',   text: it.answer });
                });
                setChatMessages(msgs);

                // BUG FIX #3: Poll on ANY in-progress status, not just 'PROCESSING'
                if (isProcessing(docRes.data.status)) startPolling();
            } catch {
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        init();
        return () => stopPolling();
    }, [id, navigate, startPolling, stopPolling]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatLoading]);

    // Revoke blob URL on unmount
    useEffect(() => {
        return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
    }, [pdfUrl]);

    // ── Tab loaders ──────────────────────────────────────────────────────────
    const loadRawText = () => {
        if (rawText || textLoading) return;
        setTextLoading(true);
        api.get(`/documents/${id}/text`)
            .then(r => setRawText(r.data.text))
            .catch(() => setRawText('Could not load document text.'))
            .finally(() => setTextLoading(false));
    };

    const loadPdf = () => {
        if (pdfUrl || pdfLoading) return;
        setPdfLoading(true);
        api.get(`/documents/${id}/file`, { responseType: 'blob' })
            .then(r => setPdfUrl(URL.createObjectURL(r.data)))
            .catch(() => setPdfLoading(false))
            .finally(() => setPdfLoading(false));
    };

    // ── Chat ─────────────────────────────────────────────────────────────────
    const handleAsk = async (e) => {
        e.preventDefault();
        const question = chatInput.trim();
        if (!question || chatLoading) return;

        setChatMessages(prev => [...prev, { role: 'user', text: question }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await chatWithDocument(id, question, chatMode);
            const { answer } = res.data;
            setChatMessages(prev => [...prev, { role: 'ai', text: answer }]);
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to get an answer. Please try again.';
            setChatMessages(prev => [...prev, { role: 'ai', text: msg, isError: true }]);
        } finally {
            setChatLoading(false);
        }
    };

    const quickQuestions = [
        'What is the main topic of this document?',
        'Summarize the key points in bullet form',
        'What are the conclusions or recommendations?',
        'List the most important facts or figures',
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <span className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!doc) return null;

    const tabs = [
        { key: 'summary',  label: '📝 Summary'    },
        { key: 'keywords', label: '🔑 Keywords'   },
        { key: 'entities', label: '🏷️ Entities'   },
        { key: 'text',     label: '📄 Raw Text'   },
        { key: 'preview',  label: '👁️ Preview'    },
        { key: 'chat',     label: '💬 AI Q&A'     },
    ];

    return (
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col gap-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border/50">
                <div className="flex-1 min-w-0">
                    <button
                        className="text-textSecondary hover:text-accent font-semibold mb-3 transition-colors text-sm"
                        onClick={() => navigate('/dashboard')}
                    >← Back to Dashboard</button>
                    <h1 className="text-2xl lg:text-3xl font-display font-bold text-textPrimary tracking-tight break-words">
                        {doc.title || doc.originalFilename}
                    </h1>
                    {doc.author && doc.author !== 'Unknown' && (
                        <p className="text-textSecondary mt-1 italic text-sm">by {doc.author}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <StatusBadge status={doc.status} />
                        {doc.fileType && (
                            <span className="px-3 py-1 rounded-full bg-accentGlow text-accentLight font-bold uppercase tracking-widest text-xs border border-accent/20">
                                {doc.fileType.split('/')[1]?.toUpperCase()}
                            </span>
                        )}
                        <StatPill label="pages"  value={doc.pageCount > 0 ? doc.pageCount : null} />
                        <StatPill label="words"  value={doc.wordCount} />
                        <StatPill label="sentences" value={doc.sentenceCount} />
                        <StatPill label="lang"   value={doc.language} />
                        {doc.fileSize && (
                            <StatPill label="size" value={doc.fileSize < 1024*1024
                                ? Math.round(doc.fileSize/1024) + ' KB'
                                : (doc.fileSize/(1024*1024)).toFixed(1) + ' MB'} />
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Panel */}
            <div className="flex flex-col bg-bgCard border border-border rounded-3xl overflow-hidden shadow-sm">

                {/* Tab Bar */}
                <div className="flex overflow-x-auto border-b border-border bg-bgElevated/60 p-2 gap-1.5 hide-scrollbar">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                tab === t.key
                                    ? 'bg-bgCard text-accent shadow-sm border border-border'
                                    : 'text-textSecondary hover:text-textPrimary hover:bg-border/50'
                            }`}
                            onClick={() => {
                                setTab(t.key);
                                if (t.key === 'text')    loadRawText();
                                if (t.key === 'preview') loadPdf();
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 md:p-10 min-h-[500px]">

                    {/* ── SUMMARY ─────────────────────────────────────────── */}
                    {tab === 'summary' && (
                        <div>
                            {isProcessing(doc.status) ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                                    <span className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                    <p className="text-textSecondary font-medium">
                                        {doc.status?.replace(/_/g, ' ')} — this usually takes 15–30 seconds…
                                    </p>
                                </div>
                            ) : doc.summary ? (
                                <div className="prose prose-lg dark:prose-invert max-w-none text-textPrimary leading-relaxed prose-headings:text-accent prose-strong:text-textPrimary prose-a:text-accent">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.summary}</ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-textMuted italic text-center py-16">No summary available for this document.</p>
                            )}
                        </div>
                    )}

                    {/* ── KEYWORDS ────────────────────────────────────────── */}
                    {tab === 'keywords' && (
                        <div>
                            <p className="text-textSecondary text-sm mb-6">
                                Extracted using TF-IDF (Term Frequency–Inverse Document Frequency). Higher frequency = more important to this document.
                            </p>
                            {doc.keywords?.filter(k => k.trim()).length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {doc.keywords.filter(k => k.trim()).map((kw, i) => (
                                        <span
                                            key={i}
                                            className="px-4 py-2 rounded-xl bg-accentGlow/60 border border-accent/25 text-accent font-bold tracking-wide shadow-sm hover:bg-accent hover:text-white transition-all cursor-default"
                                            style={{ fontSize: `${Math.max(0.75, 1 - i * 0.02)}rem` }}
                                            title={`Keyword rank #${i + 1}`}
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-16 gap-3 text-center">
                                    {isProcessing(doc.status)
                                        ? <><span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /><p className="text-textSecondary">Extracting keywords…</p></>
                                        : <p className="text-textMuted italic">No keywords extracted for this document.</p>
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── ENTITIES ────────────────────────────────────────── */}
                    {tab === 'entities' && (
                        <div>
                            <p className="text-textSecondary text-sm mb-6">
                                Named entities detected via capitalisation pattern recognition (people, places, organisations, proper nouns).
                            </p>
                            {doc.namedEntities?.filter(e => e.trim()).length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {doc.namedEntities.filter(e => e.trim()).map((ent, i) => (
                                        <span key={i} className="px-4 py-2 rounded-xl bg-success/10 border border-success/30 text-success font-bold tracking-wide shadow-sm hover:bg-success/20 transition-colors cursor-default">
                                            {ent}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-16 gap-3 text-center">
                                    {isProcessing(doc.status)
                                        ? <><span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /><p className="text-textSecondary">Detecting entities…</p></>
                                        : <p className="text-textMuted italic">No named entities detected in this document.</p>
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── RAW TEXT ────────────────────────────────────────── */}
                    {tab === 'text' && (
                        <div className="flex flex-col gap-4 h-[620px]">
                            <div className="flex items-center justify-between">
                                <p className="text-textSecondary text-sm">
                                    Full text extracted from the document. Use the copy button to grab it all.
                                </p>
                                {rawText && <CopyButton text={rawText} />}
                            </div>
                            <div className="flex-1 bg-bgElevated rounded-2xl border border-border overflow-hidden flex flex-col">
                                {textLoading ? (
                                    <div className="m-auto flex items-center gap-3 text-accent">
                                        <span className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                        Loading text…
                                    </div>
                                ) : (
                                    <pre className="flex-1 whitespace-pre-wrap overflow-y-auto text-sm text-textSecondary font-mono p-6 leading-relaxed scrollbar-thin">
                                        {rawText || 'No text has been extracted yet. Please wait for processing to complete.'}
                                    </pre>
                                )}
                            </div>
                            {rawText && (
                                <p className="text-xs text-textMuted text-right">
                                    {rawText.length.toLocaleString()} characters · {rawText.split('\n').length.toLocaleString()} lines
                                </p>
                            )}
                        </div>
                    )}

                    {/* ── PDF PREVIEW ─────────────────────────────────────── */}
                    {tab === 'preview' && (
                        <div className="flex flex-col gap-4">
                            <p className="text-textSecondary text-sm">
                                In-browser PDF preview. Use the toolbar inside the viewer to zoom, search, or download.
                            </p>
                            <div className="h-[680px] flex rounded-2xl border border-border overflow-hidden bg-bgElevated">
                                {doc.fileType?.includes('pdf') ? (
                                    pdfLoading ? (
                                        <div className="m-auto flex items-center gap-3 text-accent">
                                            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                            Loading PDF preview…
                                        </div>
                                    ) : pdfUrl ? (
                                        <iframe
                                            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                            title={`Preview: ${doc.originalFilename}`}
                                            className="w-full h-full border-none bg-white"
                                        />
                                    ) : (
                                        <div className="m-auto text-textMuted italic">Failed to load preview.</div>
                                    )
                                ) : (
                                    <div className="m-auto flex flex-col items-center gap-4 text-center px-8">
                                        <p className="text-textSecondary text-lg">In-browser preview is only available for PDF files.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── AI CHAT ─────────────────────────────────────────── */}
                    {tab === 'chat' && (
                        <div className="flex flex-col h-[640px] bg-bgElevated rounded-2xl border border-border overflow-hidden">

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 flex flex-col">
                                {chatMessages.length === 0 && (
                                    <div className="m-auto flex flex-col items-center text-center max-w-lg">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg mb-5">🤖</div>
                                        <h3 className="text-xl font-display font-bold text-textPrimary mb-2">Ask anything about this document</h3>
                                        <p className="text-textSecondary mb-6 text-sm">Powered by Google Gemini AI. I have read the full content of <strong className="text-textPrimary">{doc.originalFilename}</strong>.</p>
                                        <div className="flex flex-col gap-2 w-full">
                                            {quickQuestions.map((q, i) => (
                                                <button
                                                    key={i}
                                                    className="px-4 py-2.5 rounded-xl border border-accent/30 text-accent font-medium bg-accentGlow/20 hover:bg-accentGlow text-sm text-left transition-colors"
                                                    onClick={() => setChatInput(q)}
                                                    disabled={isProcessing(doc.status)}
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                        {isProcessing(doc.status) && (
                                            <p className="text-warn text-xs mt-4 font-medium">⚠ Document is still processing. Q&A will be available once complete.</p>
                                        )}
                                    </div>
                                )}

                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className="shrink-0 mt-0.5">
                                            {msg.role === 'user'
                                                ? <Avatar name={userName} size="sm" className="bg-bgCard border border-border text-textSecondary" />
                                                : <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow">AI</div>
                                            }
                                        </div>
                                        <div className={`max-w-[82%] rounded-2xl px-5 py-3.5 shadow-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-br from-accent to-purple-600 text-white rounded-tr-sm'
                                                : msg.isError
                                                    ? 'bg-danger/10 border border-danger/20 text-danger rounded-tl-sm'
                                                    : 'bg-bgCard border border-border text-textPrimary rounded-tl-sm'
                                        }`}>
                                            {msg.role === 'ai' && !msg.isError ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {chatLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow shrink-0">AI</div>
                                        <div className="bg-bgCard border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5">
                                            {[0, 150, 300].map(d => (
                                                <span key={d} className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <form className="p-4 bg-bgCard border-t border-border flex flex-col gap-3" onSubmit={handleAsk}>
                                {/* Mode selector */}
                                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                                    <span className="text-xs text-textMuted font-semibold uppercase tracking-wider shrink-0">Mode:</span>
                                    {[
                                        { id: 'simple',    label: 'Simple',    desc: 'Short, plain answer' },
                                        { id: 'detailed',  label: 'Detailed',  desc: 'In-depth explanation' },
                                        { id: 'summary',   label: 'Summary',   desc: 'Summarise the answer' },
                                        { id: 'keypoints', label: 'Key Points',desc: 'Bullet-point format' },
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            title={m.desc}
                                            onClick={() => setChatMode(m.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all shrink-0 ${
                                                chatMode === m.id
                                                    ? 'bg-accent text-white border-accent shadow'
                                                    : 'bg-bgElevated text-textSecondary border-border hover:border-accent/50'
                                            }`}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Text input + send */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        className="flex-1 px-5 py-3.5 rounded-xl bg-bgElevated border border-border text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accentGlow transition-all placeholder-textMuted text-sm"
                                        placeholder={isProcessing(doc.status) ? 'Waiting for processing to complete…' : `Ask in ${chatMode} mode…`}
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        disabled={chatLoading || isProcessing(doc.status)}
                                    />
                                    <button
                                        type="submit"
                                        className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white flex items-center justify-center shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                                        disabled={chatLoading || !chatInput.trim() || isProcessing(doc.status)}
                                    >
                                        {chatLoading
                                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>
        </main>
    );
}
