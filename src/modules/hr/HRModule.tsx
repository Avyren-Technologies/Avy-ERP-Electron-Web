import React, { useState } from 'react';
import { EmployeeDirectory } from './EmployeeDirectory';
import { AttendanceTrack } from './AttendanceTrack';
import { PayrollConfig } from './PayrollConfig';

export const HRModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState('directory');

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
                {['directory', 'attendance', 'payroll'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 0',
                            color: activeTab === tab ? 'var(--accent-hr)' : 'var(--text-muted)',
                            borderBottom: activeTab === tab ? '2px solid var(--accent-hr)' : '2px solid transparent',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                            fontSize: '15px'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '32px' }}>
                {activeTab === 'directory' && <EmployeeDirectory />}
                {activeTab === 'attendance' && <AttendanceTrack />}
                {activeTab === 'payroll' && <PayrollConfig />}
            </div>
        </div>
    );
};
