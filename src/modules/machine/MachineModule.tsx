import React, { useState } from 'react';
import { MachineRegistry } from './MachineRegistry';

export const MachineModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState('registry');

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
                {['registry', 'pm_schedule', 'breakdown', 'spares'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 0',
                            color: activeTab === tab ? 'var(--accent-mach)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-mach)' : '2px solid transparent',
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
                {activeTab === 'registry' && <MachineRegistry />}
                {activeTab === 'pm_schedule' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3>PM Scheduling & Calendar</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Module implementation pending.</p>
                    </div>
                )}
                {activeTab === 'breakdown' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3>Breakdown Management</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Module implementation pending.</p>
                    </div>
                )}
                {activeTab === 'spares' && (
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <h3>Spare Parts Inventory</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Module implementation pending.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
