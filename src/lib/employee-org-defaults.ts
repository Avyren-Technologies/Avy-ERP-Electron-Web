/**
 * Resolve default cost centre for an employee when a department is chosen.
 * Uses Department.costCentreCode (code match) and/or CostCentre.departmentId.
 */

export function resolveCostCentreIdForDepartment(
    department: { id: string; costCentreCode?: string | null } | undefined,
    costCentres: Array<{ id: string; code: string; departmentId?: string | null }>,
): string | null {
    if (!department?.id) return null;

    const byDept = costCentres.filter((c) => c.departmentId === department.id);
    if (byDept.length === 1) return byDept[0].id;

    if (department.costCentreCode) {
        const byCode = costCentres.find((c) => c.code === department.costCentreCode);
        if (byCode) return byCode.id;
    }

    if (byDept.length > 0) return byDept[0].id;
    return null;
}
