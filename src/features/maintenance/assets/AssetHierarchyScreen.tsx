import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Network,
    ChevronRight,
    ChevronDown,
    Search,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssetHierarchy } from "@/features/maintenance/api/use-maintenance-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { AssetOperationalBadge } from "@/features/maintenance/shared/AssetStatusBadge";
import { CriticalityBadge } from "@/features/maintenance/shared/CriticalityBadge";

/* ── Types ── */

interface HierarchyNode {
    id: string;
    assetNumber: string;
    name: string;
    assetClass: string;
    operationalStatus: string;
    criticality: string;
    children?: HierarchyNode[];
    location?: { name: string } | null;
}

/* ── Screen ── */

export function AssetHierarchyScreen() {
    const navigate = useNavigate();

    const [locationId, setLocationId] = useState("");
    const [search, setSearch] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const params: Record<string, unknown> = {};
    if (locationId) params.locationId = locationId;

    const { data, isLoading, isError } = useAssetHierarchy(params);
    const locationsQuery = useCompanyLocations();

    const hierarchy: HierarchyNode[] = data?.data ?? [];
    const locations: any[] = locationsQuery.data?.data ?? [];

    const toggleExpand = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const expandAll = useCallback(() => {
        const allIds = new Set<string>();
        const collect = (nodes: HierarchyNode[]) => {
            for (const node of nodes) {
                if (node.children && node.children.length > 0) {
                    allIds.add(node.id);
                    collect(node.children);
                }
            }
        };
        collect(hierarchy);
        setExpandedIds(allIds);
    }, [hierarchy]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    // Filter nodes by search
    const filterNodes = useCallback((nodes: HierarchyNode[], term: string): HierarchyNode[] => {
        if (!term) return nodes;
        const lower = term.toLowerCase();
        const filtered: HierarchyNode[] = [];
        for (const node of nodes) {
            const nameMatch = node.name.toLowerCase().includes(lower);
            const numMatch = node.assetNumber.toLowerCase().includes(lower);
            const childMatches = node.children ? filterNodes(node.children, term) : [];
            if (nameMatch || numMatch || childMatches.length > 0) {
                filtered.push({
                    ...node,
                    children: childMatches.length > 0 ? childMatches : node.children,
                });
            }
        }
        return filtered;
    }, []);

    const displayNodes = filterNodes(hierarchy, search);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Asset Hierarchy</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Parent-child relationships between assets</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={expandAll}
                        className="px-3 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-3 py-2 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Collapse All
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                    <select
                        value={locationId}
                        onChange={(e) => setLocationId(e.target.value)}
                        className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        <option value="">All Locations</option>
                        {locations.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load hierarchy. Please try again.
                </div>
            )}

            {/* Tree */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-primary-500" />
                    </div>
                ) : displayNodes.length === 0 ? (
                    <div className="text-center py-16 text-neutral-400">
                        <Network size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm font-medium">No assets in hierarchy.</p>
                        <p className="text-xs text-neutral-400 mt-1">Assets with parent-child relationships will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {displayNodes.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                level={0}
                                expandedIds={expandedIds}
                                onToggle={toggleExpand}
                                onNavigate={(id) => navigate(`/app/maintenance/assets/${id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Tree Node ── */

function TreeNode({ node, level, expandedIds, onToggle, onNavigate }: {
    node: HierarchyNode;
    level: number;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onNavigate: (id: string) => void;
}) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
        <div>
            <div
                className={cn(
                    "flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer",
                )}
                style={{ paddingLeft: `${level * 24 + 12}px` }}
                onClick={() => onNavigate(node.id)}
            >
                {/* Expand / Collapse */}
                {hasChildren ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                        className="p-0.5 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                {/* Asset info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50 shrink-0">
                        {node.assetNumber}
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">{node.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50 shrink-0">
                        {(node.assetClass || "").replace(/_/g, " ")}
                    </span>
                    <AssetOperationalBadge status={node.operationalStatus} />
                    <CriticalityBadge criticality={node.criticality} />
                    {node.location?.name && (
                        <span className="text-[10px] text-neutral-400 shrink-0">{node.location.name}</span>
                    )}
                </div>

                {/* Children count */}
                {hasChildren && (
                    <span className="text-[10px] text-neutral-400 shrink-0">
                        {node.children!.length} child{node.children!.length !== 1 ? "ren" : ""}
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
