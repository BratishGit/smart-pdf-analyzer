import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const year = new Date().getFullYear();

    const sections = [
        {
            title: 'Product',
            links: [{ label: 'Home', to: '/' }, { label: 'About', to: '/about' }, { label: 'Contact', to: '/contact' }],
        },
        {
            title: 'Account',
            links: [{ label: 'Login', to: '/login' }, { label: 'Register', to: '/register' }],
        },
        {
            title: 'Company',
            links: [
                { label: 'Privacy Policy', to: '/' },
                { label: 'Terms of Service', to: '/' },
                { label: 'Cookie Policy', to: '/' },
            ],
        },
    ];

    return (
        <footer className="bg-bgCard border-t border-border mt-auto" role="contentinfo">
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                {/* Brand column */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-accent animate-pulse" aria-hidden="true" />
                        <span className="font-display font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-accentLight to-accent2">
                            PDFBrat
                        </span>
                    </div>
                    <p className="text-textSecondary text-sm max-w-sm leading-relaxed">
                        Unlocking document intelligence for modern professionals.
                    </p>
                    <div className="flex items-center gap-3 mt-2" aria-label="Social media links">
                        {['𝕏', '⬡', '◎'].map((icon, i) => (
                            <a key={i} href="/" className="w-10 h-10 rounded-full bg-bgElevated text-textSecondary flex items-center justify-center hover:bg-accent hover:text-white transition-colors" aria-label={`Social link ${i + 1}`}>
                                {icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Link columns */}
                {sections.map(({ title, links }) => (
                    <div key={title} className="flex flex-col gap-4">
                        <h4 className="font-display font-semibold text-textPrimary">{title}</h4>
                        <ul className="flex flex-col gap-3">
                            {links.map(({ label, to }) => (
                                <li key={label}>
                                    <Link to={to} className="text-sm text-textSecondary hover:text-accent transition-colors">{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t border-border py-6 bg-bgDark">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-textMuted">
                    <span>© {year} PDFBrat. All rights reserved.</span>
                    <span>Made with React and Tailwind CSS</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
