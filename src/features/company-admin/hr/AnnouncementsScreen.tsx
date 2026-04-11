import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Megaphone, Send, Users, Building2, Briefcase, UserCheck } from 'lucide-react';
import { client } from '@/lib/api/client';
import { showSuccess, showApiError } from '@/lib/toast';

type RecipientType = 'COMPANY_WIDE' | 'DEPARTMENT' | 'DESIGNATION' | 'EMPLOYEES';

interface Department { id: string; name: string }
interface Designation { id: string; name: string }

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
            const r = await client.get('/hr/org-structure/departments?limit=200');
            return r.data;
        },
        staleTime: 60_000,
    });
    const { data: desigData } = useQuery({
        queryKey: ['designations-list'],
        queryFn: async () => {
            const r = await client.get('/hr/org-structure/designations?limit=200');
            return r.data;
        },
        staleTime: 60_000,
    });

    const departments: Department[] = (deptData as any)?.data?.departments ?? (deptData as any)?.data ?? [];
    const designations: Designation[] = (desigData as any)?.data?.designations ?? (desigData as any)?.data ?? [];

    const sendMutation = useMutation({
        mutationFn: async () => {
            let recipientFilter: Record<string, unknown>;
            switch (recipientType) {
                case 'DEPARTMENT':
                    recipientFilter = { type: 'DEPARTMENT', departmentId };
                    break;
                case 'DESIGNATION':
                    recipientFilter = { type: 'DESIGNATION', designationId };
                    break;
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
