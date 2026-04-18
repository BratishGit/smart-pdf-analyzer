import React from 'react';

/**
 * Avatar – Reusable avatar component.
 * Renders an image if `src` is provided, otherwise shows initials fallback.
 *
 * @param {string}  src       – Image URL
 * @param {string}  initials  – Fallback text (e.g. "BD")
 * @param {string}  alt       – Alt text for accessibility
 * @param {string}  size      – 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 * @param {string}  className – Extra CSS classes
 * @param {boolean} glow      – Adds a glow ring around the avatar
 */
const Avatar = ({ src, name = '', alt = '', size = 'md', className = '', glow = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl'
  };

  let initials = '?';
  if (name) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      initials = (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else if (words.length === 1 && words[0].length === 1) {
      initials = words[0].toUpperCase();
    }
  }

  const classes = [
    'rounded-full flex items-center justify-center shrink-0 object-cover bg-accentGlow text-accent font-bold tracking-wider border-2 border-transparent transition-all',
    sizeClasses[size] || sizeClasses.md,
    glow ? 'ring-4 ring-accentGlow shadow-lg shadow-accentGlow hover:scale-105' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true" title={name}>
      {src ? (
        <img src={src} alt={alt || name} className="w-full h-full object-cover rounded-full" loading="lazy" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
