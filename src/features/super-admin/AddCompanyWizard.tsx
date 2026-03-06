import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2,
    MapPin,
    Server,
    Users,
    Blocks,
    ArrowRight,
    ArrowLeft,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomLoader } from "@/components/ui/CustomLoader";

const STEPS = [
    { id: 1, title: "Company", icon: Building2 },
    { id: 2, title: "Address", icon: MapPin },
    { id: 3, title: "Endpoint", icon: Server },
    { id: 4, title: "Limits", icon: Users },
    { id: 5, title: "Modules", icon: Blocks },
];

export function AddCompanyWizard() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = () => {
        if (currentStep < 5) setCurrentStep(c => c + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(c => c - 1);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            navigate("/app/companies");
        }, 1500);
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">

            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Add New Tenant</h1>
                <p className="text-neutral-500 mt-2">Provision a new workspace and assign modules</p>
            </div>

            <div className="bg-white rounded-3xl border border-neutral-100 shadow-2xl shadow-neutral-200/50 overflow-hidden">

                {/* Progress Tracker (Desktop Optimized) */}
                <div className="bg-neutral-50 border-b border-neutral-100 p-6 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 bg-neutral-200 rounded-full z-0 hidden sm:block">
                        <div
                            className="h-full bg-primary-500 transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between w-full relative z-10 px-4 sm:px-0">
                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isPast = step.id < currentStep;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300",
                                            isActive ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110" :
                                                isPast ? "bg-primary-100 text-primary-600" :
                                                    "bg-white border-2 border-neutral-200 text-neutral-400"
                                        )}
                                    >
                                        {isPast ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-wider hidden sm:block",
                                        isActive ? "text-primary-600" : isPast ? "text-neutral-900" : "text-neutral-400"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Wizard Form Content Area */}
                <div className="p-8 min-h-[400px]">
                    {/* STEP 1: Company Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2 mb-6">
                                <Building2 className="w-5 h-5 text-primary-500" />
                                Company Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-900">Company Name</label>
                                    <input type="text" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" placeholder="e.g. Apex Manufacturing" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-900">Industry Sector</label>
                                    <select className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-neutral-700">
                                        <option>Select Industry</option>
                                        <option>Automotive</option>
                                        <option>Steel & Metal</option>
                                        <option>Textiles</option>
                                        <option>Electronics</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-900">Admin Email</label>
                                    <input type="email" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" placeholder="admin@company.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-neutral-900">Admin Phone</label>
                                    <input type="tel" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all" placeholder="+91 9876543210" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fallback steps for demo brevity */}
                    {currentStep > 1 && currentStep < 5 && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center animate-in slide-in-from-right-4 duration-300">
                            <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mb-6 border border-neutral-100">
                                {currentStep === 2 && <MapPin className="w-8 h-8 text-neutral-400" />}
                                {currentStep === 3 && <Server className="w-8 h-8 text-neutral-400" />}
                                {currentStep === 4 && <Users className="w-8 h-8 text-neutral-400" />}
                            </div>
                            <h2 className="text-xl font-bold text-neutral-900 mb-2">Step {currentStep} Configuration</h2>
                            <p className="text-neutral-500 max-w-sm">
                                (This form renders exactly like the mobile app wizard steps, adapted for wide screen columns.)
                            </p>
                        </div>
                    )}

                    {/* STEP 5: Final Review */}
                    {currentStep === 5 && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center animate-in slide-in-from-right-4 duration-300">
                            <div className="w-20 h-20 bg-gradient-to-tr from-success-100 to-success-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-success-500/10">
                                <Blocks className="w-10 h-10 text-success-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Ready to Provision Tenant</h2>
                            <p className="text-neutral-500 max-w-sm">
                                Company profile, server endpoints, and 8 active modules have been configured successfully.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
                    <button
                        onClick={currentStep === 1 ? () => navigate("/app/companies") : handlePrev}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-neutral-600 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    >
                        {currentStep === 1 ? "Cancel" : (
                            <>
                                <ArrowLeft className="w-4 h-4" /> Back
                            </>
                        )}
                    </button>

                    {currentStep === 5 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center justify-center min-w-[160px] gap-2 px-8 py-3 bg-success-600 hover:bg-success-700 text-white rounded-xl font-bold shadow-lg shadow-success-500/20 transition-all disabled:opacity-70"
                        >
                            {isSubmitting ? <CustomLoader size="sm" className="brightness-200" /> : "Complete Setup"}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="group flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
