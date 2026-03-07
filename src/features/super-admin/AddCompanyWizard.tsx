// ============================================================
// AddCompanyWizard — wrapper that opens the new full-screen wizard
// ============================================================
import { useNavigate } from 'react-router-dom';
import { TenantOnboardingWizard } from './tenant-onboarding/TenantOnboardingWizard';

export function AddCompanyWizard() {
    const navigate = useNavigate();

    return (
        <TenantOnboardingWizard
            onClose={() => navigate('/app/companies')}
            onSuccess={(_name) => {
                // TODO: show toast notification
                navigate('/app/companies');
            }}
        />
    );
}
