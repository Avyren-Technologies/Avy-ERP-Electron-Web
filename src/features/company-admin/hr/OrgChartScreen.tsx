import {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
    type MouseEvent as ReactMouseEvent,
    type WheelEvent as ReactWheelEvent,
} from "react";
import {
    Search,
    ZoomIn,
    ZoomOut,
    Users,
    Loader2,
    Maximize2,
    ChevronDown,
    ChevronRight,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgChart } from "@/features/company-admin/api/use-hr-queries";
import { EmptyState } from "@/components/ui/EmptyState";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Types
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface OrgNode {
    id: string;
    name: string;
    designation?: string;
    department?: string;
    employeeId?: string;
    imageUrl?: string;
    reportees: OrgNode[];
}

interface DeptGroup {
    department: string;
    colorIndex: number;
    members: OrgNode[];
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Constants
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const DEPT_COLORS = [
    { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", line: "#059669", dot: "#10B981" },
    { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", line: "#0D9488", dot: "#14B8A6" },
    { bg: "bg-primary-100 dark:bg-primary-900/30", text: "text-primary-700 dark:text-primary-300", border: "border-primary-200 dark:border-primary-800", line: "#4338CA", dot: "#6366F1" },
    { bg: "bg-accent-100 dark:bg-accent-900/30", text: "text-accent-700 dark:text-accent-300", border: "border-accent-200 dark:border-accent-800", line: "#7C3AED", dot: "#8B5CF6" },
    { bg: "bg-danger-100 dark:bg-danger-900/30", text: "text-danger-700 dark:text-danger-300", border: "border-danger-200 dark:border-danger-800", line: "#DC2626", dot: "#EF4444" },
    { bg: "bg-warning-100 dark:bg-warning-900/30", text: "text-warning-700 dark:text-warning-300", border: "border-warning-200 dark:border-warning-800", line: "#D97706", dot: "#F59E0B" },
    { bg: "bg-info-100 dark:bg-info-900/30", text: "text-info-700 dark:text-info-300", border: "border-info-200 dark:border-info-800", line: "#2563EB", dot: "#3B82F6" },
] as const;

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Helpers
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function transformNode(node: any): OrgNode {
    return {
        id: node.id,
        name: [node.firstName, node.lastName].filter(Boolean).join(" ") || node.name || "Unknown",
        designation: node.designation?.name ?? node.designation ?? undefined,
        department: node.department?.name ?? node.department ?? undefined,
        employeeId: node.employeeId,
        imageUrl: node.profilePhotoUrl ?? node.imageUrl ?? undefined,
        reportees: (node.reportees ?? node.children ?? []).map(transformNode),
    };
}

function flattenNodes(nodes: OrgNode[]): OrgNode[] {
    const result: OrgNode[] = [];
    const walk = (list: OrgNode[]) => {
        for (const n of list) {
            result.push(n);
            if (n.reportees.length) walk(n.reportees);
        }
    };
    walk(nodes);
    return result;
}

function findAncestors(nodes: OrgNode[], targetId: string): string[] {
    const ancestors: string[] = [];
    const walk = (list: OrgNode[], path: string[]): boolean => {
        for (const n of list) {
            if (n.id === targetId) {
                ancestors.push(...path);
                return true;
            }
            if (n.reportees.length && walk(n.reportees, [...path, n.id])) return true;
        }
        return false;
    };
    walk(nodes, []);
    return ancestors;
}

/** Group direct reports of a root node by department */
function groupByDepartment(reportees: OrgNode[]): DeptGroup[] {
    const map = new Map<string, OrgNode[]>();
    for (const emp of reportees) {
        const dept = emp.department || "Unassigned";
        if (!map.has(dept)) map.set(dept, []);
        map.get(dept)!.push(emp);
    }
    const groups: DeptGroup[] = [];
    let idx = 0;
    for (const [department, members] of map) {
        groups.push({ department, colorIndex: idx % DEPT_COLORS.length, members });
        idx++;
    }
    return groups;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (name[0] ?? "?").toUpperCase();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Avatar Component
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function Avatar({
    name,
    imageUrl,
    size = "md",
}: {
    name: string;
    imageUrl?: string;
    size?: "sm" | "md" | "lg";
}) {
    const sizeMap = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-lg",
    };
    const initials = getInitials(name);

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={cn(
                    "rounded-full object-cover ring-2 ring-white dark:ring-neutral-800 shadow-md",
                    sizeMap[size]
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                "rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-md shrink-0",
                sizeMap[size]
            )}
        >
            <span className="font-bold text-white leading-none">{initials}</span>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Root Node Card (CEO/Founder)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function RootNodeCard({
    node,
    isHighlighted,
}: {
    node: OrgNode;
    isHighlighted: boolean;
}) {
    return (
        <div className="flex flex-col items-center">
            <div
                id={`org-node-${node.id}`}
                className={cn(
                    "relative flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border transition-all duration-200",
                    "bg-white dark:bg-neutral-900 shadow-lg shadow-neutral-900/5 dark:shadow-black/20",
                    isHighlighted
                        ? "border-primary-400 dark:border-primary-500 ring-2 ring-primary-300/50 dark:ring-primary-500/30 shadow-primary-500/20"
                        : "border-neutral-200/80 dark:border-neutral-700/80 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800"
                )}
            >
                <Avatar name={node.name} imageUrl={node.imageUrl} size="lg" />
                <div className="text-center">
                    <p className="font-bold text-base text-primary-950 dark:text-white leading-tight">
                        {node.name}
                    </p>
                    {node.designation && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {node.designation}
                        </p>
                    )}
                </div>
                {node.department && (
                    <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50">
                        {node.department}
                    </span>
                )}
            </div>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Employee Card (under department groups)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function EmployeeCard({
    node,
    isHighlighted,
}: {
    node: OrgNode;
    isHighlighted: boolean;
}) {
    return (
        <div
            id={`org-node-${node.id}`}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 min-w-[180px] max-w-[240px]",
                "bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md",
                isHighlighted
                    ? "border-primary-400 dark:border-primary-500 ring-2 ring-primary-300/50 dark:ring-primary-500/30 shadow-primary-500/20"
                    : "border-neutral-200/60 dark:border-neutral-800 hover:border-primary-200 dark:hover:border-primary-700"
            )}
        >
            <Avatar name={node.name} imageUrl={node.imageUrl} size="sm" />
            <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-primary-950 dark:text-white truncate leading-tight">
                    {node.name}
                </p>
                {node.designation && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {node.designation}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Sub-Tree (recursive — for employees with their own reportees)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function SubTree({
    node,
    highlightId,
    expanded,
    onToggle,
    depth,
}: {
    node: OrgNode;
    highlightId: string | null;
    expanded: Set<string>;
    onToggle: (id: string) => void;
    depth: number;
}) {
    const hasReportees = node.reportees.length > 0;
    const isExpanded = expanded.has(node.id);
    const isHighlighted = highlightId === node.id;

    return (
        <div className="flex flex-col items-center">
            {/* Employee card */}
            <div className="relative">
                <EmployeeCard node={node} isHighlighted={isHighlighted} />
                {hasReportees && (
                    <button
                        onClick={() => onToggle(node.id)}
                        className={cn(
                            "absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center",
                            "bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600",
                            "shadow-sm hover:shadow transition-all z-10 cursor-pointer"
                        )}
                    >
                        {isExpanded ? (
                            <ChevronDown size={10} className="text-primary-600 dark:text-primary-400" />
                        ) : (
                            <ChevronRight size={10} className="text-neutral-400" />
                        )}
                    </button>
                )}
            </div>

            {/* Sub-reportees */}
            {hasReportees && isExpanded && (
                <div className="flex flex-col items-center mt-1">
                    {/* Vertical connector from parent */}
                    <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />
                    {/* Junction dot */}
                    <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0" />

                    {node.reportees.length === 1 ? (
                        <div className="flex flex-col items-center">
                            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
                            <SubTree
                                node={node.reportees[0]}
                                highlightId={highlightId}
                                expanded={expanded}
                                onToggle={onToggle}
                                depth={depth + 1}
                            />
                        </div>
                    ) : (
                        <div className="relative flex gap-6 pt-4">
                            {/* Horizontal connector between children */}
                            <div
                                className="absolute top-0 h-px bg-neutral-300 dark:bg-neutral-600"
                                style={{
                                    left: `calc(${100 / (node.reportees.length * 2)}%)`,
                                    right: `calc(${100 / (node.reportees.length * 2)}%)`,
                                }}
                            />
                            {node.reportees.map((child) => (
                                <div key={child.id} className="flex flex-col items-center">
                                    {/* Vertical drop to child */}
                                    <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 -mt-4" />
                                    <SubTree
                                        node={child}
                                        highlightId={highlightId}
                                        expanded={expanded}
                                        onToggle={onToggle}
                                        depth={depth + 1}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Department Column
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function DepartmentColumn({
    group,
    highlightId,
    expanded,
    onToggle,
    isCollapsed,
    onToggleCollapse,
}: {
    group: DeptGroup;
    highlightId: string | null;
    expanded: Set<string>;
    onToggle: (id: string) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}) {
    const color = DEPT_COLORS[group.colorIndex];

    return (
        <div className="flex flex-col items-center">
            {/* Vertical line from horizontal connector to department pill */}
            <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />

            {/* Junction dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0 -mb-px" />

            {/* Vertical line from dot to pill */}
            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />

            {/* Department pill */}
            <button
                onClick={onToggleCollapse}
                className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer",
                    "hover:shadow-md",
                    color.bg,
                    color.text,
                    color.border
                )}
            >
                {group.department}
                <span className="opacity-60 text-[10px]">({group.members.length})</span>
                {isCollapsed ? (
                    <ChevronRight size={12} className="opacity-60" />
                ) : (
                    <ChevronDown size={12} className="opacity-60" />
                )}
            </button>

            {/* Employee cards under department */}
            {!isCollapsed && (
                <div className="flex flex-col items-center mt-0">
                    {/* Vertical line from pill to cards area */}
                    <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600" />

                    {/* Junction dot */}
                    <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0" />

                    {group.members.length === 1 ? (
                        <div className="flex flex-col items-center">
                            <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600" />
                            <SubTree
                                node={group.members[0]}
                                highlightId={highlightId}
                                expanded={expanded}
                                onToggle={onToggle}
                                depth={1}
                            />
                        </div>
                    ) : (
                        <div className="relative flex gap-5 pt-4">
                            {/* Horizontal connector across members */}
                            <div
                                className="absolute top-0 h-px bg-neutral-300 dark:bg-neutral-600"
                                style={{
                                    left: `calc(${100 / (group.members.length * 2)}%)`,
                                    right: `calc(${100 / (group.members.length * 2)}%)`,
                                }}
                            />
                            {group.members.map((member) => (
                                <div key={member.id} className="flex flex-col items-center">
                                    <div className="w-px h-4 bg-neutral-300 dark:bg-neutral-600 -mt-4" />
                                    <SubTree
                                        node={member}
                                        highlightId={highlightId}
                                        expanded={expanded}
                                        onToggle={onToggle}
                                        depth={1}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Full Org Tree (root + departments + employees)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function OrgTree({
    root,
    highlightId,
    expanded,
    onToggle,
    collapsedDepts,
    onToggleDept,
}: {
    root: OrgNode;
    highlightId: string | null;
    expanded: Set<string>;
    onToggle: (id: string) => void;
    collapsedDepts: Set<string>;
    onToggleDept: (deptKey: string) => void;
}) {
    const deptGroups = useMemo(
        () => groupByDepartment(root.reportees),
        [root.reportees]
    );
    const hasDepts = deptGroups.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Root card */}
            <RootNodeCard node={root} isHighlighted={highlightId === root.id} />

            {hasDepts && (
                <>
                    {/* Vertical line from root down */}
                    <div className="w-px h-8 bg-neutral-300 dark:bg-neutral-600" />

                    {/* Main junction dot */}
                    <div className="w-3 h-3 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0" />

                    {/* Department branches */}
                    {deptGroups.length === 1 ? (
                        <DepartmentColumn
                            group={deptGroups[0]}
                            highlightId={highlightId}
                            expanded={expanded}
                            onToggle={onToggle}
                            isCollapsed={collapsedDepts.has(`${root.id}:${deptGroups[0].department}`)}
                            onToggleCollapse={() =>
                                onToggleDept(`${root.id}:${deptGroups[0].department}`)
                            }
                        />
                    ) : (
                        <div className="relative flex gap-10 pt-0">
                            {/* Horizontal connector across all departments */}
                            <div
                                className="absolute top-0 h-px bg-neutral-300 dark:bg-neutral-600"
                                style={{
                                    left: `calc(${100 / (deptGroups.length * 2)}%)`,
                                    right: `calc(${100 / (deptGroups.length * 2)}%)`,
                                    top: 0,
                                }}
                            />
                            {deptGroups.map((group) => (
                                <DepartmentColumn
                                    key={group.department}
                                    group={group}
                                    highlightId={highlightId}
                                    expanded={expanded}
                                    onToggle={onToggle}
                                    isCollapsed={collapsedDepts.has(`${root.id}:${group.department}`)}
                                    onToggleCollapse={() =>
                                        onToggleDept(`${root.id}:${group.department}`)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Zoom Controls
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function ZoomControls({
    zoom,
    onZoomIn,
    onZoomOut,
    onReset,
}: {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}) {
    return (
        <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-20">
            <div className="flex flex-col bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                <button
                    onClick={onZoomIn}
                    disabled={zoom >= ZOOM_MAX}
                    className="p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Zoom in"
                >
                    <ZoomIn size={16} className="text-neutral-600 dark:text-neutral-300" />
                </button>
                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                    onClick={onReset}
                    className="px-2.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                    title="Reset zoom"
                >
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        {Math.round(zoom * 100)}%
                    </span>
                </button>
                <div className="h-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                    onClick={onZoomOut}
                    disabled={zoom <= ZOOM_MIN}
                    className="p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Zoom out"
                >
                    <ZoomOut size={16} className="text-neutral-600 dark:text-neutral-300" />
                </button>
            </div>
            <button
                onClick={onReset}
                className="p-2 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Fit to view"
            >
                <RotateCcw size={14} className="text-neutral-500 dark:text-neutral-400" />
            </button>
        </div>
    );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Main Screen
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function OrgChartScreen() {
    /* ── State ── */
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(0.85);
    const [isPanning, setIsPanning] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    /* ── Data ── */
    const { data, isLoading, isError } = useOrgChart();

    const orgData: OrgNode[] = useMemo(() => {
        const raw = (data as any)?.data ?? data ?? [];
        const arr = Array.isArray(raw) ? raw : raw?.tree ? [raw.tree] : raw?.root ? [raw.root] : [];
        return arr.map(transformNode);
    }, [data]);

    const allNodes = useMemo(() => flattenNodes(orgData), [orgData]);

    /* ── Auto-expand first two levels ── */
    useEffect(() => {
        if (orgData.length > 0 && expanded.size === 0) {
            const toExpand = new Set<string>();
            for (const root of orgData) {
                toExpand.add(root.id);
                for (const child of root.reportees) {
                    toExpand.add(child.id);
                    for (const grandchild of child.reportees) {
                        toExpand.add(grandchild.id);
                    }
                }
            }
            setExpanded(toExpand);
        }
    }, [orgData]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Toggle handlers ── */
    const handleToggle = useCallback((id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleToggleDept = useCallback((deptKey: string) => {
        setCollapsedDepts((prev) => {
            const next = new Set(prev);
            if (next.has(deptKey)) next.delete(deptKey);
            else next.add(deptKey);
            return next;
        });
    }, []);

    /* ── Search ── */
    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            if (!value.trim()) {
                setHighlightId(null);
                return;
            }
            const s = value.toLowerCase();
            const match = allNodes.find(
                (n) =>
                    n.name?.toLowerCase().includes(s) ||
                    n.employeeId?.toLowerCase().includes(s) ||
                    n.designation?.toLowerCase().includes(s) ||
                    n.department?.toLowerCase().includes(s)
            );
            if (match) {
                setHighlightId(match.id);
                // Expand ancestors so the node is visible
                const ancestors = findAncestors(orgData, match.id);
                setExpanded((prev) => {
                    const next = new Set(prev);
                    ancestors.forEach((a) => next.add(a));
                    return next;
                });
                // Un-collapse departments containing the match
                setCollapsedDepts((prev) => {
                    if (prev.size === 0) return prev;
                    const next = new Set(prev);
                    // Remove all collapsed states to ensure visibility
                    for (const key of prev) {
                        const dept = key.split(":").slice(1).join(":");
                        if (
                            match.department === dept ||
                            match.name.toLowerCase().includes(s)
                        ) {
                            next.delete(key);
                        }
                    }
                    return next;
                });
                // Auto-scroll to match
                requestAnimationFrame(() => {
                    const el = document.getElementById(`org-node-${match.id}`);
                    if (el) {
                        el.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "center",
                        });
                    }
                });
            } else {
                setHighlightId(null);
            }
        },
        [allNodes, orgData]
    );

    /* ── Zoom ── */
    const handleZoomIn = useCallback(() => {
        setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    }, []);

    const handleZoomReset = useCallback(() => {
        setZoom(0.85);
        setPanOffset({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            setZoom((z) => {
                const next = +(z + delta).toFixed(2);
                return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
            });
        }
    }, []);

    /* ── Pan ── */
    const handleMouseDown = useCallback(
        (e: ReactMouseEvent<HTMLDivElement>) => {
            // Only pan on left-click on the canvas background
            if (e.button !== 0) return;
            if ((e.target as HTMLElement).closest("button, a, input")) return;
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        },
        [panOffset]
    );

    const handleMouseMove = useCallback(
        (e: ReactMouseEvent<HTMLDivElement>) => {
            if (!isPanning) return;
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
        },
        [isPanning, panStart]
    );

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    useEffect(() => {
        const handleGlobalUp = () => setIsPanning(false);
        window.addEventListener("mouseup", handleGlobalUp);
        return () => window.removeEventListener("mouseup", handleGlobalUp);
    }, []);

    /* ── Fullscreen ── */
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((f) => !f);
    }, []);

    /* ── Search match count ── */
    const matchCount = useMemo(() => {
        if (!search.trim()) return 0;
        const s = search.toLowerCase();
        return allNodes.filter(
            (n) =>
                n.name?.toLowerCase().includes(s) ||
                n.employeeId?.toLowerCase().includes(s) ||
                n.designation?.toLowerCase().includes(s) ||
                n.department?.toLowerCase().includes(s)
        ).length;
    }, [search, allNodes]);

    /* ── Render ── */
    return (
        <div
            className={cn(
                "flex flex-col animate-in fade-in duration-500",
                isFullscreen && "fixed inset-0 z-50 bg-neutral-50 dark:bg-neutral-950 p-4"
            )}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">
                        Organization Chart
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
                        <Users size={14} />
                        <span>
                            {allNodes.length} member{allNodes.length !== 1 ? "s" : ""}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search by name, dept, role..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-64 pl-9 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 dark:text-white placeholder:text-neutral-400 transition-all shadow-sm"
                        />
                        {search && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
                                {matchCount} found
                            </span>
                        )}
                    </div>

                    {/* Fullscreen toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        <Maximize2 size={16} className="text-neutral-600 dark:text-neutral-300" />
                    </button>
                </div>
            </div>

            {/* Error state */}
            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium mb-4">
                    Failed to load organization chart. Please try again.
                </div>
            )}

            {/* Canvas */}
            <div
                className={cn(
                    "relative rounded-2xl border overflow-hidden",
                    "bg-neutral-50 dark:bg-neutral-950",
                    "border-neutral-200/60 dark:border-neutral-800",
                    "shadow-xl shadow-neutral-900/5 dark:shadow-black/20",
                    isFullscreen ? "flex-1" : "min-h-[600px]"
                )}
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                }}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[500px] gap-3">
                        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        <p className="text-sm text-neutral-400">Loading organization chart...</p>
                    </div>
                ) : orgData.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[500px]">
                        <EmptyState
                            icon="list"
                            title="No organization data"
                            message="Organization chart data is not available yet. Add employees with reporting relationships to see the chart."
                        />
                    </div>
                ) : (
                    <>
                        {/* Pannable + Zoomable canvas */}
                        <div
                            ref={canvasRef}
                            className={cn(
                                "w-full h-full min-h-[600px] overflow-hidden",
                                isPanning ? "cursor-grabbing" : "cursor-grab"
                            )}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onWheel={handleWheel}
                        >
                            <div
                                ref={contentRef}
                                className="inline-flex justify-center w-full min-w-max p-12 pt-10 transition-transform duration-100"
                                style={{
                                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                                    transformOrigin: "top center",
                                }}
                            >
                                {/* Render each root node tree */}
                                <div className="flex gap-16">
                                    {orgData.map((root) => (
                                        <OrgTree
                                            key={root.id}
                                            root={root}
                                            highlightId={highlightId}
                                            expanded={expanded}
                                            onToggle={handleToggle}
                                            collapsedDepts={collapsedDepts}
                                            onToggleDept={handleToggleDept}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Zoom controls */}
                        <ZoomControls
                            zoom={zoom}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            onReset={handleZoomReset}
                        />

                        {/* Legend */}
                        <div className="absolute bottom-4 left-4 flex items-center gap-3 z-20">
                            <div className="flex items-center gap-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-neutral-200/60 dark:border-neutral-700/60 shadow-sm">
                                <div className="w-4 h-px bg-neutral-300 dark:bg-neutral-600" />
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                    Reports to
                                </span>
                                <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 ml-2" />
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                    Junction
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
