import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Machine {
    id: string;
    name: string;
    model: string;
    installationDate: string;
    status: 'Operational' | 'Under Maintenance' | 'Breakdown';
    lastPmDate: string;
    nextPmDate: string;
}

interface MachineState {
    machines: Machine[];
    addMachine: (machine: Omit<Machine, 'id'>) => void;
    updateMachine: (id: string, updates: Partial<Machine>) => void;
    deleteMachine: (id: string) => void;
}

export const useMachineStore = create<MachineState>()(
    persist(
        (set) => ({
            machines: [
                {
                    id: 'MAC-001',
                    name: 'CNC Lathe XT',
                    model: 'XT-2000',
                    installationDate: '2021-05-12',
                    status: 'Operational',
                    lastPmDate: '2023-09-10',
                    nextPmDate: '2023-10-10'
                },
                {
                    id: 'MAC-002',
                    name: 'Hydraulic Press 50T',
                    model: 'HP50T',
                    installationDate: '2020-11-20',
                    status: 'Under Maintenance',
                    lastPmDate: '2023-08-15',
                    nextPmDate: '2023-09-15'
                }
            ],
            addMachine: (machine) => set((state) => ({
                machines: [...state.machines, { ...machine, id: `MAC-${String(state.machines.length + 1).padStart(3, '0')}` }]
            })),
            updateMachine: (id, updates) => set((state) => ({
                machines: state.machines.map(m => m.id === id ? { ...m, ...updates } : m)
            })),
            deleteMachine: (id) => set((state) => ({
                machines: state.machines.filter(m => m.id !== id)
            }))
        }),
        {
            name: 'avy-machine-storage'
        }
    )
);
