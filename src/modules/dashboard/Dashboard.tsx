import React, { useState } from 'react';
import { KpiCard } from '../../components/ui/KpiCard';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Users, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

interface AlertItem {
    id: string;
    type: string;
    message: string;
    time: string;
}

export const Dashboard: React.FC = () => {
    const [alerts] = useState<AlertItem[]>([
        { id: '1', type: 'HR', message: 'Pending leave approvals: 5', time: '10:30 AM' },
        { id: '2', type: 'Maintenance', message: 'Machine M-01 due for PM today', time: '09:00 AM' },
        { id: '3', type: 'Visitor', message: 'VIP Visitor expected at 2:00 PM', time: '11:15 AM' }
    ]);

    const columns: Column<AlertItem>[] = [
        {
            key: 'type', header: 'Module', render: (row) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: row.type === 'HR' ? 'var(--accent-hr-dim)' : row.type === 'Maintenance' ? 'var(--accent-mach-dim)' : 'var(--accent-vis-dim)',
                    color: row.type === 'HR' ? 'var(--accent-hr)' : row.type === 'Maintenance' ? 'var(--accent-mach)' : 'var(--accent-vis)'
                }}>
                    {row.type}
                </span>
            )
        },
        { key: 'message', header: 'Critical Alert' },
        { key: 'time', header: 'Reported At' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <KpiCard title="Active Employees" value="142" trend="12 from last month" trendUp={true} icon={<Users size={20} />} accentColor="var(--accent-hr)" />
                <KpiCard title="Machines Under PM" value="3" trend="Critical status: 1" trendUp={false} icon={<AlertTriangle size={20} />} accentColor="var(--accent-mach)" />
                <KpiCard title="Current Visitors" value="12" trend="3 pre-registered" trendUp={true} icon={<Activity size={20} />} accentColor="var(--accent-vis)" />
                <KpiCard title="Overall Efficiency" value="94%" trend="Stable" trendUp={true} icon={<CheckCircle size={20} />} accentColor="var(--accent-primary)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>System Alerts</h3>
                <DataTable columns={columns} data={alerts} />
            </div>
        </div>
    );
};
