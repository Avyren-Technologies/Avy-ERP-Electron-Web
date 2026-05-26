/** Stored in work order `closureEvidence` JSON (backend field name). */
export interface WorkOrderEvidenceItem {
    id: string;
    url: string;
    description?: string;
    fileName?: string;
    contentType?: string;
    uploadedAt: string;
}

export function isRemoteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

export function normalizeWorkOrderEvidence(wo: {
    closureEvidence?: unknown;
    evidence?: unknown;
} | null | undefined): WorkOrderEvidenceItem[] {
    const raw = wo?.closureEvidence ?? wo?.evidence;
    if (!Array.isArray(raw)) return [];
    return raw.map((item, index) => normalizeEvidenceItem(item, index));
}

function normalizeEvidenceItem(item: Record<string, unknown>, index: number): WorkOrderEvidenceItem {
    const url = String(item.url ?? item.fileUrl ?? item.key ?? "");
    const fileType = item.fileType != null ? String(item.fileType) : undefined;
    let contentType = item.contentType != null ? String(item.contentType) : undefined;
    if (!contentType && fileType === "image") {
        contentType = "image/jpeg";
    }

    return {
        id: String(item.id ?? `evidence-${index}`),
        url,
        description:
            (item.description != null ? String(item.description) : undefined) ??
            (item.caption != null ? String(item.caption) : undefined),
        fileName: item.fileName != null ? String(item.fileName) : undefined,
        contentType,
        uploadedAt: String(
            item.uploadedAt ?? item.capturedAt ?? item.createdAt ?? new Date().toISOString(),
        ),
    };
}

export function createEvidenceItem(params: {
    url: string;
    description?: string;
    fileName?: string;
    contentType?: string;
}): WorkOrderEvidenceItem {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        url: params.url,
        ...(params.description?.trim() ? { description: params.description.trim() } : {}),
        ...(params.fileName ? { fileName: params.fileName } : {}),
        ...(params.contentType ? { contentType: params.contentType } : {}),
        uploadedAt: new Date().toISOString(),
    };
}

export function isImageContentType(contentType?: string | null): boolean {
    if (!contentType) return false;
    if (contentType === "image") return true;
    return contentType.startsWith("image/");
}

export function isImageEvidenceItem(item: WorkOrderEvidenceItem): boolean {
    if (isImageContentType(item.contentType)) return true;
    const ref = item.url ?? "";
    if (isRemoteUrl(ref) && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(ref)) return true;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(ref);
}

export function getEvidenceDisplayName(item: WorkOrderEvidenceItem): string {
    return item.description?.trim() || item.fileName || "Evidence file";
}

export function canAddWorkOrderEvidence(status: string): boolean {
    return !["CLOSED", "CANCELLED", "REJECTED"].includes(status);
}
