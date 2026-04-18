import React from 'react';
import Avatar from './Avatar';

/**
 * TestimonialCard – user quote card, used on the Home page.
 */
const TestimonialCard = ({ quote, author, role, avatarSrc, initials, id }) => (
    <div className="relative group bg-bgCard border border-border p-8 rounded-2xl flex flex-col justify-between hover:border-accent/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300" id={id} role="article" aria-label={`Testimonial from ${author}`}>
        <div className="absolute top-6 right-8 text-6xl text-accentGlow font-display leading-none opacity-50 group-hover:scale-110 transition-transform" aria-hidden="true">"</div>
        <p className="text-textPrimary text-lg leading-relaxed relative z-10 mb-8 italic">"{quote}"</p>
        <div className="flex items-center gap-4 relative z-10">
            <Avatar src={avatarSrc} initials={initials} alt={author} size="md" />
            <div className="flex flex-col">
                <span className="font-display font-bold text-textPrimary">{author}</span>
                <span className="text-sm font-medium text-textSecondary">{role}</span>
            </div>
        </div>
    </div>
);

export default TestimonialCard;
