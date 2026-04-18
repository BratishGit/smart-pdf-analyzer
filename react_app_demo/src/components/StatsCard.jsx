import React from 'react';

/**
 * StatsCard – one of the reusable Home page components.
 * Props: icon, value, label, trend (optional)
 */
const StatsCard = ({ icon, value, label, trend, id }) => (
    <div className="flex items-center gap-4 bg-bgCard border border-border p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-accent/50 transition-all duration-300 group" id={id} role="article" aria-label={`${label}: ${value}`}>
        <div className="w-14 h-14 shrink-0 rounded-full bg-accentGlow flex items-center justify-center text-accent text-2xl group-hover:scale-110 transition-transform" aria-hidden="true">
            {icon || '📈'}
        </div>
        <div className="flex flex-col">
            <span className="font-display font-bold text-3xl text-textPrimary tracking-tight">{value}</span>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-textSecondary">{label}</span>
                {trend !== undefined && trend !== 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    </div>
);

export default StatsCard;
