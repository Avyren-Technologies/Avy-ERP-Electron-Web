import React, { useState } from 'react';
import { useHRStore } from '../../store/hrStore';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { GlassButton } from '../../components/ui/GlassButton';

export const AttendanceTrack: React.FC = () => {
    const { employees, attendance, markAttendance } = useHRStore();
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    // Derive attendance status for each employee for the selected date
    const attendanceView = employees.map(emp => {
        const record = attendance.find(a => a.empId === emp.id && a.date === selectedDate);
        return {
            empId: emp.id,
            name: emp.name,
            department: emp.department,
            status: record?.status || 'Absent',
            checkIn: record?.checkIn || '--',
            checkOut: record?.checkOut || '--',
            originalRecord: record
        };
    });

    const handleStatusChange = (empId: string, newStatus: "Present" | "Absent" | "Half Day" | "On Leave") => {
        const id = `${selectedDate}-${empId}`;
        markAttendance({
            id,
            empId,
            date: selectedDate,
            status: newStatus,
            checkIn: newStatus === 'Present' || newStatus === 'Half Day' ? '09:00' : undefined,
            checkOut: undefined
        });
    };

    const columns: Column<typeof attendanceView[0]>[] = [
        { key: 'empId', header: 'ID' },
        { key: 'name', header: 'Employee Name' },
        { key: 'department', header: 'Department' },
        { key: 'checkIn', header: 'Check In' },
        { key: 'checkOut', header: 'Check Out' },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <select
                    value={row.status}
                    onChange={(e) => handleStatusChange(row.empId, e.target.value as "Present" | "Absent" | "Half Day" | "On Leave")}
                    style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-strong)',
                        color: row.status === 'Present' ? 'var(--accent-hr)' : row.status === 'Absent' ? 'var(--accent-vis)' : 'var(--accent-primary)'
                    }}
                >
                    <option value="Present" style={{ color: 'initial' }}>Present</option>
                    <option value="Absent" style={{ color: 'initial' }}>Absent</option>
                    <option value="Half Day" style={{ color: 'initial' }}>Half Day</option>
                    <option value="On Leave" style={{ color: 'initial' }}>On Leave</option>
                </select>
            )
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px' }}>Daily Attendance</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-strong)',
                            color: 'white',
                            colorScheme: 'dark'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Total Employees</div>
                    <div style={{ fontSize: '24px', fontWeight: 600 }}>{employees.length}</div>
                </div>
                <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid var(--accent-hr)' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Present</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-hr)' }}>
                        {attendanceView.filter(a => a.status === 'Present').length}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid var(--accent-vis)' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Absent</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-vis)' }}>
                        {attendanceView.filter(a => a.status === 'Absent').length}
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid var(--accent-primary)' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>On Leave</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {attendanceView.filter(a => a.status === 'On Leave' || a.status === 'Half Day').length}
                    </div>
                </div>
            </div>

            <DataTable columns={columns} data={attendanceView} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <GlassButton variant="primary">Generate Report</GlassButton>
            </div>
        </div>
    );
};
