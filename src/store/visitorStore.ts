import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Visitor {
    id: string;
    name: string;
    company: string;
    purpose: string;
    host: string;
    expectedTime: string;
    status: 'Pre-Registered' | 'Checked In' | 'Checked Out';
    badgeNumber?: string;
}

interface VisitorState {
    visitors: Visitor[];
    addVisitor: (v: Omit<Visitor, 'id'>) => void;
    updateVisitor: (id: string, updates: Partial<Visitor>) => void;
}

export const useVisitorStore = create<VisitorState>()(
    persist(
        (set) => ({
            visitors: [
                {
                    id: 'VIS-001',
                    name: 'Michael Scott',
                    company: 'Dunder Mifflin',
                    purpose: 'Sales Pitch',
                    host: 'Sarah Connor',
                    expectedTime: '2023-10-30T10:00',
                    status: 'Pre-Registered',
                    badgeNumber: 'V-1001'
                },
                {
                    id: 'VIS-002',
                    name: 'Dwight Schrute',
                    company: 'Schrute Farms',
                    purpose: 'Maintenance Consulting',
                    host: 'Alice Johnson',
                    expectedTime: '2023-10-25T14:00',
                    status: 'Checked In',
                    badgeNumber: 'V-1002'
                }
            ],
            addVisitor: (visitor) => set((state) => ({
                visitors: [...state.visitors, { ...visitor, id: `VIS-${String(state.visitors.length + 1).padStart(3, '0')}` }]
            })),
            updateVisitor: (id, updates) => set((state) => ({
                visitors: state.visitors.map(v => v.id === id ? { ...v, ...updates } : v)
            }))
        }),
        {
            name: 'avy-visitor-storage'
        }
    )
);
