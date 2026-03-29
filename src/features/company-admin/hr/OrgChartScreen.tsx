import { useState, useMemo, useCallback } from "react";
import {
    Search,
    ChevronRight,
    ChevronDown,
    Users,
    Building2,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgChart } from "@/features/company-admin/api/use-hr-queries";
import { EmptyState } from "@/components/ui/EmptyState";

/* ── Types ── */

interface OrgNode {
    id: string;
    name: string;
    designation?: string;
    department?: string;
    employeeId?: string;
    imageUrl?: string;
    children?: OrgNode[];
    reportees?: OrgNode[];
}

/* ── Atoms ── */

function ProfileCircle({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initial = (name ?? "?")[0]?.toUpperCase();
    const sizeClasses = size === "lg" ? "w-14 h-14 text-xl" : size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-xs";
    return (
        <div className={cn(
            "rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center shrink-0 shadow-md shadow-primary-500/20",
            sizeClasses
        )}>
            <span className="font-bold text-white">{initial}</span>
        </div>
    );
}

/* ── Tree Node (Horizontal Layout) ── */

function TreeNode({
    node,
    expanded,
    onToggle,
    highlightId,
    level = 0,
}: {
    node: OrgNode;
    expanded: Set<string>;
    onToggle: (id: string) => void;
    highlightId: string | null;
    level?: number;
}) {
    const children = node.children ?? node.reportees ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isHighlighted = highlightId === node.id;

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <button
                onClick={() => hasChildren && onToggle(node.id)}
                className={cn(
                    "relative group rounded-2xl border px-5 py-4 min-w-[180px] max-w-[220px] transition-all text-left",
                    isHighlighted
                        ? "bg-primary-50 dark:bg-primary-900/30 border-primary-400 dark:border-primary-600 ring-2 ring-primary-300/50 shadow-lg shadow-primary-500/20"
                        : "bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md",
                    hasChildren && "cursor-pointer"
                )}
            >
                <div className="flex items-center gap-3">
                    <ProfileCircle name={node.name} size="md" />
                    <div className="min-w-0">
                        <p className="font-bold text-sm text-primary-950 dark:text-white truncate">{node.name}</p>
                        {node.designation && (
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{node.designation}</p>
                        )}
                        {node.department && (
                            <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400">
                                {node.department}
                            </span>
                        )}
                    </div>
                </div>
                {hasChildren && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm">
                        {isExpanded ? <ChevronDown size={12} className="text-primary-600" /> : <ChevronRight size={12} className="text-neutral-400" />}
                    </div>
                )}
            </button>

            {/* Connector + Children */}
            {hasChildren && isExpanded && (
                <>
                    <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />
                    <div className="relative flex gap-6">
                        {/* Horizontal connector line */}
                        {children.length > 1 && (
                            <div className="absolute top-0 left-[calc(50%-50%+90px)] right-[calc(50%-50%+90px)] h-px bg-neutral-200 dark:bg-neutral-700" style={{ left: `calc(${100 / (children.length * 2)}%)`, right: `calc(${100 / (children.length * 2)}%)` }} />
                        )}
                        {children.map((child: OrgNode) => (
                            <div key={child.id} className="flex flex-col items-center">
                                <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700" />
                                <TreeNode
                                    node={child}
                                    expanded={expanded}
                                    onToggle={onToggle}
                                    highlightId={highlightId}
                                    level={level + 1}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

/* ── Helpers ── */

function flattenNodes(nodes: OrgNode[]): OrgNode[] {
    const result: OrgNode[] = [];
    const walk = (list: OrgNode[]) => {
        for (const n of list) {
            result.push(n);
            const children = n.children ?? n.reportees ?? [];
            if (children.length) walk(children);
        }
    };
    walk(nodes);
    return result;
}

function findAncestors(nodes: OrgNode[], targetId: string): string[] {
    const ancestors: string[] = [];
    const walk = (list: OrgNode[], path: string[]): boolean => {
        for (const n of list) {
            const children = n.children ?? n.reportees ?? [];
            if (n.id === targetId) {
                ancestors.push(...path);
                return true;
            }
            if (children.length && walk(children, [...path, n.id])) return true;
        }
        return false;
    };
    walk(nodes, []);
    return ancestors;
}

/* ── Screen ── */

export function OrgChartScreen() {
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [highlightId, setHighlightId] = useState<string | null>(null);

    const { data, isLoading, isError } = useOrgChart();
    const orgData: OrgNode[] = useMemo(() => {
        const raw = (data as any)?.data ?? data ?? [];
        const arr = Array.isArray(raw) ? raw : raw?.tree ? [raw.tree] : raw?.root ? [raw.root] : [];

        // Transform backend format (firstName/lastName, nested objects) to frontend OrgNode format
        function transformNode(node: any): OrgNode {
            return {
                id: node.id,
                name: [node.firstName, node.lastName].filter(Boolean).join(' ') || node.name || 'Unknown',
                designation: node.designation?.name ?? node.designation ?? undefined,
                department: node.department?.name ?? node.department ?? undefined,
                employeeId: node.employeeId,
                imageUrl: node.profilePhotoUrl ?? node.imageUrl ?? undefined,
                reportees: (node.reportees ?? node.children ?? []).map(transformNode),
            };
        }

        return arr.map(transformNode);
    }, [data]);

    const allNodes = useMemo(() => flattenNodes(orgData), [orgData]);

    const handleToggle = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleSearch = (value: string) => {
        setSearch(value);
        if (!value.trim()) {
            setHighlightId(null);
            return;
        }
        const s = value.toLowerCase();
        const match = allNodes.find(
            (n) => n.name?.toLowerCase().includes(s) || n.employeeId?.toLowerCase().includes(s)
        );
        if (match) {
            setHighlightId(match.id);
            // Expand ancestors
            const ancestors = findAncestors(orgData, match.id);
            setExpanded((prev) => {
                const next = new Set(prev);
                ancestors.forEach((a) => next.add(a));
                return next;
            });
        } else {
            setHighlightId(null);
        }
    };

    // Auto-expand first level
    useMemo(() => {
        if (orgData.length > 0 && expanded.size === 0) {
            setExpanded(new Set(orgData.map((n) => n.id)));
        }
    }, [orgData]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Org Chart</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Visual organization hierarchy &middot; {allNodes.length} member{allNodes.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load org chart. Please try again.
                </div>
            )}

            {/* Chart */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                ) : orgData.length === 0 ? (
                    <EmptyState icon="list" title="No org data" message="Organization chart data is not available yet." />
                ) : (
                    <div className="overflow-x-auto p-8">
                        <div className="flex justify-center min-w-max">
                            {orgData.map((root) => (
                                <TreeNode
                                    key={root.id}
                                    node={root}
                                    expanded={expanded}
                                    onToggle={handleToggle}
                                    highlightId={highlightId}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
