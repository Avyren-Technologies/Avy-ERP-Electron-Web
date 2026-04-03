import { AlertTriangle, Home, Building, Blocks } from "lucide-react";
import companyLogo from "@/assets/logo/Company-Logo.png";

const MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || 'avyren.in';

export function TenantNotFoundScreen() {
    // Attempt to extract the tenant slug requested for a more personalized message
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    let requestedWorkspace = "This workspace";
    if (parts.length >= 3) {
        requestedWorkspace = `The workspace "${parts[0]}"`;
    } else if (isLocalhost) {
        requestedWorkspace = "The requested local workspace";
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-neutral-50 dark:bg-neutral-950">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200/50 via-neutral-50 to-neutral-50 dark:from-neutral-800/50 dark:via-neutral-950 dark:to-neutral-950" />

            {/* Decorative blobbies */}
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-danger-500/10 dark:bg-danger-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] bg-warning-500/10 dark:bg-warning-500/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg mx-4">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-3xl border border-white/60 dark:border-neutral-800 shadow-2xl shadow-black/5 dark:shadow-black/20 rounded-[2.5rem] p-10 md:p-12 text-center overflow-hidden">

                    {/* Their own company logo */}
                    <div className="mb-10 flex justify-center">
                        <img src={companyLogo} alt="Company Logo" className="h-64 sm:h-64 w-auto max-w-[500px] object-contain drop-shadow-md animate-in fade-in zoom-in duration-500" />
                    </div>

                    {/* Illustration / Icon Box */}
                    <div className="relative flex justify-center mb-8">
                        <div className="absolute inset-0 bg-warning-500/20 blur-2xl rounded-full" />
                        <div className="relative w-28 h-28 bg-gradient-to-br from-white to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-[2rem] border-2 border-white dark:border-neutral-700 shadow-xl flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
                            <Blocks className="w-10 h-10 text-neutral-200 dark:text-neutral-700 absolute top-4 left-4" />
                            <div className="absolute right-3 bottom-3 w-8 h-8 bg-warning-100 dark:bg-warning-900/50 rounded-xl flex items-center justify-center shadow-sm border border-warning-200 dark:border-warning-800/50">
                                <AlertTriangle className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                            </div>
                            <Building className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mt-2 mr-2" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
                        Company Not Found
                    </h1>

                    <p className="text-neutral-500 dark:text-neutral-400 text-[15px] leading-relaxed mb-8">
                        {requestedWorkspace} could not be found or you don't have access to it. Please check the URL for typos and try again.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-3.5 rounded-xl font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors flex-1"
                        >
                            Go Back
                        </button>
                        <a
                            href={`https://${MAIN_DOMAIN}`}
                            className="px-6 py-3.5 rounded-xl font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 flex-1 group"
                        >
                            <Home className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
                            <span>Return Home</span>
                        </a>
                    </div>
                </div>

                {/* Powered by Avyren technologies */}
                <div className="mt-8 text-center animate-in fade-in duration-1000 delay-300">
                    <p className="text-[13px] font-medium text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5">
                        <span>Powered by</span>
                        <a
                            href="https://avyrentechnologies.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 font-bold transition-colors"
                        >
                            Avyren Technologies
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
