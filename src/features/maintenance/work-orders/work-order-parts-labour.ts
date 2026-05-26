import { DateTime } from "luxon";

export type EmployeeOption = {
    value: string;
    label: string;
    sublabel?: string;
};

export type AddPartFormState = {
    partName: string;
    partNumber: string;
    quantity: string;
    unitCost: string;
};

export type LogLabourFormState = {
    technicianId: string;
    startTime: string;
    endTime: string;
    hours: string;
    hourlyRate: string;
    notes: string;
};

export function resolveTechnicianName(
    technicianId: string | null | undefined,
    employees: EmployeeOption[],
): string {
    if (!technicianId) return "---";
    const match = employees.find((e) => e.value === technicianId);
    return match?.label ?? technicianId;
}

export function computeLabourLineCost(log: {
    totalCost?: unknown;
    hours?: unknown;
    hourlyRate?: unknown;
}): number {
    const total = Number(log.totalCost ?? 0);
    if (total > 0) return total;
    const hours = Number(log.hours ?? 0);
    const rate = Number(log.hourlyRate ?? 0);
    return hours > 0 && rate > 0 ? Math.round(hours * rate * 100) / 100 : 0;
}

export function computePartLineCost(part: {
    totalCost?: unknown;
    quantity?: unknown;
    unitCost?: unknown;
}): number {
    const total = Number(part.totalCost ?? 0);
    if (total > 0) return total;
    return Number(part.quantity ?? 0) * Number(part.unitCost ?? 0);
}

export function defaultDatetimeLocalValue(timezone: string): string {
    return DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd'T'HH:mm");
}

export function formatElapsedTimer(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function hoursFromElapsedMs(ms: number): string {
    return (ms / 3600000).toFixed(2);
}

export function datetimeLocalToIso(localValue: string, timezone: string): string | null {
    const trimmed = localValue.trim();
    if (!trimmed) return null;
    const dt = DateTime.fromFormat(trimmed, "yyyy-MM-dd'T'HH:mm", { zone: timezone });
    if (!dt.isValid) return null;
    return dt.toUTC().toISO();
}

export function validateAddPartForm(form: AddPartFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.partName.trim()) errors.partName = "Part name is required";
    const qty = Number(form.quantity);
    if (!form.quantity.trim() || Number.isNaN(qty) || qty <= 0) {
        errors.quantity = "Valid quantity is required";
    }
    if (form.unitCost.trim()) {
        const cost = Number(form.unitCost);
        if (Number.isNaN(cost) || cost < 0) errors.unitCost = "Enter a valid unit cost";
    }
    return errors;
}

export function buildAddPartsPayload(form: AddPartFormState): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        partName: form.partName.trim(),
        quantity: Number(form.quantity),
    };
    if (form.partNumber.trim()) payload.partNumber = form.partNumber.trim();
    if (form.unitCost.trim() && !Number.isNaN(Number(form.unitCost))) {
        payload.unitCost = Number(form.unitCost);
    }
    return payload;
}

export function validateLogLabourForm(
    form: LogLabourFormState,
    timezone: string,
): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!form.technicianId.trim()) errors.technicianId = "Technician is required";
    if (!datetimeLocalToIso(form.startTime, timezone)) {
        errors.startTime = "Start time is required";
    }
    const hours = Number(form.hours);
    if (!form.hours.trim() || Number.isNaN(hours) || hours <= 0) {
        errors.hours = "Valid hours are required";
    }
    if (form.hourlyRate.trim()) {
        const rate = Number(form.hourlyRate);
        if (Number.isNaN(rate) || rate < 0) errors.hourlyRate = "Enter a valid hourly rate";
    }
    return errors;
}

export function buildLogLabourPayload(
    form: LogLabourFormState,
    timezone: string,
): Record<string, unknown> | null {
    const startIso = datetimeLocalToIso(form.startTime, timezone);
    if (!startIso || !form.technicianId.trim()) return null;

    const payload: Record<string, unknown> = {
        technicianId: form.technicianId,
        startTime: startIso,
        hours: Number(form.hours),
    };

    const endIso = datetimeLocalToIso(form.endTime, timezone);
    if (endIso) payload.endTime = endIso;
    if (form.hourlyRate.trim() && !Number.isNaN(Number(form.hourlyRate))) {
        payload.hourlyRate = Number(form.hourlyRate);
    }
    if (form.notes.trim()) payload.notes = form.notes.trim();

    return payload;
}

export function emptyLogLabourForm(timezone: string): LogLabourFormState {
    return {
        technicianId: "",
        startTime: defaultDatetimeLocalValue(timezone),
        endTime: "",
        hours: "",
        hourlyRate: "",
        notes: "",
    };
}
