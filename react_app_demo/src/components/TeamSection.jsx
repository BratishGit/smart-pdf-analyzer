import React from 'react';
import Avatar from './Avatar';

const TEAM = [
  { name: 'Sarah Chen', role: 'CEO & Founder', initials: 'SC' },
  { name: 'Marcus Doe', role: 'Lead AI Engineer', initials: 'MD' },
  { name: 'Aisha Patel', role: 'Head of Design', initials: 'AP' },
  { name: 'David Kim', role: 'Infrastructure', initials: 'DK' },
];

const TeamSection = () => (
  <section className="py-24 bg-bgElevated border-y border-border/50" aria-label="Our team">
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16 gap-4">
        <span className="px-3 py-1 rounded-full bg-accentGlow text-accent font-bold uppercase tracking-widest text-sm">Team</span>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-textPrimary tracking-tight">Meet the builders</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {TEAM.map((t, idx) => (
          <div key={idx} className="flex flex-col items-center p-8 bg-bgCard border border-border rounded-3xl hover:border-accent/40 hover:-translate-y-1 transition-all group text-center">
            <Avatar rounded size="xl" initials={t.initials} className="mb-6 shadow-xl" />
            <h3 className="text-xl font-display font-bold text-textPrimary group-hover:text-accent transition-colors">{t.name}</h3>
            <p className="text-textSecondary mt-2 mb-4 font-medium">{t.role}</p>
            <div className="flex gap-3 text-textMuted justify-center">
              <span className="w-8 h-8 rounded-full bg-bgElevated flex items-center justify-center hover:text-accent hover:bg-accentGlow cursor-pointer transition-all">𝕏</span>
              <span className="w-8 h-8 rounded-full bg-bgElevated flex items-center justify-center hover:text-accent hover:bg-accentGlow cursor-pointer transition-all">in</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TeamSection;