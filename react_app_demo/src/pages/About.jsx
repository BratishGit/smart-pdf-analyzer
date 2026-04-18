import React from 'react';
import MissionStatement from '../components/MissionStatement';
import Timeline from '../components/Timeline';
import TeamSection from '../components/TeamSection';
import FAQ from '../components/FAQ';

const About = () => {
    return (
        <main className="w-full flex flex-col bg-bgDark" role="main" id="about-page">
            {/* Simple aesthetic hero for About */}
            <section className="pt-32 pb-20 text-center px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--bg-elevated)_0%,var(--bg-dark)_100%)] -z-10" />
                <h1 className="text-5xl md:text-7xl font-display font-bold text-textPrimary tracking-tight mb-6 animate-in slide-in-from-bottom-5 fade-in duration-700">About <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-purple-400">PDFBrat</span></h1>
                <p className="text-xl md:text-2xl text-textSecondary max-w-2xl mx-auto leading-relaxed animate-in slide-in-from-bottom-5 fade-in duration-700 delay-150">We're pioneering the next generation of document intelligence, turning unstructured text into actionable insights.</p>
            </section>
            
            <MissionStatement />
            <Timeline />
            <TeamSection />
            <FAQ />
            
            <section className="py-24 text-center px-6">
                <div className="max-w-3xl mx-auto p-12 bg-bgCard border border-border rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none" />
                    <h2 className="text-3xl font-display font-bold text-textPrimary mb-4">Ready to start analyzing?</h2>
                    <p className="text-lg text-textSecondary mb-8">Join thousands of users who trust PDFBrat for their document workflows.</p>
                    <a href="/register" className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">Create free account →</a>
                </div>
            </section>
        </main>
    );
};

export default About;