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

export function AnnouncementsScreen() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [channels, setChannels] = useState<string[]>(['IN_APP', 'PUSH']);
    const [recipientType, setRecipientType] = useState<RecipientType>('COMPANY_WIDE');
    const [departmentId, setDepartmentId] = useState('');
    const [designationId, setDesignationId] = useState('');

    const { data: deptData } = useQuery({
        queryKey: ['departments-list'],
        queryFn: async () => { const r = await client.get('/hr/departments?limit=200'); return r.data; },
        staleTime: 60_000,
    });
    const { data: desigData } = useQuery({
        queryKey: ['designations-list'],
        queryFn: async () => { const r = await client.get('/hr/designations?limit=200'); return r.data; },
        staleTime: 60_000,
    });

    const departments: Department[] = (deptData as any)?.data?.departments ?? (deptData as any)?.data ?? [];
    const designations: Designation[] = (desigData as any)?.data?.designations ?? (desigData as any)?.data ?? [];

    const hasRequiredRecipientSelection = recipientType === 'DEPARTMENT'
        ? departmentId.trim().length > 0
        : recipientType === 'DESIGNATION'
            ? designationId.trim().length > 0
            : true;

    const canSend = title.trim().length > 0 && body.trim().length > 0 && channels.length > 0 && hasRequiredRecipientSelection;

    const completionSteps = useMemo(() => {
        const steps = [
            { label: 'Title', done: title.trim().length > 0 },
            { label: 'Message', done: body.trim().length > 0 },
            { label: 'Recipients', done: hasRequiredRecipientSelection },
            { label: 'Channels', done: channels.length > 0 },
        ];
        return steps;
    }, [title, body, hasRequiredRecipientSelection, channels]);

    const completionPercent = Math.round((completionSteps.filter(s => s.done).length / completionSteps.length) * 100);

    const sendMutation = useMutation({
        mutationFn: async () => {
            if (!canSend) throw new Error('Please complete all required fields.');
            let recipientFilter: Record<string, unknown>;
            switch (recipientType) {
                case 'DEPARTMENT': {
                    const id = departmentId.trim();
                    if (!id) throw new Error('Please select a department.');
                    recipientFilter = { type: 'DEPARTMENT', departmentId: id };
                    break;
                }
                case 'DESIGNATION': {
                    const id = designationId.trim();
                    if (!id) throw new Error('Please select a designation.');
                    recipientFilter = { type: 'DESIGNATION', designationId: id };
                    break;
                }
                default:
                    recipientFilter = { type: 'COMPANY_WIDE' };
            }
            const r = await client.post('/notifications/announcements', {
                title, body, ...(imageUrl && { imageUrl }), channels, priority, recipientFilter,
            });
            return r.data;
        },
        onSuccess: (result) => {
            const data = (result as any)?.data;
            showSuccess(`Announcement sent to ${data?.recipientCount ?? 0} recipient(s)`);
            setTitle(''); setBody(''); setImageUrl('');
        },
        onError: (err) => showApiError(err),
    });

    const toggleChannel = (ch: string) => {
        setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
    };

    return (
        <div className="mx-auto max-w-6xl px-1">
            {/* ── Page Header ── */}
            <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-6 shadow-lg shadow-indigo-500/15">
                {/* Decorative circles */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 right-24 h-20 w-20 rounded-full bg-white/5" />
                <div className="absolute left-1/2 top-0 h-16 w-16 rounded-full bg-white/5" />

                <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                        <Megaphone size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Broadcast Announcement</h1>
                        <p className="text-sm text-indigo-200 mt-0.5">
                            Reach employees instantly via push, email, or in-app notifications
                        </p>
                    </div>
                </div>

                {/* Completion progress */}
                <div className="relative mt-5">
                    <div className="flex items-center justify-between text-xs text-indigo-200 mb-1.5">
                        <span className="font-medium">Completion</span>
                        <span>{completionPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-white/80 transition-all duration-500 ease-out"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                    <div className="flex gap-3 mt-2">
                        {completionSteps.map(step => (
                            <span key={step.label} className={`flex items-center gap-1 text-[11px] transition-colors ${step.done ? 'text-white' : 'text-indigo-300/60'}`}>
                                <CheckCircle2 size={11} className={step.done ? 'text-emerald-300' : 'text-indigo-300/40'} />
                                {step.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Two-Column Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column — Compose */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Compose Card */}
                    <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                        <SectionHeader icon={Type} title="Compose" subtitle="Write your announcement content" />

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Title <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="e.g. Office Closure Notice"
                                    maxLength={200}
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <div className="mt-1 flex justify-end">
                                    <span className="text-[10px] text-neutral-400">{title.length}/200</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Message <span className="text-rose-400">*</span>
                                </label>
                                <textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Write your announcement…"
                                    rows={6}
                                    maxLength={5000}
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-3 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 resize-y transition-all focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                                <div className="mt-1 flex items-center justify-between">
                                    <div className="h-1 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-indigo-400 transition-all duration-300"
                                            style={{ width: `${Math.min((body.length / 5000) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-neutral-400">{body.length.toLocaleString()}/5,000</span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    <ImageIcon size={11} /> Image URL
                                    <span className="font-normal normal-case tracking-normal text-neutral-400">(optional)</span>
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Recipients Card */}
                    <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                        <SectionHeader icon={Users} title="Recipients" subtitle="Choose who should receive this" />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {RECIPIENT_OPTIONS.map(opt => {
                                const active = recipientType === opt.type;
                                return (
                                    <button
                                        key={opt.type}
                                        type="button"
                                        onClick={() => setRecipientType(opt.type)}
                                        className={`group relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 text-center transition-all duration-200 ${
                                            active
                                                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30 shadow-sm shadow-indigo-500/10 ring-2 ring-indigo-500/10'
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                        }`}
                                    >
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                                            active
                                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'
                                        }`}>
                                            <opt.icon size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-[11px] text-neutral-400 mt-0.5">{opt.desc}</p>
                                        </div>
                                        {active && (
                                            <div className="absolute -top-1.5 -right-1.5">
                                                <CheckCircle2 size={18} className="text-indigo-500 fill-white dark:fill-neutral-900" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {recipientType === 'DEPARTMENT' && (
                            <div className="mt-4 relative">
                                <select
                                    value={departmentId}
                                    onChange={e => setDepartmentId(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2.5 pr-10 text-sm text-neutral-900 dark:text-neutral-100 transition-all focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Select department…</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            </div>
                        )}

                        {recipientType === 'DESIGNATION' && (
                            <div className="mt-4 relative">
                                <select
                                    value={designationId}
                                    onChange={e => setDesignationId(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2.5 pr-10 text-sm text-neutral-900 dark:text-neutral-100 transition-all focus:border-indigo-400 focus:bg-white dark:focus:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">Select designation…</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column — Settings + Preview */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Delivery Channels */}
                    <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                        <SectionHeader icon={Send} title="Delivery" subtitle="How to reach your audience" />

                        <div className="space-y-2.5">
                            {CHANNELS.map(ch => {
                                const active = channels.includes(ch.key);
                                const CIcon = ch.icon;
                                return (
                                    <button
                                        key={ch.key}
                                        type="button"
                                        onClick={() => toggleChannel(ch.key)}
                                        className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 ${
                                            active
                                                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30'
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                                        }`}
                                    >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                            active ? 'bg-indigo-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                                        }`}>
                                            <CIcon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                {ch.label}
                                            </p>
                                            <p className="text-[11px] text-neutral-400">{ch.desc}</p>
                                        </div>
                                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                                            active ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-300 dark:border-neutral-600'
                                        }`}>
                                            {active && <CheckCircle2 size={14} className="text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Priority */}
                    <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                        <SectionHeader icon={AlertTriangle} title="Priority" subtitle="Set the urgency level" />

                        <div className="grid grid-cols-3 gap-2">
                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => {
                                const cfg = PRIORITY_CONFIG[p];
                                const active = priority === p;
                                const PIcon = cfg.icon;
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-200 ${
                                            active
                                                ? `${cfg.border} ${cfg.bg} ring-2 ${cfg.ring}`
                                                : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                                        }`}
                                    >
                                        <PIcon size={16} className={active ? cfg.color : 'text-neutral-400'} />
                                        <span className={`text-xs font-semibold ${active ? cfg.color : 'text-neutral-500'}`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-[10px] text-neutral-400">{cfg.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Live Preview */}
                    <LivePreview
                        title={title}
                        body={body}
                        priority={priority}
                        channels={channels}
                        recipientType={recipientType}
                    />

                    {/* Send Button */}
                    <button
                        type="button"
                        disabled={!canSend || sendMutation.isPending}
                        onClick={() => sendMutation.mutate()}
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:brightness-100"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <span className="relative flex items-center justify-center gap-2">
                            {sendMutation.isPending ? (
                                <><Loader2 size={16} className="animate-spin" /> Sending…</>
                            ) : (
                                <><Send size={16} /> Send Announcement</>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AnnouncementsScreen;
