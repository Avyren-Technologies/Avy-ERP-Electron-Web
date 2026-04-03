import { AlertTriangle } from "lucide-react";
import companyLogo from "@/assets/logo/Company-Logo.png";

const MAIN_DOMAIN = import.meta.env.VITE_MAIN_DOMAIN || 'avyerp.avyren.in';

export function TenantNotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img src={companyLogo} alt="Avy ERP" className="h-10 mx-auto" />
        <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-warning-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Company Not Found</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          This company doesn't exist on Avy ERP. Please check the URL and try again.
        </p>
        <a
          href={`https://${MAIN_DOMAIN}`}
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          Visit Avy ERP
        </a>
      </div>
    </div>
  );
}
