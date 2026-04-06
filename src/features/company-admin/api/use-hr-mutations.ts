import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi, type EmployeeStatus } from '@/lib/api/hr';
import { hrKeys } from './use-hr-queries';

// ── Departments ──

export function useCreateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => hrApi.createDepartment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.departments() });
        },
    });
}

export function useUpdateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            hrApi.updateDepartment(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.department(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.departments() });
        },
    });
}

export function useDeleteDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => hrApi.deleteDepartment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.departments() });
        },
    });
}

// ── Designations ──

export function useCreateDesignation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => hrApi.createDesignation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.designations() });
        },
    });
}

export function useUpdateDesignation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            hrApi.updateDesignation(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.designation(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.designations() });
        },
    });
}

export function useDeleteDesignation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => hrApi.deleteDesignation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.designations() });
        },
    });
}

// ── Grades ──

export function useCreateGrade() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => hrApi.createGrade(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.grades() });
        },
    });
}

export function useUpdateGrade() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            hrApi.updateGrade(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.grade(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.grades() });
        },
    });
}

export function useDeleteGrade() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => hrApi.deleteGrade(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.grades() });
        },
    });
}

// ── Employee Types ──

export function useCreateEmployeeType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => hrApi.createEmployeeType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employeeTypes() });
        },
    });
}

export function useUpdateEmployeeType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            hrApi.updateEmployeeType(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employeeType(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.employeeTypes() });
        },
    });
}

export function useDeleteEmployeeType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => hrApi.deleteEmployeeType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employeeTypes() });
        },
    });
}

// ── Cost Centres ──

export function useCreateCostCentre() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => hrApi.createCostCentre(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.costCentres() });
        },
    });
}

export function useUpdateCostCentre() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            hrApi.updateCostCentre(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.costCentre(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.costCentres() });
        },
    });
}

export function useDeleteCostCentre() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => hrApi.deleteCostCentre(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.costCentres() });
        },
    });
}

// ── Employees ──

export function useCreateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => hrApi.createEmployee(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employees() });
        },
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            hrApi.updateEmployee(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employee(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.employees() });
        },
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => hrApi.deleteEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employees() });
        },
    });
}

export function useUpdateEmployeeStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; status: EmployeeStatus; lastWorkingDate?: string; exitReason?: string }) =>
            hrApi.updateEmployeeStatus(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employee(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.employees() });
        },
    });
}

// ── Employee Sub-Resources: Nominees ──

export function useCreateNominee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) =>
            hrApi.createNominee(employeeId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.nominees(variables.employeeId) });
        },
    });
}

export function useUpdateNominee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, nomineeId, data }: { employeeId: string; nomineeId: string; data: any }) =>
            hrApi.updateNominee(employeeId, nomineeId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.nominees(variables.employeeId) });
        },
    });
}

export function useDeleteNominee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, nomineeId }: { employeeId: string; nomineeId: string }) =>
            hrApi.deleteNominee(employeeId, nomineeId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.nominees(variables.employeeId) });
        },
    });
}

// ── Employee Sub-Resources: Education ──

export function useCreateEducation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) =>
            hrApi.createEducation(employeeId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.education(variables.employeeId) });
        },
    });
}

export function useUpdateEducation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, educationId, data }: { employeeId: string; educationId: string; data: any }) =>
            hrApi.updateEducation(employeeId, educationId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.education(variables.employeeId) });
        },
    });
}

export function useDeleteEducation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, educationId }: { employeeId: string; educationId: string }) =>
            hrApi.deleteEducation(employeeId, educationId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.education(variables.employeeId) });
        },
    });
}

// ── Employee Sub-Resources: Previous Employment ──

export function useCreatePreviousEmployment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) =>
            hrApi.createPreviousEmployment(employeeId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.previousEmployment(variables.employeeId) });
        },
    });
}

export function useUpdatePreviousEmployment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, prevEmpId, data }: { employeeId: string; prevEmpId: string; data: any }) =>
            hrApi.updatePreviousEmployment(employeeId, prevEmpId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.previousEmployment(variables.employeeId) });
        },
    });
}

export function useDeletePreviousEmployment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, prevEmpId }: { employeeId: string; prevEmpId: string }) =>
            hrApi.deletePreviousEmployment(employeeId, prevEmpId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.previousEmployment(variables.employeeId) });
        },
    });
}

// ── Employee Sub-Resources: Documents ──

export function useCreateDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) =>
            hrApi.createDocument(employeeId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.documents(variables.employeeId) });
        },
    });
}

export function useUpdateDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, documentId, data }: { employeeId: string; documentId: string; data: any }) =>
            hrApi.updateDocument(employeeId, documentId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.documents(variables.employeeId) });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, documentId }: { employeeId: string; documentId: string }) =>
            hrApi.deleteDocument(employeeId, documentId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.documents(variables.employeeId) });
        },
    });
}

// ── Bulk Import ──

export function useBulkValidateEmployees() {
    return useMutation({
        mutationFn: ({ file, defaultPassword }: { file: File; defaultPassword: string }) =>
            hrApi.bulkValidate(file, defaultPassword),
    });
}

export function useBulkImportEmployees() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ rows, defaultPassword }: { rows: Record<string, unknown>[]; defaultPassword: string }) =>
            hrApi.bulkImport(rows, defaultPassword),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrKeys.employees() });
        },
    });
}

// ── Probation ──

export function useSubmitProbationReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
            hrApi.submitProbationReview(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hrKeys.probationDue() });
            queryClient.invalidateQueries({ queryKey: hrKeys.employee(variables.id) });
            queryClient.invalidateQueries({ queryKey: hrKeys.employees() });
        },
    });
}
