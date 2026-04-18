import React, { useState } from 'react';

const FAQS = [
  { q: 'What file types do you support?', a: 'Currently we support PDF (.pdf), Word (.docx), and Plain Text (.txt) up to 50MB per file.' },
  { q: 'Is my data secure?', a: 'Yes. We use industry-standard AES-256 encryption. Documents are processed ephemerally or stored securely depending on your account settings.' },
  { q: 'Can I use the API for my own app?', a: 'Our developer API is in private beta. Contact support to get early access.' },
  { q: 'What languages does the AI understand?', a: 'We support over 30 languages, including English, Spanish, French, German, Chinese, and Hindi.' },
];

const FAQ = () => {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 max-w-3xl mx-auto px-6" aria-label="Frequently Asked Questions">
      <div className="flex flex-col items-center text-center mb-16 gap-4">
        <span className="px-3 py-1 rounded-full bg-accentGlow text-accent font-bold uppercase tracking-widest text-sm">FAQ</span>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-textPrimary tracking-tight">Common questions</h2>
      </div>
      <div className="flex flex-col gap-4">
        {FAQS.map((itm, idx) => (
          <div key={idx} className={`border border-border rounded-2xl overflow-hidden transition-all ${open === idx ? 'bg-bgCard shadow-lg border-accent/30' : 'bg-transparent hover:bg-bgElevated'}`}>
            <button className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none" onClick={() => setOpen(open === idx ? null : idx)}>
              <span className="font-semibold text-textPrimary text-lg">{itm.q}</span>
              <span className={`text-accent transition-transform duration-300 ${open === idx ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div className={`px-6 overflow-hidden transition-all duration-300 ${open === idx ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="text-textSecondary leading-relaxed">{itm.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;