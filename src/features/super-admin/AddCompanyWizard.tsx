// ============================================================
// AddCompanyWizard — wrapper that opens the new full-screen wizard
// ============================================================
import { useNavigate } from 'react-router-dom';
import { TenantOnboardingWizard } from './tenant-onboarding/TenantOnboardingWizard';
import { showSuccess } from '@/lib/toast';

export function AddCompanyWizard() {
    const navigate = useNavigate();

    return (
        <TenantOnboardingWizard
            onClose={() => navigate('/app/companies')}
            onSuccess={(_name) => {
                showSuccess('Company Created', 'Tenant onboarded successfully.');
                navigate('/app/companies');
            }}
        />
    );
}
