import { useState, useRef, useCallback } from 'react';
import {
    useMyExpenseClaims,
    useMyExpenseSummary,
    useEssExpenseCategories,
    useCreateMyExpenseClaim,
    useSubmitMyExpenseClaim,
    useUpdateMyExpenseClaim,
    useCancelMyExpenseClaim,
} from '@/features/company-admin/api';
import { Loader2, Receipt, Plus, X, Send, Ban, Pencil, Trash2, ChevronDown, ChevronUp, Upload, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-info-100 text-info-700',
    SUBMITTED: 'bg-info-100 text-info-700',
    PENDING_APPROVAL: 'bg-warning-100 text-warning-700',
    PENDING: 'bg-warning-100 text-warning-700',
    APPROVED: 'bg-success-100 text-success-700',
    PARTIALLY_APPROVED: 'bg-success-100 text-success-700',
    REJECTED: 'bg-danger-100 text-danger-600',
    PAID: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-neutral-100 text-neutral-500',
};

const STATUS_AMOUNT_COLORS: Record<string, string> = {
    DRAFT: 'text-neutral-700 dark:text-neutral-300',
    SUBMITTED: 'text-primary-700 dark:text-primary-400',
    PENDING_APPROVAL: 'text-warning-700 dark:text-warning-400',
    PENDING: 'text-warning-700 dark:text-warning-400',
    APPROVED: 'text-success-700 dark:text-success-400',
    PARTIALLY_APPROVED: 'text-success-700 dark:text-success-400',
    REJECTED: 'text-danger-600 dark:text-danger-400',
    PAID: 'text-success-700 dark:text-success-400',
    CANCELLED: 'text-neutral-400 dark:text-neutral-500',
};

const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'PERSONAL_CARD', label: 'Personal Card' },
    { value: 'COMPANY_CARD', label: 'Company Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'OTHER', label: 'Other' },
] as const;

interface LineItem {
    id?: string;
    categoryCode: string;
    categoryId?: string;
    description: string;
    amount: string;
    expenseDate: string;
    merchantName: string;
    receiptUrl: string;
}

interface ReceiptEntry {
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
    previewUrl?: string;
}

const EMPTY_LINE_ITEM: LineItem = {
    categoryCode: '',
    description: '',
    amount: '',
    expenseDate: '',
    merchantName: '',
    receiptUrl: '',
};

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(fileName: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
}

function SummaryCards({ summary }: { summary: any }) {
    if (!summary) return null;
    const cards = [
        { label: 'Total Claimed', value: summary.totalClaimed, color: 'text-primary-700 dark:text-primary-400' },
        { label: 'Approved', value: summary.totalApproved, color: 'text-success-600 dark:text-success-400' },
        { label: 'Pending', value: summary.totalPending, color: 'text-warning-600 dark:text-warning-400' },
        { label: 'Paid', value: summary.totalPaid, color: 'text-success-700 dark:text-success-300' },
    ];
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((c) => (
                <div key={c.label} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{c.label}</p>
                    <p className={cn('text-xl font-bold mt-1', c.color)}>{INR.format(c.value ?? 0)}</p>
                </div>
            ))}
        </div>
    );
}

const INPUT_CLASS = 'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all';

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-5 bg-primary-500 rounded-full" />
            <h4 className="text-sm font-semibold text-primary-950 dark:text-white">{title}</h4>
        </div>
    );
}

export function MyExpenseClaimsScreen() {
    const { data, isLoading } = useMyExpenseClaims();
    const { data: summaryData } = useMyExpenseSummary();
    const { data: categoriesData } = useEssExpenseCategories();
    const claims = data?.data ?? [];
    const summary = summaryData?.data ?? null;
    const categories: any[] = categoriesData?.data ?? [];

    const createMutation = useCreateMyExpenseClaim();
    const submitMutation = useSubmitMyExpenseClaim();
    const updateMutation = useUpdateMyExpenseClaim();
    const cancelMutation = useCancelMyExpenseClaim();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [projectCode, setProjectCode] = useState('');
    const [lineItems, setLineItems] = useState<LineItem[]>([{ ...EMPTY_LINE_ITEM }]);
    const [receipts, setReceipts] = useState<ReceiptEntry[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    function resetForm() {
        setTitle('');
        setCategory('');
        setDescription('');
        setFromDate('');
        setToDate('');
        setPaymentMethod('');
        setMerchantName('');
        setProjectCode('');
        setLineItems([{ ...EMPTY_LINE_ITEM }]);
        setReceipts([]);
        setShowForm(false);
        setEditingId(null);
        setIsDragging(false);
    }

    function openEditForm(claim: any) {
        setEditingId(claim.id);
        setTitle(claim.title ?? '');
        setCategory(claim.category ?? '');
        setDescription(claim.description ?? '');
        setFromDate(claim.fromDate ? claim.fromDate.slice(0, 10) : '');
        setToDate(claim.toDate ? claim.toDate.slice(0, 10) : '');
        setPaymentMethod(claim.paymentMethod ?? '');
        setMerchantName(claim.merchantName ?? '');
        setProjectCode(claim.projectCode ?? '');
        if (claim.items && claim.items.length > 0) {
            setLineItems(claim.items.map((item: any) => ({
                id: item.id,
                categoryCode: item.categoryCode ?? item.category?.code ?? '',
                categoryId: item.categoryId ?? '',
                description: item.description ?? '',
                amount: String(item.amount ?? ''),
                expenseDate: item.expenseDate ? new Date(item.expenseDate).toISOString().slice(0, 10) : '',
                merchantName: item.merchantName ?? '',
                receiptUrl: '',
            })));
        } else {
            setLineItems([{ ...EMPTY_LINE_ITEM }]);
        }
        const claimReceipts = claim.receipts;
        if (Array.isArray(claimReceipts) && claimReceipts.length > 0) {
            setReceipts(claimReceipts.map((r: any) => ({
                fileName: r.fileName ?? r.name ?? '',
                fileUrl: r.fileUrl ?? r.url ?? '',
            })));
        } else {
            setReceipts([]);
        }
        setShowForm(true);
    }

    const lineItemsTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const hasValidLineItems = lineItems.some((item) => item.amount && parseFloat(item.amount) > 0);
    const totalAmount = hasValidLineItems ? lineItemsTotal : 0;

    function buildPayload() {
        const validItems = lineItems.filter((item) => item.amount && parseFloat(item.amount) > 0 && item.categoryCode);
        const validReceipts = receipts.filter((r) => r.fileUrl.trim());

        return {
            title: title.trim(),
            amount: validItems.length > 0 ? validItems.reduce((s, i) => s + parseFloat(i.amount), 0) : 0,
            category: category || (validItems[0]?.categoryCode ?? 'OTHER'),
            description: description.trim() || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
            paymentMethod: paymentMethod || undefined,
            merchantName: merchantName.trim() || undefined,
            projectCode: projectCode.trim() || undefined,
            receipts: validReceipts.length > 0 ? validReceipts.map((r) => ({ fileName: r.fileName, fileUrl: r.fileUrl })) : undefined,
            items: validItems.length > 0 ? validItems.map((item) => ({
                categoryCode: item.categoryCode,
                categoryId: item.categoryId || undefined,
                description: item.description || item.categoryCode,
                amount: parseFloat(item.amount),
                expenseDate: item.expenseDate || new Date().toISOString().slice(0, 10),
                merchantName: item.merchantName || undefined,
                receipts: item.receiptUrl ? [{ fileName: item.receiptUrl.split('/').pop() ?? 'receipt', fileUrl: item.receiptUrl }] : undefined,
            })) : undefined,
        };
    }

    function handleCreate() {
        if (!title.trim() || !hasValidLineItems) return;
        createMutation.mutate(buildPayload(), {
            onSuccess: () => { showSuccess('Expense claim created'); resetForm(); },
            onError: (err) => showApiError(err),
        });
    }

    function handleUpdate() {
        if (!editingId || !title.trim()) return;
        updateMutation.mutate({ id: editingId, data: buildPayload() }, {
            onSuccess: () => { showSuccess('Expense claim updated'); resetForm(); },
            onError: (err) => showApiError(err),
        });
    }

    function handleSubmit(id: string) {
        submitMutation.mutate(id, {
            onSuccess: () => showSuccess('Claim submitted for approval'),
            onError: (err) => showApiError(err),
        });
    }

    function handleCancel(id: string) {
        cancelMutation.mutate(id, {
            onSuccess: () => showSuccess('Claim cancelled'),
            onError: (err) => showApiError(err),
        });
    }

    function updateLineItem(index: number, field: keyof LineItem, value: string) {
        setLineItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    }

    function addLineItem() {
        setLineItems((prev) => [...prev, { ...EMPTY_LINE_ITEM }]);
    }

    function removeLineItem(index: number) {
        if (lineItems.length <= 1) return;
        setLineItems((prev) => prev.filter((_, i) => i !== index));
    }

    const processFiles = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const MAX_SIZE = 10 * 1024 * 1024;

        for (const file of fileArray) {
            if (file.size > MAX_SIZE) {
                showApiError(new Error(`File "${file.name}" exceeds 10MB limit`));
                continue;
            }

            try {
                const dataUrl = await fileToDataUrl(file);
                const isImage = file.type.startsWith('image/');
                const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

                setReceipts((prev) => [
                    ...prev,
                    {
                        fileName: file.name,
                        fileUrl: dataUrl,
                        fileSize: file.size,
                        fileType: file.type,
                        previewUrl,
                    },
                ]);
            } catch {
                showApiError(new Error(`Failed to process file "${file.name}"`));
            }
        }
    }, []);

    function removeReceipt(index: number) {
        setReceipts((prev) => {
            const receipt = prev[index];
            if (receipt.previewUrl) {
                URL.revokeObjectURL(receipt.previewUrl);
            }
            return prev.filter((_, i) => i !== index);
        });
    }

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, [processFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    }, [processFiles]);

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">My Expense Claims</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Submit and track expense reimbursements</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> New Claim
                </button>
            </div>

            <SummaryCards summary={summary} />

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => resetForm()} />
                    <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-t-2xl">
                            <div>
                                <h3 className="text-lg font-bold text-primary-950 dark:text-white">
                                    {editingId ? 'Edit Expense Claim' : 'New Expense Claim'}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-0.5">Fill in the details below to {editingId ? 'update your' : 'create a new'} expense claim</p>
                            </div>
                            <button onClick={() => resetForm()} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                            <div>
                                <SectionHeader title="Claim Details" />
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Claim Title *</label>
                                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Business trip to Mumbai" className={INPUT_CLASS} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Overall Category</label>
                                            <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT_CLASS}>
                                                <option value="">Select Category</option>
                                                {categories.map((c: any) => <option key={c.id} value={c.code}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Payment Method</label>
                                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={INPUT_CLASS}>
                                                <option value="">Select</option>
                                                {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">From Date</label>
                                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={INPUT_CLASS} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">To Date</label>
                                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={INPUT_CLASS} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                <SectionHeader title="Additional Info" />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Merchant Name</label>
                                            <input value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="e.g. Taj Hotels" className={INPUT_CLASS} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Project Code</label>
                                            <input value={projectCode} onChange={(e) => setProjectCode(e.target.value)} placeholder="e.g. PRJ-2026-001" className={INPUT_CLASS} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5 block">Description</label>
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description of the expense..." className={cn(INPUT_CLASS, 'resize-none')} />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-0.5 h-5 bg-primary-500 rounded-full" />
                                        <h4 className="text-sm font-semibold text-primary-950 dark:text-white">Expense Items</h4>
                                    </div>
                                    <button onClick={addLineItem} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-medium rounded-lg transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Add Item
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {lineItems.map((item, idx) => (
                                        <div key={idx} className="relative bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-700/50 transition-all hover:border-neutral-200 dark:hover:border-neutral-700">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-bold">
                                                    {idx + 1}
                                                </span>
                                                {lineItems.length > 1 && (
                                                    <button onClick={() => removeLineItem(idx)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-medium text-neutral-500 mb-1 block uppercase tracking-wider">Category *</label>
                                                    <select value={item.categoryCode} onChange={(e) => {
                                                        const cat = categories.find((c: any) => c.code === e.target.value);
                                                        updateLineItem(idx, 'categoryCode', e.target.value);
                                                        if (cat) updateLineItem(idx, 'categoryId', cat.id);
                                                    }} className={INPUT_CLASS}>
                                                        <option value="">Select Category</option>
                                                        {categories.map((c: any) => <option key={c.id} value={c.code}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-neutral-500 mb-1 block uppercase tracking-wider">Amount *</label>
                                                    <input type="number" step="0.01" min="0" value={item.amount} onChange={(e) => updateLineItem(idx, 'amount', e.target.value)} placeholder="0.00" className={INPUT_CLASS} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-neutral-500 mb-1 block uppercase tracking-wider">Description</label>
                                                    <input value={item.description} onChange={(e) => updateLineItem(idx, 'description', e.target.value)} placeholder="What was this expense for?" className={INPUT_CLASS} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-neutral-500 mb-1 block uppercase tracking-wider">Date</label>
                                                    <input type="date" value={item.expenseDate} onChange={(e) => updateLineItem(idx, 'expenseDate', e.target.value)} className={INPUT_CLASS} />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="text-[10px] font-medium text-neutral-500 mb-1 block uppercase tracking-wider">Merchant</label>
                                                    <input value={item.merchantName} onChange={(e) => updateLineItem(idx, 'merchantName', e.target.value)} placeholder="Merchant name" className={INPUT_CLASS} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                <SectionHeader title="Receipts & Attachments" />
                                <div
                                    className={cn(
                                        'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                                        isDragging
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                                    )}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileSelect} />
                                    <Upload className={cn('w-8 h-8 mx-auto mb-2', isDragging ? 'text-primary-500' : 'text-neutral-400')} />
                                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                        {isDragging ? 'Drop files here' : 'Drop files here or click to browse'}
                                    </p>
                                    <p className="text-xs text-neutral-400 mt-1">PDF, Images, Documents (max 10MB each)</p>
                                </div>

                                {receipts.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {receipts.map((r, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                                {r.previewUrl || (r.fileUrl && isImageFile(r.fileName)) ? (
                                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0">
                                                        <img
                                                            src={r.previewUrl || r.fileUrl}
                                                            alt={r.fileName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                                        {r.fileName.toLowerCase().endsWith('.pdf') ? (
                                                            <FileText className="w-5 h-5 text-primary-500" />
                                                        ) : isImageFile(r.fileName) ? (
                                                            <Image className="w-5 h-5 text-primary-500" />
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-primary-500" />
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">{r.fileName}</p>
                                                    {r.fileSize && (
                                                        <p className="text-xs text-neutral-400">{formatFileSize(r.fileSize)}</p>
                                                    )}
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); removeReceipt(idx); }} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors flex-shrink-0">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="sticky bottom-0 z-10 flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-b-2xl">
                            <div>
                                {hasValidLineItems && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-neutral-500">Total:</span>
                                        <span className="text-lg font-bold text-primary-700 dark:text-primary-400">{INR.format(totalAmount)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={resetForm} className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={editingId ? handleUpdate : handleCreate}
                                    disabled={(editingId ? updateMutation.isPending : createMutation.isPending) || !title.trim() || !hasValidLineItems}
                                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    {editingId
                                        ? (updateMutation.isPending ? 'Saving...' : 'Save Changes')
                                        : (createMutation.isPending ? 'Creating...' : 'Create Claim')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {claims.length === 0 && !showForm ? (
                <div className="text-center py-16">
                    <Receipt className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Expense Claims</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't submitted any expense claims yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {claims.map((c: any) => {
                        const isExpanded = expandedId === c.id;
                        const canCancel = ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL'].includes(c.status);
                        const canEdit = c.status === 'DRAFT';
                        const showApproved = ['APPROVED', 'PARTIALLY_APPROVED', 'PAID'].includes(c.status) && c.approvedAmount != null;
                        const amountColor = STATUS_AMOUNT_COLORS[c.status] ?? 'text-primary-700 dark:text-primary-400';
                        return (
                            <div key={c.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-primary-950 dark:text-white">{c.title}</h3>
                                            {c.claimNumber && (
                                                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                    {c.claimNumber}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            {new Date(c.createdAt).toLocaleDateString()}
                                            {c.fromDate && c.toDate && (
                                                <span className="ml-2">
                                                    {new Date(c.fromDate).toLocaleDateString()} - {new Date(c.toDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {c.category && (
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                {c.category}
                                            </span>
                                        )}
                                        <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[c.status] ?? STATUS_STYLES.PENDING)}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-3">
                                    <p className={cn('text-xl font-bold', amountColor)}>
                                        {INR.format(c.amount)}
                                    </p>
                                    {showApproved && (
                                        <p className="text-sm text-success-600 dark:text-success-400 font-medium">
                                            Approved: {INR.format(c.approvedAmount)}
                                        </p>
                                    )}
                                </div>

                                {c.description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{c.description}</p>}

                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-neutral-500">
                                    {c.paymentMethod && <span>Payment: {c.paymentMethod.replace(/_/g, ' ')}</span>}
                                    {c.merchantName && <span>Merchant: {c.merchantName}</span>}
                                    {c.projectCode && <span>Project: {c.projectCode}</span>}
                                </div>

                                {c.items && c.items.length > 0 && (
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                        className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {c.items.length} item{c.items.length !== 1 ? 's' : ''}
                                    </button>
                                )}
                                {isExpanded && c.items && c.items.length > 0 && (
                                    <div className="mt-2 border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-medium text-neutral-500">Category</th>
                                                    <th className="text-left px-3 py-2 font-medium text-neutral-500">Description</th>
                                                    <th className="text-left px-3 py-2 font-medium text-neutral-500">Date</th>
                                                    <th className="text-right px-3 py-2 font-medium text-neutral-500">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {c.items.map((item: any) => (
                                                    <tr key={item.id}>
                                                        <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{item.category?.name ?? item.categoryCode}</td>
                                                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">{item.description}</td>
                                                        <td className="px-3 py-2 text-neutral-500">{item.expenseDate ? new Date(item.expenseDate).toLocaleDateString() : '-'}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-primary-700 dark:text-primary-400">{INR.format(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    {canEdit && (
                                        <button
                                            onClick={() => openEditForm(c)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-primary-200 dark:border-primary-800 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Edit
                                        </button>
                                    )}
                                    {c.status === 'DRAFT' && (
                                        <button
                                            onClick={() => handleSubmit(c.id)}
                                            disabled={submitMutation.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Send className="w-3 h-3" />
                                            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button
                                            onClick={() => handleCancel(c.id)}
                                            disabled={cancelMutation.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-danger-200 dark:border-danger-800 text-danger-600 rounded-lg text-xs font-bold hover:bg-danger-50 dark:hover:bg-danger-900/20 disabled:opacity-50 transition-colors"
                                        >
                                            <Ban className="w-3 h-3" />
                                            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
