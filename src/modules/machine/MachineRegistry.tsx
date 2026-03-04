import React from 'react';
import { useMachineStore, type Machine } from '../../store/machineStore';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { GlassButton } from '../../components/ui/GlassButton';

export const MachineRegistry: React.FC = () => {
    const { machines } = useMachineStore();

    const columns: Column<Machine>[] = [
        { key: 'id', header: 'Machine ID' },
        { key: 'name', header: 'Machine Name', render: row => <div style={{ fontWeight: 500 }}>{row.name}</div> },
        { key: 'model', header: 'Model' },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: row.status === 'Operational' ? 'var(--accent-hr-dim)' : row.status === 'Under Maintenance' ? 'var(--accent-mach-dim)' : 'var(--accent-vis-dim)',
                    color: row.status === 'Operational' ? 'var(--accent-hr)' : row.status === 'Under Maintenance' ? 'var(--accent-mach)' : 'var(--accent-vis)'
                }}>
                    {row.status}
                </span>
            )
        },
        { key: 'lastPmDate', header: 'Last PM' },
        { key: 'nextPmDate', header: 'Next PM Due' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px' }}>Machine Master Registry</h3>
                <GlassButton variant="primary">Add Machine</GlassButton>
            </div>

            <DataTable columns={columns} data={machines} />
        </div>
    );
};
