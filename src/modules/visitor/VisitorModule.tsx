import React, { useState } from 'react';
import { VisitorBoard } from './VisitorBoard';

export const VisitorModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState('board');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Internal Tabs */}
            <div style={{
                display: 'flex',
                gap: '24px',
                borderBottom: '1px solid var(--border-light)',
                marginBottom: '24px',
                paddingBottom: '8px'
            }}>
                {['board', 'history', 'self_reg'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 0',
                            color: activeTab === tab ? 'var(--accent-vis)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-vis)' : '2px solid transparent',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                            fontSize: '15px'
                        }}
                    >
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
                {activeTab === 'board' && <VisitorBoard />}
                {activeTab === 'history' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3>Visitor History Logs</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Module implementation pending.</p>
                    </div>
                )}
                {activeTab === 'self_reg' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3>QR Self Registration Config</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Module implementation pending.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
