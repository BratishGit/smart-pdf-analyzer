import React from 'react';
import { Link } from 'react-router-dom';

/**
 * HeroSection – large introductory banner on the Home page.
 */
const HeroSection = () => (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-bgDark" aria-label="Hero section" id="hero">
        {/* Decorative blobs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent rounded-full opacity-[0.15] blur-[120px] animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-accent2 rounded-full opacity-[0.1] blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accentGlow border border-accent/20 text-accentLight text-sm font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                ✦ Now live — PDFBrat AI v1
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight text-textPrimary leading-[1.1]">
                Analyze <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">Documents</span><br />
                with Intelligence
            </h1>
            
            <p className="max-w-2xl text-lg md:text-xl text-textSecondary leading-relaxed">
                The smartest way to extract insights, summarize complex reports, and 
                search through your document library using AI.
            </p>
            
            <div className="flex justify-center items-center gap-4 mt-4">
                <Link to="/register" className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all" id="hero-cta-primary">
                    Analyze Now →
                </Link>
                <Link to="/about" className="px-8 py-4 rounded-xl border border-border bg-bgCard text-textPrimary font-bold text-lg hover:border-accent hover:bg-accentGlow transition-all" id="hero-cta-secondary">
                    How it Works
                </Link>
            </div>

            {/* Decorative pill stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-16 pt-10 border-t border-border/50" aria-label="Key statistics">
                {[
                    { label: '99%', sub: 'Success Rate' },
                    { label: '100+', sub: 'Beta Users' },
                    { label: 'Real-time', sub: 'Processing' },
                ].map(({ label, sub }) => (
                    <div key={label} className="flex flex-col items-center justify-center min-w-[140px] px-6 py-4 rounded-2xl bg-bgElevated border border-border shadow-sm">
                        <span className="text-3xl font-display font-bold text-textPrimary">{label}</span>
                        <span className="text-sm font-medium text-textMuted uppercase tracking-wider mt-1">{sub}</span>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default HeroSection;
