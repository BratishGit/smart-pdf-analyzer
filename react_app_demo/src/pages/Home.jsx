import React from 'react';
import HeroSection from '../components/HeroSection';
import StatsCard from '../components/StatsCard';
import FeatureCard from '../components/FeatureCard';
import NewsFeed from '../components/NewsFeed';
import TestimonialCard from '../components/TestimonialCard';

const STATS = [
    { id: 'stat-users', icon: '🫂', value: '100+', label: 'Beta Users', trend: 10 },
    { id: 'stat-docs', icon: '📄', value: '50k+', label: 'Documents Processed', trend: 5 },
    { id: 'stat-time', icon: '🎯', value: '99%', label: 'Success Rate', trend: 2 },
    { id: 'stat-speed', icon: '⚡', value: 'Real-time', label: 'Processing', trend: 0 },
];

const FEATURES = [
    { id: 'feat-ai', icon: '🧠', title: 'AI Summarization', description: 'Transform massive documents into concise, actionable summaries instantly.', tag: 'AI' },
    { id: 'feat-extract', icon: '🔍', title: 'Smart Extraction', description: 'Automatically identify key entities, dates, and names across any file format.', tag: 'NLP' },
    { id: 'feat-search', icon: '🔎', title: 'Semantic Search', description: 'Search by meaning, not just keywords. Find answers hidden in your library.', tag: 'Search' },
    { id: 'feat-secure', icon: '🔒', title: 'Enterprise Security', description: 'Bank-grade encryption for all your sensitive documents and data.', tag: 'Cloud' },
    { id: 'feat-perf', icon: '⚡', title: 'Lightning Fast', description: 'Optimized parsing engine handles DOCX, PDF, and TXT in milliseconds.', tag: 'Perf' },
    { id: 'feat-multi', icon: '📁', title: 'Multi-Format', description: 'Seamlessly process PDFs, Word docs, and plain text files with one tool.', tag: 'Core' },
];

const TESTIMONIALS = [
    { id: 'test-1', quote: 'PDFBrat has completely changed how I handle legal research. The speed is incredible.', author: 'Priya Sharma', role: 'Advocate @ Delhi High Court', avatarSrc: '', initials: 'PS' },
    { id: 'test-2', quote: 'The AI summaries are remarkably accurate even for complex technical specifications.', author: 'Arjun Mehta', role: 'Senior Engineer @ TechMahindra', avatarSrc: '', initials: 'AM' },
    { id: 'test-3', quote: 'A must-have tool for any independent researcher. It handles massive libraries effortlessly.', author: 'Kavita Patel', role: 'Ph.D. Scholar @ IIT Bombay', avatarSrc: '', initials: 'KP' },
];

const Home = () => (
    <main className="w-full flex flex-col bg-bgDark" id="main-content" role="main">
        {/* Component 1: HeroSection */}
        <HeroSection />

        {/* Stats Strip */}
        <section className="py-24" aria-label="Key statistics">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {STATS.map(({ id, icon, value, label, trend }) => (
                        <StatsCard key={id} id={id} icon={icon} value={value} label={label} trend={trend} />
                    ))}
                </div>
            </div>
        </section>

        {/* Component 2: FeatureCard grid */}
        <section className="py-24 bg-bgElevated border-y border-border/50" aria-labelledby="features-heading">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16 gap-4">
                    <span className="px-3 py-1 rounded-full bg-accentGlow text-accent font-bold uppercase tracking-widest text-sm">Capabilities</span>
                    <h2 id="features-heading" className="text-4xl md:text-5xl font-display font-bold text-textPrimary tracking-tight">Experience <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">document intelligence</span></h2>
                    <p className="text-lg text-textSecondary leading-relaxed">Advanced AI tools designed for modern analysts and researchers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURES.map(({ id, icon, title, description, tag }) => (
                        <FeatureCard key={id} id={id} icon={icon} title={title} description={description} tag={tag} />
                    ))}
                </div>
            </div>
        </section>

        {/* Component 3: NewsFeed + Component 4: mini CTA side-by-side */}
        <section className="py-24" aria-label="Updates and community">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <NewsFeed />
                <div className="flex flex-col items-start gap-4 p-10 bg-bgCard rounded-3xl border border-border shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accentGlow rounded-full blur-[80px] -z-10 group-hover:scale-150 transition-transform duration-700" />
                    <span className="px-3 py-1 rounded-full bg-success/20 text-success font-bold uppercase tracking-widest text-sm">Community</span>
                    <h2 className="text-3xl font-display font-bold text-textPrimary tracking-tight">Join our <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">community</span></h2>
                    <p className="text-lg text-textSecondary leading-relaxed mb-4">Gain insights, share custom analysis workflows, and help shape the future of document AI.</p>
                    <a href="/register" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all" id="home-community-cta">Join the platform →</a>
                </div>
            </div>
        </section>

        {/* Component 5: TestimonialCard grid */}
        <section className="py-24 bg-bgElevated border-t border-border/50" aria-labelledby="testimonials-heading">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16 gap-4">
                    <span className="px-3 py-1 rounded-full bg-accentGlow text-accent font-bold uppercase tracking-widest text-sm">Testimonials</span>
                    <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-display font-bold text-textPrimary tracking-tight">Loved by <span className="bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">developers</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map(({ id, quote, author, role, avatarSrc, initials }) => (
                        <TestimonialCard key={id} id={id} quote={quote} author={author} role={role} avatarSrc={avatarSrc} initials={initials} />
                    ))}
                </div>
            </div>
        </section>
    </main>
);

export default Home;
