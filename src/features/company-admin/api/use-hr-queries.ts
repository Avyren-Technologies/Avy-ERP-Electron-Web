import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { hrApi } from '@/lib/api/hr';

/** Page size for employee pickers (assign modals, async selects). */
export const EMPLOYEE_PICKER_PAGE_SIZE = 25;

/** Page size for the reusable EmployeePicker dropdown component. */
export const EMPLOYEE_DROPDOWN_PAGE_SIZE = 50;

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
    employeesDropdown: (params?: {
        search?: string;
        status?: 'ACTIVE' | 'ALL';
        departmentId?: string;
        locationId?: string;
    }) => {
        if (!params) return [...hrKeys.all, 'employees-dropdown'] as const;
        const filtered: Record<string, string> = {};
        if (params.search !== undefined) filtered.search = params.search;
        if (params.status !== undefined) filtered.status = params.status;
        if (params.departmentId !== undefined) filtered.departmentId = params.departmentId;
        if (params.locationId !== undefined) filtered.locationId = params.locationId;
        if (Object.keys(filtered).length === 0) return [...hrKeys.all, 'employees-dropdown'] as const;
        return [...hrKeys.all, 'employees-dropdown', filtered] as const;
    },
    employee: (id: string) => [...hrKeys.all, 'employee', id] as const,
    nominees: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'nominees'] as const,
    education: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'education'] as const,
    previousEmployment: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'previous-employment'] as const,
    documents: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'documents'] as const,
    timeline: (employeeId: string) => [...hrKeys.all, 'employee', employeeId, 'timeline'] as const,
    probationDue: () => [...hrKeys.all, 'probation-due'] as const,
    orgChart: () => [...hrKeys.all, 'org-chart'] as const,
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

/** Infinite employee list for pickers — scroll/search loads additional pages. */
export function useEmployeesInfinite(search: string, enabled = true) {
    const trimmed = search.trim();
    return useInfiniteQuery({
        queryKey: [...hrKeys.all, 'employees-infinite', trimmed] as const,
        queryFn: ({ pageParam }) =>
            hrApi.listEmployees({
                page: pageParam,
                limit: EMPLOYEE_PICKER_PAGE_SIZE,
                search: trimmed || undefined,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const meta = lastPage?.meta;
            if (!meta) return undefined;
            return meta.page < meta.totalPages ? meta.page + 1 : undefined;
        },
        enabled,
    });
}

/**
 * Infinite paginated dropdown for the reusable EmployeePicker.
 * Uses the lightweight `/hr/employees/dropdown` endpoint.
 */
export function useEmployeesDropdown(
    params: { search?: string; status?: 'ACTIVE' | 'ALL'; departmentId?: string; locationId?: string } = {},
    enabled: boolean = true,
) {
    return useInfiniteQuery({
        queryKey: hrKeys.employeesDropdown(params),
        queryFn: ({ pageParam = 1 }) =>
            hrApi.listEmployeesDropdown({ ...params, page: pageParam as number, limit: EMPLOYEE_DROPDOWN_PAGE_SIZE }),
        initialPageParam: 1,
        getNextPageParam: (last) =>
            last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
        staleTime: 60 * 1000,
        enabled,
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

// ── Probation ──

export function useProbationDue() {
    return useQuery({
        queryKey: hrKeys.probationDue(),
        queryFn: () => hrApi.listProbationDue(),
    });
}

// ── Org Chart ──

export function useOrgChart() {
    return useQuery({
        queryKey: hrKeys.orgChart(),
        queryFn: () => hrApi.getOrgChart(),
    });
}

// ── Bulk Import ──

export async function downloadBulkEmployeeTemplate() {
    const blob = await hrApi.downloadBulkTemplate();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Employee_Import_Template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
