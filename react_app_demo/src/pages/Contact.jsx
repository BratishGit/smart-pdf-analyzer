import React, { useState } from 'react';

const Contact = () => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('Message sent successfully! We will get back to you soon.');
        setForm({ name: '', email: '', message: '' });
    };

    return (
        <main className="w-full flex flex-col bg-bgDark" role="main" id="contact-page">
            <section className="py-24 mt-10" aria-labelledby="contact-heading">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
                    <div className="flex flex-col gap-8">
                        <div>
                            <span className="px-3 py-1 rounded-full bg-accentGlow text-accent font-bold uppercase tracking-widest text-sm mb-4 inline-block">Support</span>
                            <h1 id="contact-heading" className="text-4xl md:text-6xl font-display font-bold text-textPrimary tracking-tight leading-tight">Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">touch</span></h1>
                            <p className="text-xl text-textSecondary mt-6 leading-relaxed max-w-lg">Have a question, feedback, or need enterprise pricing? Drop us a line. We reply to all messages within 24 hours.</p>
                        </div>
                        <div className="flex flex-col gap-6 mt-4">
                            <div className="flex items-center gap-4 p-5 bg-bgElevated rounded-2xl border border-border">
                                <span className="w-12 h-12 rounded-full bg-bgCard border border-border flex items-center justify-center text-xl shadow-sm">📍</span>
                                <div>
                                    <div className="font-bold text-textPrimary">Headquarters</div>
                                    <div className="text-textSecondary text-sm">123 AI Boulevard, Tech Park, BLR</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-bgElevated rounded-2xl border border-border">
                                <span className="w-12 h-12 rounded-full bg-accentGlow flex items-center justify-center text-xl shadow-sm">✉️</span>
                                <div>
                                    <div className="font-bold text-textPrimary">Email</div>
                                    <div className="text-accent font-semibold text-sm">support@pdfbrat.com</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-bgCard p-8 md:p-10 rounded-3xl border border-border shadow-xl relative overflow-hidden">
                        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent rounded-full opacity-[0.05] blur-[80px]" />
                        <h2 className="text-2xl font-display font-bold text-textPrimary mb-6">Send a message</h2>
                        {status && <div className="mb-6 p-4 bg-success/20 text-success border border-success/30 rounded-xl font-medium">{status}</div>}
                        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-textSecondary" htmlFor="name">Name</label>
                                <input id="name" type="text" required className="w-full px-5 py-3 rounded-xl bg-bgElevated border border-border text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accentGlow transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Doe" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-textSecondary" htmlFor="email">Email</label>
                                <input id="email" type="email" required className="w-full px-5 py-3 rounded-xl bg-bgElevated border border-border text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accentGlow transition-all" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@example.com" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-textSecondary" htmlFor="message">Message</label>
                                <textarea id="message" required rows="5" className="w-full px-5 py-4 rounded-xl bg-bgElevated border border-border text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accentGlow transition-all resize-none" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="How can we help?" />
                            </div>
                            <button type="submit" className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all">Send Message →</button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Contact;