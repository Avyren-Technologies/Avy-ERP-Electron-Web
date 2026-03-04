import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
    children,
    variant = 'secondary',
    size = 'md',
    fullWidth = false,
    style,
    ...props
}) => {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return 'var(--accent-primary)';
            case 'danger': return 'var(--accent-vis)';
            case 'secondary':
            default: return 'rgba(255, 255, 255, 0.1)';
        }
    };

    const getTextColor = () => {
        return variant === 'secondary' ? 'var(--text-main)' : '#fff';
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return '6px 12px';
            case 'lg': return '12px 24px';
            case 'md':
            default: return '8px 16px';
        }
    };

    return (
        <button
            style={{
                background: getBackgroundColor(),
                color: getTextColor(),
                border: variant === 'secondary' ? '1px solid var(--border-light)' : 'none',
                borderRadius: 'var(--radius-sm)',
                padding: getPadding(),
                fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: fullWidth ? '100%' : 'auto',
                backdropFilter: variant === 'secondary' ? 'blur(4px)' : 'none',
                ...style,
            }}
            onMouseOver={(e) => {
                if (variant === 'secondary') {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                } else {
                    e.currentTarget.style.opacity = '0.9';
                }
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = getBackgroundColor();
                e.currentTarget.style.opacity = '1';
            }}
            {...props}
        >
            {children}
        </button>
    );
};
