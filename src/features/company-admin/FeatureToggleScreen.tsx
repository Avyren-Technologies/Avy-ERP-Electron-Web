import { useState, useEffect } from "react";
import {
    ToggleRight,
    Loader2,
    Search,
    Users,
    CheckCircle2,
    XCircle,
    Shield,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { client } from "@/lib/api/client";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

interface FeatureToggle {
    id: string;
    featureKey: string;
    label: string;
    description?: string;
    enabled: boolean;
    source: "role" | "explicit";
}

interface UserSummary {
    id: string;
    name: string;
    email: string;
    role: string;
}

export function FeatureToggleScreen() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [toggles, setToggles] = useState<FeatureToggle[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingToggles, setLoadingToggles] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Fetch user list
    useEffect(() => {
        (async () => {
            try {
                const { data } = await client.get("/company/users", { params: { limit: 200 } });
                const list: any[] = data?.data ?? [];
                setUsers(list.map((u: any) => ({
                    id: u.id,
                    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.fullName || u.email,
                    email: u.email,
                    role: u.role ?? "operator",
                })));
                if (list.length > 0) {
                    setSelectedUserId(list[0].id);
                }
            } catch {
                // ignore
            } finally {
                setLoadingUsers(false);
            }
        })();
    }, []);

    // Fetch toggles when user changes
    useEffect(() => {
        if (!selectedUserId) return;
        (async () => {
            setLoadingToggles(true);
            try {
                const { data } = await client.get('/feature-toggles', { params: { userId: selectedUserId } });
                setToggles(data?.data ?? data ?? []);
            } catch {
                setToggles([]);
            } finally {
                setLoadingToggles(false);
            }
        })();
    }, [selectedUserId]);

    const handleToggle = async (toggle: FeatureToggle) => {
        if (toggle.source === "role") return; // Can't override role-inherited
        setSaving(toggle.id);
        try {
            const updatedToggles = toggles.map((t) =>
                t.id === toggle.id ? { ...t, enabled: !t.enabled } : t
            );
            await client.put(`/feature-toggles/user/${selectedUserId}`, {
                toggles: updatedToggles.map((t) => ({ featureKey: t.featureKey, enabled: t.enabled })),
            });
            setToggles(updatedToggles);
            showSuccess("Toggle Updated", `${toggle.label} is now ${!toggle.enabled ? "enabled" : "disabled"}.`);
        } catch (err) {
            showApiError(err);
        } finally {
            setSaving(null);
        }
    };

    const filtered = toggles.filter((t) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return t.label?.toLowerCase().includes(s) || t.featureKey?.toLowerCase().includes(s);
    });

    const selectedUser = users.find((u) => u.id === selectedUserId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Feature Toggles</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage per-user feature flags and overrides</p>
            </div>

            {/* User Selector */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-neutral-400" />
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Select User:</span>
                </div>
                {loadingUsers ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Loader2 size={14} className="animate-spin" /> Loading users...
                    </div>
                ) : (
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="flex-1 max-w-md px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
                    >
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email}) - {u.role}</option>
                        ))}
                    </select>
                )}
                {selectedUser && (
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded dark:bg-primary-900/30 dark:text-primary-400">
                            {selectedUser.role}
                        </span>
                    </div>
                )}
            </div>

            {/* Search */}
            {!loadingUsers && selectedUserId && (
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search features..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Toggle List */}
            {loadingToggles ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            ) : filtered.length === 0 && selectedUserId ? (
                <EmptyState icon="list" title="No feature toggles" message="No feature flags configured for this user." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((toggle) => {
                        const isRoleInherited = toggle.source === "role";
                        const isSaving = saving === toggle.id;
                        return (
                            <div
                                key={toggle.id}
                                className={cn(
                                    "bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm overflow-hidden transition-colors",
                                    toggle.enabled
                                        ? "border-success-100 dark:border-success-800/50"
                                        : "border-neutral-100 dark:border-neutral-800"
                                )}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-primary-950 dark:text-white">{toggle.label}</h3>
                                                {isRoleInherited && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-info-50 text-info-700 border border-info-100 px-1.5 py-0.5 rounded dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50">
                                                        <Shield size={9} /> Role
                                                    </span>
                                                )}
                                                {!isRoleInherited && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-accent-50 text-accent-700 border border-accent-100 px-1.5 py-0.5 rounded dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">
                                                        Explicit
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{toggle.description || toggle.featureKey}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggle(toggle)}
                                            disabled={isRoleInherited || isSaving}
                                            className={cn(
                                                "w-12 h-7 rounded-full transition-colors relative flex-shrink-0",
                                                toggle.enabled ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700",
                                                isRoleInherited && "opacity-50 cursor-not-allowed"
                                            )}
                                            title={isRoleInherited ? "Inherited from role — cannot override" : undefined}
                                        >
                                            {isSaving ? (
                                                <Loader2 size={12} className="absolute top-1.5 left-1/2 -translate-x-1/2 animate-spin text-white" />
                                            ) : (
                                                <div className={cn("w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-sm", toggle.enabled ? "left-[26px]" : "left-1")} />
                                            )}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                        {toggle.enabled ? (
                                            <CheckCircle2 size={13} className="text-success-500" />
                                        ) : (
                                            <XCircle size={13} className="text-neutral-300 dark:text-neutral-600" />
                                        )}
                                        <span className={cn("text-xs font-semibold", toggle.enabled ? "text-success-700 dark:text-success-400" : "text-neutral-400 dark:text-neutral-500")}>
                                            {toggle.enabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!selectedUserId && !loadingUsers && (
                <EmptyState icon="inbox" title="Select a user" message="Choose a user from the dropdown to manage their feature toggles." />
            )}
        </div>
    );
}
