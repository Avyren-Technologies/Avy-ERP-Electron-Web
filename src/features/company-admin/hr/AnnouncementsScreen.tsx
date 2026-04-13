import { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    Send,
    Users,
    Building2,
    Briefcase,
    Megaphone,
    Bell,
    Smartphone,
    Mail,
    AlertTriangle,
    Info,
    Flame,
    Image as ImageIcon,
    Type,
    AlignLeft,
    ChevronDown,
    CheckCircle2,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { client } from '@/lib/api/client';
import { showSuccess, showApiError } from '@/lib/toast';

// ── Types ────────────────────────────────────────────────────────────

type RecipientType = 'COMPANY_WIDE' | 'DEPARTMENT' | 'DESIGNATION' | 'EMPLOYEES';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, Users, Building2, Briefcase } from 'lucide-react';
import { client } from '@/lib/api/client';
import { showSuccess, showApiError } from '@/lib/toast';

type RecipientType = 'COMPANY_WIDE' | 'DEPARTMENT' | 'DESIGNATION' | 'EMPLOYEES';

interface Department { id: string; name: string }
interface Designation { id: string; name: string }

// ── Constants ────────────────────────────────────────────────────────

const CHANNELS = [
    { key: 'IN_APP', label: 'In-App', icon: Bell, desc: 'Notification center' },
    { key: 'PUSH', label: 'Push', icon: Smartphone, desc: 'Mobile devices' },
    { key: 'EMAIL', label: 'Email', icon: Mail, desc: 'Employee inbox' },
] as const;

const RECIPIENT_OPTIONS = [
    { type: 'COMPANY_WIDE' as const, label: 'Everyone', desc: 'All employees', icon: Users },
    { type: 'DEPARTMENT' as const, label: 'Department', desc: 'Specific team', icon: Building2 },
    { type: 'DESIGNATION' as const, label: 'Designation', desc: 'By job title', icon: Briefcase },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; ring: string; icon: typeof Info; desc: string }> = {
    LOW: { label: 'Low', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-500/20', icon: Info, desc: 'General info' },
    MEDIUM: { label: 'Medium', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', ring: 'ring-amber-500/20', icon: AlertTriangle, desc: 'Important' },
    HIGH: { label: 'High', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', ring: 'ring-rose-500/20', icon: Flame, desc: 'Urgent' },
};

// ── Subcomponents ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Type; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/20">
                <Icon size={16} className="text-white" />
            </div>
            <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-none">{title}</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function LivePreview({ title, body, priority, channels, recipientType }: {
    title: string; body: string; priority: Priority; channels: string[]; recipientType: RecipientType;
}) {
    const pc = PRIORITY_CONFIG[priority];
    const PIcon = pc.icon;
    const hasContent = title.trim() || body.trim();

    return (
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-700/50 bg-gradient-to-br from-white via-white to-indigo-50/40 dark:from-neutral-900 dark:via-neutral-900 dark:to-indigo-950/20 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-indigo-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Live Preview</span>
            </div>

            {hasContent ? (
                <div className="space-y-3">
                    {/* Mock notification card */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${pc.bg}`}>
                                <PIcon size={14} className={pc.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                    {title || 'Untitled announcement'}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                                    {body || 'Your message will appear here…'}
                                </p>
                                <div className="flex items-center gap-2 mt-2.5">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${pc.bg} ${pc.color}`}>
                                        {pc.label}
                                    </span>
                                    <span className="text-[10px] text-neutral-400">just now</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery meta */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
                        <span className="font-medium text-neutral-500 dark:text-neutral-400">Delivering via</span>
                        {channels.map(ch => {
                            const cfg = CHANNELS.find(c => c.key === ch);
                            if (!cfg) return null;
                            const CIcon = cfg.icon;
                            return (
                                <span key={ch} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">
                                    <CIcon size={10} /> {cfg.label}
                                </span>
                            );
                        })}
                        <span className="mx-1">to</span>
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {recipientType === 'COMPANY_WIDE' ? 'All Employees' : recipientType === 'DEPARTMENT' ? 'Department' : 'Designation'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                        <Megaphone size={20} className="text-neutral-400" />
                    </div>
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">Start typing to see a preview</p>
                </div>
            )}
        </div>
    );
}

// ── Main Screen ──────────────────────────────────────────────────────

const CHANNELS = [
    { key: 'IN_APP', label: 'In-App' },
    { key: 'PUSH', label: 'Push' },
    { key: 'EMAIL', label: 'Email' },
] as const;

export function AnnouncementsScreen() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [channels, setChannels] = useState<string[]>(['IN_APP', 'PUSH']);
    const [recipientType, setRecipientType] = useState<RecipientType>('COMPANY_WIDE');
    const [departmentId, setDepartmentId] = useState('');
    const [designationId, setDesignationId] = useState('');

    // Fetch departments + designations for the filter dropdowns
    const { data: deptData } = useQuery({
        queryKey: ['departments-list'],
        queryFn: async () => {
            const r = await client.get('/hr/departments?limit=200');
            return r.data;
        },
        staleTime: 60_000,
    });
    const { data: desigData } = useQuery({
        queryKey: ['designations-list'],
        queryFn: async () => {
            const r = await client.get('/hr/designations?limit=200');
            return r.data;
        },
        staleTime: 60_000,
    });

    const departments: Department[] = (deptData as any)?.data?.departments ?? (deptData as any)?.data ?? [];
    const designations: Designation[] = (desigData as any)?.data?.designations ?? (desigData as any)?.data ?? [];
    const hasRequiredRecipientSelection =
        recipientType === 'DEPARTMENT'
            ? departmentId.trim().length > 0
            : recipientType === 'DESIGNATION'
                ? designationId.trim().length > 0
                : true;
    const canSend = title.trim().length > 0 && body.trim().length > 0 && channels.length > 0 && hasRequiredRecipientSelection;

    const sendMutation = useMutation({
        mutationFn: async () => {
            if (!canSend) {
                throw new Error('Please complete all required announcement fields before sending.');
            }

            let recipientFilter: Record<string, unknown>;
            switch (recipientType) {
                case 'DEPARTMENT': {
                    const trimmedDepartmentId = departmentId.trim();
                    if (!trimmedDepartmentId) {
                        throw new Error('Please select a department before sending.');
                    }
                    recipientFilter = { type: 'DEPARTMENT', departmentId: trimmedDepartmentId };
                    break;
                }
                case 'DESIGNATION': {
                    const trimmedDesignationId = designationId.trim();
                    if (!trimmedDesignationId) {
                        throw new Error('Please select a designation before sending.');
                    }
                    recipientFilter = { type: 'DESIGNATION', designationId: trimmedDesignationId };
                    break;
                }
                default:
                    recipientFilter = { type: 'COMPANY_WIDE' };
            }

            const r = await client.post('/notifications/announcements', {
                title,
                body,
                ...(imageUrl && { imageUrl }),
                channels,
                priority,
                recipientFilter,
            });
            return r.data;
        },
        onSuccess: (result) => {
            const data = (result as any)?.data;
            showSuccess(`Announcement sent to ${data?.recipientCount ?? 0} recipient(s)`);
            setTitle('');
            setBody('');
            setImageUrl('');
        },
        onError: (err) => showApiError(err),
    });

    const toggleChannel = (ch: string) => {
        setChannels((prev) =>
            prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
        );
    };

    const canSend = title.trim() && body.trim() && channels.length > 0;

    return (
        <div className="max-w-3xl space-y-6 p-1">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Send Announcement
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Broadcast a custom notification to employees — company-wide, by department, or by designation.
                </p>
            </div>

            {/* Title + Body */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Office Closure Notice"
                        maxLength={200}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Message</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your announcement…"
                        rows={5}
                        maxLength={5000}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100 resize-y"
                    />
                    <p className="text-xs text-neutral-400 mt-1 text-right">{body.length} / 5000</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Image URL <span className="text-neutral-400">(optional — shown in push)</span>
                    </label>
                    <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                    />
                </div>
            </section>

            {/* Recipients */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Recipients</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                        { type: 'COMPANY_WIDE' as const, label: 'Everyone', icon: Users },
                        { type: 'DEPARTMENT' as const, label: 'Department', icon: Building2 },
                        { type: 'DESIGNATION' as const, label: 'Designation', icon: Briefcase },
                    ]).map((opt) => (
                        <button
                            key={opt.type}
                            type="button"
                            onClick={() => setRecipientType(opt.type)}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                                recipientType === opt.type
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                            }`}
                        >
                            <opt.icon size={16} />
                            {opt.label}
                        </button>
                    ))}
                </div>

                {recipientType === 'DEPARTMENT' && (
                    <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                    >
                        <option value="">Select department…</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                )}

                {recipientType === 'DESIGNATION' && (
                    <select
                        value={designationId}
                        onChange={(e) => setDesignationId(e.target.value)}
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-neutral-900 dark:text-neutral-100"
                    >
                        <option value="">Select designation…</option>
                        {designations.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                )}
            </section>

            {/* Channels + Priority */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Delivery</h2>
                <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => (
                        <button
                            key={ch.key}
                            type="button"
                            onClick={() => toggleChannel(ch.key)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${
                                channels.includes(ch.key)
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                            }`}
                        >
                            {ch.label}
                        </button>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                    <div className="flex gap-2">
                        {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`rounded-lg px-4 py-1.5 text-sm font-medium border transition ${
                                    priority === p
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-500'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Send */}
            <button
                type="button"
                disabled={!canSend || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50 transition"
            >
                <Send size={16} />
                {sendMutation.isPending ? 'Sending…' : 'Send Announcement'}
            </button>
        </div>
    );
}

export default AnnouncementsScreen;
