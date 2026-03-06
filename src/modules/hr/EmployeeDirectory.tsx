import React, { useState } from 'react';
import { useHRStore, type Employee } from '../../store/hrStore';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { GlassButton } from '../../components/ui/GlassButton';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const EmployeeDirectory: React.FC = () => {
    const { employees, addEmployee, updateEmployee, deleteEmployee } = useHRStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Employee>>({
        name: '',
        role: '',
        department: 'Production',
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        email: '',
        phone: '',
    });

    const columns: Column<Employee>[] = [
        { key: 'id', header: 'Emp ID' },
        { key: 'name', header: 'Name', render: (row) => <div style={{ fontWeight: 500 }}>{row.name}</div> },
        { key: 'role', header: 'Role' },
        { key: 'department', header: 'Department' },
        {
            key: 'status',
            header: 'Status',
            render: (row) => (
                <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: row.status === 'Active' ? 'var(--accent-hr-dim)' : row.status === 'On Leave' ? 'var(--accent-mach-dim)' : 'var(--border-strong)',
                    color: row.status === 'Active' ? 'var(--accent-hr)' : row.status === 'On Leave' ? 'var(--accent-primary)' : 'var(--text-muted)'
                }}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'actions', header: 'Actions', render: (row) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        style={{ padding: '4px', color: 'var(--accent-primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); deleteEmployee(row.id); }}
                        style={{ padding: '4px', color: 'var(--accent-vis)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const handleEdit = (emp: Employee) => {
        setFormData(emp);
        setEditingId(emp.id);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({
            name: '', role: '', department: 'Production', status: 'Active',
            joinDate: new Date().toISOString().split('T')[0], email: '', phone: '',
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formData.name || !formData.role) return;

        if (editingId) {
            updateEmployee(editingId, formData);
        } else {
            addEmployee(formData as Omit<Employee, 'id'>);
        }
        setIsModalOpen(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px' }}>Employee Master</h3>
                <GlassButton variant="primary" onClick={handleAddNew}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Add Employee
                    </div>
                </GlassButton>
            </div>

            <DataTable columns={columns} data={employees} />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "Edit Employee" : "Add New Employee"}
                footerContent={
                    <>
                        <GlassButton onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                        <GlassButton variant="primary" onClick={handleSave}>Save</GlassButton>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-strong)', color: 'white' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Role *</label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, role: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-strong)', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Department</label>
                            <select
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-strong)', color: 'white' }}
                            >
                                <option value="Production">Production</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Human Resources">Human Resources</option>
                                <option value="Administration">Administration</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-strong)', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-strong)', color: 'white' }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
                            <select
                                onChange={e => setFormData({ ...formData, status: e.target.value as Employee["status"] })}
                            >
                                <option value="Active">Active</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Join Date</label>
                            <input
                                type="date"
                                value={formData.joinDate}
                                onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-strong)', color: 'white', colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
