import React from 'react';

/**
 * FeatureCard – showcase a product feature on the Home page.
 * Props: icon, title, description, tag (optional)
 */
const FeatureCard = ({ icon, title, description, tag, id }) => (
    <div className="group relative bg-bgCard border border-border rounded-2xl p-6 transition-all duration-300 hover:border-accent hover:shadow-[0_15px_50px_rgba(79,70,229,0.15)] hover:-translate-y-1" id={id} role="article">
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accentGlow text-accent flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform" aria-hidden="true">
                {icon || '❖'}
            </div>
            {tag && <span className="px-3 py-1 bg-accentGlow text-accentLight text-xs font-bold uppercase tracking-wider rounded-full">{tag}</span>}
        </div>
        <h3 className="font-display font-semibold text-xl text-textPrimary mb-2 group-hover:text-accent transition-colors">{title}</h3>
        <p className="text-textSecondary text-sm leading-relaxed mb-4">{description}</p>
        <div className="absolute bottom-6 right-6 opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accentLight font-bold" aria-hidden="true">
            →
        </div>
    </div>
);

export default FeatureCard;
