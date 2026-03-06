import { useParams, Link } from "react-router-dom";
import {
    Building2,
    ArrowLeft,
    Server,
    Users,
    CreditCard,
    AlertTriangle,
    Blocks,
    PowerOff,
    Trash2,
    Calendar,
    Plus,
    ArrowRight
} from "lucide-react";

// Mock Data (matches mobile)
const TENANT = {
    id: 1,
    name: "Apex Manufacturing Pvt. Ltd.",
    status: "Active",
    industry: "Automotive",
    adminEmail: "admin@apex.com",
    adminPhone: "+91 98765 43210",
    address: "Plot 45, MIDC, Pune, Maharashtra",
    gst: "27AABCA1234H1Z5",
    createdAt: "Jan 12, 2026",
    serverType: "custom",
    customUrl: "https://erp.apex.com/api",
    users: 156,
    maxUsers: 200,
    modules: 8,
    tier: "Growth",
    amount: "₹18,500/mo",
    renewalDate: "Apr 12, 2026",
    customPricing: false,
};

const ACTIVE_MODULES = [
    "Masters", "Security", "HR Management", "Production",
    "Machine Maintenance", "Inventory", "Vendor Management", "Sales & Invoicing"
];

export function CompanyDetailScreen() {
    useParams(); // Kept for future use if needed, but avoiding the unused destructured variable error

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">

            {/* Breadcrumbs & Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/app/companies" className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
                        <Link to="/app/companies" className="hover:text-primary-600">Companies</Link>
                        <span>/</span>
                        <span className="text-neutral-900">Tenant Details</span>
                    </div>
                </div>
            </div>

            {/* Main Header Card */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xl shadow-neutral-200/40 overflow-hidden">
                {/* Gradient Top */}
                <div className="h-24 w-full bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500" />

                {/* Profile Info */}
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex items-end gap-5 -mt-10">
                            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg shadow-neutral-900/10">
                                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-primary-100 to-accent-100 border border-primary-200/50 flex items-center justify-center">
                                    <Building2 className="w-10 h-10 text-primary-600" />
                                </div>
                            </div>
                            <div className="mb-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold text-neutral-900">{TENANT.name}</h1>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-success-50 text-success-700 border-success-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                                        {TENANT.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-neutral-500 font-medium">
                                    <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">{TENANT.industry}</span>
                                    <span>ID: {TENANT.id}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Header */}
                        <div className="flex gap-6 border-t md:border-t-0 border-neutral-100 pt-4 md:pt-0">
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Users</p>
                                <p className="text-lg font-bold text-neutral-900">{TENANT.users} <span className="text-sm text-neutral-400 font-medium">/ {TENANT.maxUsers}</span></p>
                            </div>
                            <div className="w-px h-10 bg-neutral-200 hidden md:block" />
                            <div>
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Modules</p>
                                <p className="text-lg font-bold text-neutral-900">{TENANT.modules} <span className="text-sm text-neutral-400 font-medium active">active</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Layout for Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Company & Admin Info */}
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-neutral-400" />
                            Company Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-sm text-neutral-400 mb-1">Admin Email</p>
                                <p className="text-base font-semibold text-neutral-900">{TENANT.adminEmail}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-400 mb-1">Admin Phone</p>
                                <p className="text-base font-semibold text-neutral-900">{TENANT.adminPhone}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-neutral-400 mb-1">HQ Address</p>
                                <p className="text-base font-medium text-neutral-900">{TENANT.address}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-400 mb-1">GST Number</p>
                                <p className="text-base font-medium text-neutral-900">{TENANT.gst}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-400 mb-1">Created Date</p>
                                <p className="text-base font-medium text-neutral-900">{TENANT.createdAt}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Limits & Capacity */}
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-neutral-400" />
                                User Limits
                            </h2>
                            <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                                Edit Limit
                            </button>
                        </div>

                        <div className="flex items-center gap-8 mb-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-3xl font-extrabold text-neutral-900">
                                        {TENANT.users}
                                        <span className="text-lg text-neutral-400 font-medium ml-1 block sm:inline">active users</span>
                                    </span>
                                    <span className="text-sm font-bold text-neutral-500">Max Cap: {TENANT.maxUsers}</span>
                                </div>
                                <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                                        style={{ width: `${(TENANT.users / TENANT.maxUsers) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-neutral-500">
                            This limit overrides standard tier thresholds. System blocks new registrations when reached.
                        </p>
                    </div>

                    {/* Server Endpoint */}
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <Server className="w-5 h-5 text-neutral-400" />
                                Server Endpoint
                            </h2>
                            <button className="text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 px-3 py-1.5 rounded-lg transition-colors">
                                Configure
                            </button>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary-100 bg-primary-50">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                                <Server className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-primary-950">Custom Self-Hosted Server</p>
                                    <span className="px-2 py-0.5 text-[10px] uppercase font-bold text-success-700 bg-success-100 rounded-full">Connected</span>
                                </div>
                                <p className="text-sm text-primary-700 font-mono bg-white inline-block px-2 py-1 rounded border border-primary-200 mt-1">{TENANT.customUrl}</p>
                                <p className="text-xs text-primary-600 mt-2">All mobile and web clients for this tenant will route traffic to this base URL.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                    {/* Subscription Info */}
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm relative overflow-hidden">
                        {/* Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success-100 to-transparent rounded-bl-full opacity-50 pointer-events-none" />

                        <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-neutral-400" />
                            Subscription
                        </h2>

                        <div className="mb-6">
                            <p className="text-sm text-neutral-500 font-medium mb-1">Current Plan</p>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-neutral-900">{TENANT.tier}</span>
                                {TENANT.customPricing && (
                                    <span className="px-2 py-1 text-xs font-bold text-accent-700 bg-accent-50 rounded-md">Custom Price</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                                <span className="text-sm text-neutral-500">Monthly Amount</span>
                                <span className="font-bold text-neutral-900">{TENANT.amount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-neutral-500">Next Renewal</span>
                                <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                    {TENANT.renewalDate}
                                </span>
                            </div>
                        </div>

                        <button className="w-full mt-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold rounded-xl text-sm transition-colors">
                            View Billing History
                        </button>
                    </div>

                    {/* Active Modules */}
                    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                                <Blocks className="w-5 h-5 text-neutral-400" />
                                Active Modules
                            </h2>
                            <button className="text-sm text-primary-600 font-semibold hover:text-primary-700">Manage</button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {ACTIVE_MODULES.map(m => (
                                <div key={m} className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 font-medium whitespace-nowrap">
                                    {m}
                                </div>
                            ))}
                            <div className="px-3 py-1.5 border border-dashed border-neutral-300 rounded-lg text-sm text-neutral-400 font-medium flex items-center gap-1 cursor-pointer hover:bg-neutral-50">
                                <Plus className="w-4 h-4" />
                                Assign More
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-2xl border border-danger-200 p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-danger-50 to-transparent rounded-bl-full opacity-50 pointer-events-none" />

                        <h2 className="text-lg font-bold text-danger-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-danger-500" />
                            Tenant Actions
                        </h2>

                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-danger-100 hover:bg-danger-50 text-danger-700 rounded-xl transition-colors text-sm font-semibold group">
                                <div className="flex items-center gap-2">
                                    <PowerOff className="w-4 h-4" />
                                    Suspend Access
                                </div>
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>
                            <button className="w-full flex items-center justify-between px-4 py-3 bg-danger-600 hover:bg-danger-700 text-white rounded-xl transition-colors text-sm font-bold shadow-md shadow-danger-500/20 group">
                                <div className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Delete Tenant
                                </div>
                                <span className="text-xs font-medium bg-danger-800/50 px-2 py-0.5 rounded text-danger-50">No Recovery</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
