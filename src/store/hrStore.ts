import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Employee {
    id: string;
    name: string;
    role: string;
    department: string;
    status: 'Active' | 'On Leave' | 'Inactive';
    joinDate: string;
    email: string;
    phone: string;
}

export interface AttendanceRecord {
    id: string;
    empId: string;
    date: string;
    status: 'Present' | 'Absent' | 'Half Day' | 'On Leave';
    checkIn?: string;
    checkOut?: string;
    overtimeHours?: number;
}

interface HRState {
    employees: Employee[];
    attendance: AttendanceRecord[];
    addEmployee: (employee: Omit<Employee, 'id'>) => void;
    updateEmployee: (id: string, employee: Partial<Employee>) => void;
    deleteEmployee: (id: string) => void;
    markAttendance: (record: AttendanceRecord) => void;
}

export const useHRStore = create<HRState>()(
    persist(
        (set) => ({
            employees: [
                {
                    id: 'EMP-001',
                    name: 'Sarah Connor',
                    role: 'HR Manager',
                    department: 'Human Resources',
                    status: 'Active',
                    joinDate: '2023-01-15',
                    email: 'sarah@avyren.com',
                    phone: '+1 555-0101'
                },
                {
                    id: 'EMP-002',
                    name: 'John Smith',
                    role: 'Machine Operator',
                    department: 'Production',
                    status: 'Active',
                    joinDate: '2023-03-10',
                    email: 'john.smith@avyren.com',
                    phone: '+1 555-0102'
                },
                {
                    id: 'EMP-003',
                    name: 'Alice Johnson',
                    role: 'Maintenance Tech',
                    department: 'Maintenance',
                    status: 'On Leave',
                    joinDate: '2023-06-22',
                    email: 'alice.j@avyren.com',
                    phone: '+1 555-0103'
                }
            ],
            attendance: [
                {
                    id: '2023-10-25-EMP-001',
                    empId: 'EMP-001',
                    date: new Date().toISOString().split('T')[0],
                    status: 'Present',
                    checkIn: '09:00',
                    checkOut: '17:30'
                }
            ],
            addEmployee: (employeeData) => set((state) => ({
                employees: [
                    ...state.employees,
                    {
                        ...employeeData,
                        id: `EMP-${(state.employees.length + 1).toString().padStart(3, '0')}`
                    }
                ]
            })),
            updateEmployee: (id, data) => set((state) => ({
                employees: state.employees.map(emp => emp.id === id ? { ...emp, ...data } : emp)
            })),
            deleteEmployee: (id) => set((state) => ({
                employees: state.employees.filter(emp => emp.id !== id)
            })),
            markAttendance: (record) => set((state) => {
                const existingIndex = state.attendance.findIndex(a => a.id === record.id);
                if (existingIndex >= 0) {
                    const newAtt = [...state.attendance];
                    newAtt[existingIndex] = record;
                    return { attendance: newAtt };
                }
                return { attendance: [...state.attendance, record] };
            })
        }),
        {
            name: 'avy-hr-storage'
        }
    )
);
