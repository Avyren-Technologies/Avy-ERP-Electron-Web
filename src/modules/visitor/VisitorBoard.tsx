import React from 'react';
import { useVisitorStore, type Visitor } from '../../store/visitorStore';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { GlassButton } from '../../components/ui/GlassButton';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';

export const VisitorBoard: React.FC = () => {
    const fmt = useCompanyFormatter();
    const { visitors, updateVisitor } = useVisitorStore();

    const handleStatusToggle = (vis: Visitor) => {
        const newStatus = vis.status === 'Pre-Registered'
            ? 'Checked In'
            : vis.status === 'Checked In'
                ? 'Checked Out'
                : 'Pre-Registered';
        updateVisitor(vis.id, { status: newStatus });
    };

    const columns: Column<Visitor>[] = [
        { key: 'id', header: 'Access ID' },
        { key: 'name', header: 'Visitor Name', render: row => <div style={{ fontWeight: 500 }}>{row.name}</div> },
        { key: 'company', header: 'Company' },
        { key: 'host', header: 'Host' },
        { key: 'expectedTime', header: 'Expected Time', render: row => fmt.dateTime(row.expectedTime) },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: row.status === 'Checked In' ? 'var(--accent-hr-dim)' : row.status === 'Checked Out' ? 'var(--border-strong)' : 'var(--accent-vis-dim)',
                    color: row.status === 'Checked In' ? 'var(--accent-hr)' : row.status === 'Checked Out' ? 'var(--text-muted)' : 'var(--accent-vis)'
                }}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'actions', header: 'Action', render: row => (
                <GlassButton size="sm" onClick={(e) => { e.stopPropagation(); handleStatusToggle(row); }}>
                    {row.status === 'Pre-Registered' ? 'Check In' : row.status === 'Checked In' ? 'Check Out' : 'Reset'}
                </GlassButton>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px' }}>Visitor Tracking Board</h3>
                <GlassButton variant="primary">Pre-Register Visitor</GlassButton>
            </div>

            <DataTable columns={columns} data={visitors} />
        </div>
    );
};
