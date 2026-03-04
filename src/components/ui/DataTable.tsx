import React from 'react';

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({ columns, data, onRowClick }: DataTableProps<T>) {
    return (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-light)' }}>
                            {columns.map((col, index) => (
                                <th key={String(col.key) + index} style={{ padding: '16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '14px' }}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                onClick={() => onRowClick && onRowClick(item)}
                                style={{
                                    borderBottom: '1px solid var(--border-light)',
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    transition: 'background 0.2s ease',
                                    background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = rowIndex % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)';
                                }}
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={String(col.key) + colIndex} style={{ padding: '16px', fontSize: '14px', color: 'var(--text-main)' }}>
                                        {col.render
                                            ? col.render(item)
                                            : (typeof item[col.key as keyof T] === 'string' || typeof item[col.key as keyof T] === 'number')
                                                ? item[col.key as keyof T] as unknown as React.ReactNode
                                                : null}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No data available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
