Implement a complete tenant-onboarding refactor for BOTH web and mobile to support:
1) Early location strategy decision,
2) Per-location configuration across operational steps,
3) Per-location tax configuration,
4) Per-location COMMERCIAL billing (modules + tier/pricing billed per location).

Codebase:
- Web: web-system-app/src/features/super-admin/tenant-onboarding
- Mobile: mobile-app/src/features/super-admin/tenant-onboarding

====================================================
A) Product goals (must hold true)
====================================================

- Multi-location strategy is selected BEFORE dependent steps.
- Location master is captured early so downstream per-location configs can bind to location IDs.
- Tax registrations can vary per location (e.g., GSTIN per location/state).
- Module selection and pricing are per location (commercial billing scope is per-location).
- Activation blocks completion until every billable location is fully configured.
- Web and mobile behavior must be functionally equivalent.

====================================================
B) Step flow re-order (web + mobile)
====================================================

Refactor onboarding sequence to:

1. Company Identity
2. Statutory & Tax (tenant legal registrations)
3. Address (tenant registered/corporate)
4. Fiscal & Calendar (global defaults)
5. Preferences (global defaults/integrations)
6. Backend Endpoint
7. Configuration Strategy (NEW / extracted from old Step10)
   - Multi-location mode toggle
   - Config mode: common | per-location
   - Billing scope: per-location (enforced for now)
8. Locations Master (moved earlier)
   - create all locations with stable IDs
   - per-location GST/tax profile + address/contact/geo
9. Per-Location Modules (commercial)
10. Per-Location User Tier & Pricing (commercial)
11. Key Contacts (global)
12. Shifts & Time (common/per-location aware)
13. No. Series (common/per-location aware)
14. IOT Reasons (common/per-location aware)
15. System Controls (global + optional per-location operational controls)
16. Users & Access Scope (location-aware user access)
17. Activation & Review (location-wise readiness + billing summary)

If UI constraints require fewer steps, combine sections visually but preserve this dependency order.

====================================================
C) Data model and type changes
====================================================

1) Add reusable scoped config:
- type ScopedConfig<T> = {
    mode: 'common' | 'per-location';
    common: T;
    byLocationId: Record<string, T>;
  }

2) Strategy state:
- multiLocationMode: boolean
- locationConfig: 'common' | 'per-location'
- billingScope: 'per-location' (enforced now; keep enum future-proof)

3) Location model enhancements:
- Keep existing location fields
- Ensure optional tax fields include:
  - gstin
  - stateGST (if used)
  - optional local compliance fields (ptRegLocal, localLabourReg, etc.) as optional

4) Commercial per-location model:
- locationCommercial: Record<locationId, {
    moduleIds: string[];
    customModulePricing?: Record<string, number>; // optional per-location override
    userTier: 'starter' | 'growth' | 'scale' | 'enterprise' | 'custom';
    customUserLimit?: string;
    customTierPrice?: string;
    billingCycle: 'monthly' | 'annual';
    trialDays: string;
  }>

5) Operational scoped models:
- shiftsConfig: ScopedConfig<StepShiftsData>
- noSeriesConfig: ScopedConfig<StepNoSeriesData>
- iotConfig: ScopedConfig<StepIOTData>
- operationalControlsConfig: ScopedConfig<{
    ncEditMode: boolean;
    loadUnload: boolean;
    cycleTime: boolean;
    overtimeApproval: boolean;
  }>

6) Global controls remain tenant-level:
- mfa, backdatedEntry, docNumberLock, payrollLock, leaveCarryForward (and any truly global controls)

7) User model:
- homeLocationId?: string
- allowedLocationIds?: string[]

====================================================
D) Behavioral rules
====================================================

1) Strategy-first:
- If multiLocationMode=false:
  - treat locationConfig effectively as common
  - still maintain one location (HQ) for consistency

2) Mode switching:
- common -> per-location:
  - seed byLocationId for every location from common config
- per-location -> common:
  - show confirm dialog
  - choose baseline location or keep existing common
  - prevent silent data loss

3) Location lifecycle:
- On location add:
  - initialize defaults in locationCommercial and all ScopedConfig.byLocationId (if per-location)
- On location remove:
  - remove keys from all location maps
  - recompute totals
  - keep HQ reassignment logic stable
- On location deactivate:
  - mark non-billable (or follow business rule if soft-billing required)

4) Per-location modules:
- module dependencies resolved within each location’s moduleIds
- each billable location must have at least one module

5) Per-location billing:
- billing totals are sums of per-location subtotals
- annual discount applied per location
- no tenant-level module/tier billing summary as source-of-truth anymore

====================================================
E) Validation rules
====================================================

Update zod/schema validations in web and mobile:

1) Commercial completeness (per billable location):
- moduleIds.length >= 1
- valid tier config
- valid billingCycle
- valid trialDays

2) Per-location tax completeness:
- require GSTIN when location marked GST-registered (or per your rule)
- validate GST format at location level

3) Scoped config completeness (if per-location mode):
- each active location must have valid shifts/no-series/iot/operational-controls config
- no stale/orphan location IDs in maps

4) User access:
- in multi-location mode, non-empty allowedLocationIds for users
- Company Admin defaults to all active locations

5) Activation guard:
- block final submit until all required location-level sections are complete

====================================================
F) UI/UX changes by step
====================================================

1) Strategy step:
- clearly explain:
  - common vs per-location behavior
  - per-location billing model
- add warning that downstream configuration depends on this choice

2) Locations step:
- keep rich location data (HQ, GST, address, geo, contact)
- ensure location IDs are stable and available to later steps

3) Per-location Modules step:
- location selector (tabs/dropdown)
- module cards similar to current UX
- per-location module dependency badges
- actions:
  - copy current location config to all
  - copy from another location

4) Per-location Tier/Pricing step:
- location selector
- tier selection + custom pricing per selected location
- show location subtotal monthly/annual
- show global aggregate totals panel

5) Operational steps (shifts/no-series/iot/controls):
- shared scaffold:
  - mode indicator
  - location selector in per-location mode
  - copy/apply-to-all actions
- keep editors mostly reused, bind to active scope slice

6) Users step:
- add home location + allowed locations controls
- role-sensitive defaults (Company Admin -> all locations)

7) Activation step:
- add location-wise readiness matrix:
  - tax
  - modules
  - tier/pricing
  - shifts
  - no-series
  - iot
  - controls
  - users scope
- show bill preview:
  - each location monthly/annual
  - grand monthly/annual
- block create with explicit missing items per location

====================================================
G) Store, migration, and payload contracts
====================================================

1) Store/state refactor:
- update web zustand store + types
- update mobile state containers + types

2) Migration for old drafts/state:
- old tenant-level module/tier -> migrate to locationCommercial:
  - seed from HQ and apply-to-all OR clone to all active locations (pick one rule and apply consistently)
- old global shifts/no-series/iot/controls -> ScopedConfig.common
- old Step10 locationConfig -> new strategy state
- ensure migration is idempotent and safe

3) Payload contract for create tenant:
- send:
  {
    strategy: { multiLocationMode, locationConfig, billingScope: 'per-location' },
    locations: [...],
    locationCommercial: [...derived list by locationId...],
    scopedOperationalConfigs: {...},
    globalControls: {...},
    users: [...]
  }

4) Billing preview payload:
- include per-location subtotal + grand totals
- include billing cycle and trial metadata per location

====================================================
H) Files likely to modify
====================================================

Web:
- constants.ts
- types.ts
- store.ts
- TenantOnboardingWizard.tsx
- Step files for strategy/locations/modules/tier/contacts/shifts/no-series/iot/controls/activation
- validation/schema modules

Mobile:
- constants.ts
- types.ts
- schemas.ts
- index.tsx
- step files for strategy/locations/modules/tier/contacts/shifts/no-series/iot/controls/users/activation

====================================================
I) Acceptance criteria
====================================================

1) Strategy + locations are captured before any per-location-dependent step.
2) Modules and pricing are truly per-location and contribute to billing totals per location.
3) Tax configuration supports per-location GST/compliance details.
4) Shifts/no-series/iot/operational-controls support common and per-location modes.
5) Users can be scoped to locations.
6) Activation blocks incomplete locations and shows actionable errors.
7) Old drafts migrate cleanly without crashes.
8) Web and mobile parity is maintained.

====================================================
J) Testing checklist
====================================================

Unit:
- migration utilities
- per-location pricing calculators
- dependency resolution per location
- location add/remove cleanup across all maps
- validation rules

Integration:
- step reorder navigation
- mode switching common <-> per-location
- copy/apply-to-all flows
- activation blocking and successful submit

Manual:
- single-location onboarding
- multi-location common mode
- multi-location per-location with different tax/modules/tier configs
- deactivate/remove location and verify totals + configs
- verify grand totals and per-location bill summary accuracy