import React from 'react';

const NEWS = [
    { id: 1, category: 'Launch', title: 'PDFBrat v3.0 is here — rebuilt from the ground up', time: '2h ago', read: '3 min' },
    { id: 2, category: 'Guide', title: 'Best practices for building accessible React apps', time: '5h ago', read: '6 min' },
    { id: 3, category: 'Update', title: 'Performance improvements land in the core engine', time: '1d ago', read: '4 min' },
    { id: 4, category: 'Tips', title: 'Ten CSS tricks every developer should know in 2026', time: '2d ago', read: '5 min' },
];

/**
 * NewsFeed – a list of recent articles displayed on the Home page.
 */
const NewsFeed = () => (
    <section className="flex flex-col gap-6" aria-label="Latest news">
        <h2 className="text-2xl font-display font-bold text-textPrimary tracking-tight">Latest Updates</h2>
        <ul className="flex flex-col gap-4">
            {NEWS.map(({ id, category, title, time, read }) => (
                <li key={id} className="group p-5 rounded-xl border border-border bg-bgCard hover:border-accent/30 hover:bg-accentGlow/20 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-accentLight bg-accentGlow rounded">{category}</span>
                        <span className="text-sm font-medium text-textMuted">{time} · {read} read</span>
                    </div>
                    <p className="text-lg font-semibold text-textPrimary group-hover:text-accent transition-colors leading-snug">{title}</p>
                </li>
            ))}
        </ul>
    </section>
);

export default NewsFeed;
