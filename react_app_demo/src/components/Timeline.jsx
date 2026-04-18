import React from 'react';

const EVENTS = [
  { year: '2023', title: 'The Genesis', desc: 'Started as a weekend hackathon project by two frustrated developers.' },
  { year: '2024', title: 'Core Engine Rebuilt', desc: 'Rewritten from scratch for 100x performance.' },
  { year: '2025', title: 'AI Integration', desc: 'Introduced LLM-based intelligent extraction and summarization features.' },
  { year: '2026', title: 'Global Scaling', desc: 'Hit 100k+ beta users, expanding the platform into an enterprise solution.' }
];

const Timeline = () => (
  <section className="py-24 max-w-4xl mx-auto px-6" aria-label="Company timeline">
    <div className="flex flex-col items-center text-center mb-16 gap-4">
      <span className="px-3 py-1 rounded-full bg-accentGlow text-accent font-bold uppercase tracking-widest text-sm">Our Journey</span>
      <h2 className="text-4xl md:text-5xl font-display font-bold text-textPrimary tracking-tight">How we got here</h2>
    </div>
    <div className="relative border-l border-accent/30 ml-4 md:ml-0 md:pl-0 md:border-none md:flex md:flex-col md:gap-12">
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-accent/30 -translate-x-1/2" />
      {EVENTS.map((e, idx) => (
        <div key={idx} className={`relative mb-10 pl-8 md:pl-0 md:w-1/2 md:pr-12 md:text-right group ${idx % 2 === 1 ? 'md:ml-auto md:pr-0 md:pl-12 md:text-left' : ''}`}>
          <div className={`absolute top-1 left-[-5px] md:top-1/2 md:-translate-y-1/2 w-3 h-3 rounded-full bg-accent ring-4 ring-bgDark ${idx % 2 === 1 ? 'md:left-[-6px]' : 'md:left-auto md:right-[-6px]'}`} />
          <div className="p-6 bg-bgCard border border-border rounded-2xl group-hover:border-accent/40 group-hover:shadow-lg transition-all">
            <div className="text-accent font-bold text-lg mb-2">{e.year}</div>
            <h3 className="text-xl font-display font-bold text-textPrimary mb-2">{e.title}</h3>
            <p className="text-textSecondary leading-relaxed">{e.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Timeline;