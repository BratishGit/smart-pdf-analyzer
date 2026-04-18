import React from 'react';

const MissionStatement = () => (
  <section className="py-24" aria-label="Mission Statement">
    <div className="max-w-5xl mx-auto px-6">
      <div className="p-10 md:p-16 bg-gradient-to-br from-bgElevated to-bgCard border border-border rounded-[2rem] shadow-2xl relative overflow-hidden text-center group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accentGlow rounded-full blur-[100px] -z-10 group-hover:scale-110 transition-transform duration-700" />
        <h2 className="text-3xl md:text-4xl font-display font-bold text-textPrimary mb-6 leading-tight">Our mission is to make document analysis <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">frictionless</span>.</h2>
        <p className="text-lg md:text-xl text-textSecondary leading-relaxed max-w-3xl mx-auto">We believe that no one should spend hours manually extracting information from PDFs. By blending advanced NLP with an incredibly intuitive design, we empower professionals to find answers instantly.</p>
      </div>
    </div>
  </section>
);

export default MissionStatement;