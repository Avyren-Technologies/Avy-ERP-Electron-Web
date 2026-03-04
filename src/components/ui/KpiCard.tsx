import React from 'react';

interface KpiCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon?: React.ReactNode;
    accentColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
    title,
    value,
    trend,
    trendUp,
    icon,
    accentColor = 'var(--text-main)',
}) => {
    return (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500, margin: 0 }}>{title}</h4>
                {icon && <div style={{ color: accentColor }}>{icon}</div>}
            </div>

            <div style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-main)' }}>
                {value}
            </div>

            {trend && (
                <div style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: trendUp ? 'var(--accent-hr)' : 'var(--accent-vis)'
                }}>
                    {trendUp ? '↑' : '↓'} {trend}
                </div>
            )}
        </div>
    );
};
