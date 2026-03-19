import { useQuery } from '@tanstack/react-query';
import { hrApi } from '@/lib/api/hr';

export const hrKeys = {
    all: ['hr'] as const,
    departments: () => [...hrKeys.all, 'departments'] as const,
    department: (id: string) => [...hrKeys.all, 'department', id] as const,
    designations: () => [...hrKeys.all, 'designations'] as const,
    designation: (id: string) => [...hrKeys.all, 'designation', id] as const,
    grades: () => [...hrKeys.all, 'grades'] as const,
    grade: (id: string) => [...hrKeys.all, 'grade', id] as const,
    employeeTypes: () => [...hrKeys.all, 'employee-types'] as const,
    employeeType: (id: string) => [...hrKeys.all, 'employee-type', id] as const,
    costCentres: () => [...hrKeys.all, 'cost-centres'] as const,
    costCentre: (id: string) => [...hrKeys.all, 'cost-centre', id] as const,
    employees: (params?: Record<string, unknown>) => [...hrKeys.all, 'employees', params] as const,
    employee: (id: string) => [...hrKeys.all, 'employee', id] as const,
    nominees: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'nominees'] as const,
    education: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'education'] as const,
    previousEmployment: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'previous-employment'] as const,
    documents: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'documents'] as const,
    timeline: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'timeline'] as const,
};

// ── Departments ──

export function useDepartments() {
    return useQuery({
        queryKey: hrKeys.departments(),
        queryFn: () => hrApi.listDepartments(),
    });
}

export function useDepartment(id: string) {
    return useQuery({
        queryKey: hrKeys.department(id),
        queryFn: () => hrApi.getDepartment(id),
        enabled: !!id,
    });
}

// ── Designations ──

export function useDesignations() {
    return useQuery({
        queryKey: hrKeys.designations(),
        queryFn: () => hrApi.listDesignations(),
    });
}

export function useDesignation(id: string) {
    return useQuery({
        queryKey: hrKeys.designation(id),
        queryFn: () => hrApi.getDesignation(id),
        enabled: !!id,
    });
}

// ── Grades ──

export function useGrades() {
    return useQuery({
        queryKey: hrKeys.grades(),
        queryFn: () => hrApi.listGrades(),
    });
}

export function useGrade(id: string) {
    return useQuery({
        queryKey: hrKeys.grade(id),
        queryFn: () => hrApi.getGrade(id),
        enabled: !!id,
    });
}

// ── Employee Types ──

export function useEmployeeTypes() {
    return useQuery({
        queryKey: hrKeys.employeeTypes(),
        queryFn: () => hrApi.listEmployeeTypes(),
    });
}

export function useEmployeeType(id: string) {
    return useQuery({
        queryKey: hrKeys.employeeType(id),
        queryFn: () => hrApi.getEmployeeType(id),
        enabled: !!id,
    });
}

// ── Cost Centres ──

export function useCostCentres() {
    return useQuery({
        queryKey: hrKeys.costCentres(),
        queryFn: () => hrApi.listCostCentres(),
    });
}

export function useCostCentre(id: string) {
    return useQuery({
        queryKey: hrKeys.costCentre(id),
        queryFn: () => hrApi.getCostCentre(id),
        enabled: !!id,
    });
}

// ── Employees ──

export function useEmployees(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: hrKeys.employees(params),
        queryFn: () => hrApi.listEmployees(params as any),
    });
}

export function useEmployee(id: string) {
    return useQuery({
        queryKey: hrKeys.employee(id),
        queryFn: () => hrApi.getEmployee(id),
        enabled: !!id,
    });
}

// ── Employee Sub-Resources ──

export function useEmployeeNominees(employeeId: string) {
    return useQuery({
        queryKey: hrKeys.nominees(employeeId),
        queryFn: () => hrApi.listNominees(employeeId),
        enabled: !!employeeId,
    });
}

export function useEmployeeEducation(employeeId: string) {
    return useQuery({
        queryKey: hrKeys.education(employeeId),
        queryFn: () => hrApi.listEducation(employeeId),
        enabled: !!employeeId,
    });
}

export function useEmployeePreviousEmployment(employeeId: string) {
    return useQuery({
        queryKey: hrKeys.previousEmployment(employeeId),
        queryFn: () => hrApi.listPreviousEmployment(employeeId),
        enabled: !!employeeId,
    });
}

export function useEmployeeDocuments(employeeId: string) {
    return useQuery({
        queryKey: hrKeys.documents(employeeId),
        queryFn: () => hrApi.listDocuments(employeeId),
        enabled: !!employeeId,
    });
}

export function useEmployeeTimeline(employeeId: string) {
    return useQuery({
        queryKey: hrKeys.timeline(employeeId),
        queryFn: () => hrApi.listTimeline(employeeId),
        enabled: !!employeeId,
    });
}
