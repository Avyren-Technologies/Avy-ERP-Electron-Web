import React, { useState } from 'react';
import { useHRStore } from '../../store/hrStore';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { GlassButton } from '../../components/ui/GlassButton';

export const PayrollConfig: React.FC = () => {
    const { employees } = useHRStore();
    const [payrollData, setPayrollData] = useState<Record<string, { baseSalary: number, incentiveRate: number }>>({});

    const handleDataChange = (empId: string, field: 'baseSalary' | 'incentiveRate', value: number) => {
        setPayrollData(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId] || { baseSalary: 0, incentiveRate: 0 },
                [field]: value
            }
        }));
    };

    const columns: Column<typeof employees[0]>[] = [
        { key: 'id', header: 'Emp ID' },
        { key: 'name', header: 'Employee' },
        { key: 'role', header: 'Role' },
        {
            key: 'baseSalary',
            header: 'Base Salary ($)',
            render: (row) => (
                <input
                    type="number"
                    value={payrollData[row.id]?.baseSalary || ''}
                    placeholder="Enter Amount"
                    onChange={(e) => handleDataChange(row.id, 'baseSalary', Number(e.target.value))}
                    style={{
                        width: '120px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-strong)',
                        color: 'white'
                    }}
                />
            )
        },
        {
            key: 'incentiveRate',
            header: 'Incentive Rate (%)',
            render: (row) => (
                <input
                    type="number"
                    value={payrollData[row.id]?.incentiveRate || ''}
                    placeholder="e.g. 5"
                    onChange={(e) => handleDataChange(row.id, 'incentiveRate', Number(e.target.value))}
                    style={{
                        width: '100px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--border-strong)',
                        color: 'white'
                    }}
                />
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px' }}>Payroll & Incentives</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '13px' }}>Configure base salaries and piece-rate incentives for the production team.</p>
                </div>
                <GlassButton variant="primary">Save Configuration</GlassButton>
            </div>

            <DataTable columns={columns} data={employees} />
        </div>
    );
};
