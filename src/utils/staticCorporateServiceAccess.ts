import { ServicesListResponse } from '@customtypes/general';
// PROTOTYPE-SETUP: local outline icons for the prototype-only sidebar entries (same weight as the others).
import EssIcon from '@assets/icons/Ess.svg';
import OnboardingIcon from '@assets/icons/Onboarding.svg';
import { staticPartnerPermissions } from '@domains/admin/settings/utils/staticPartnerPermissions';

/**
 * TEMPORARY static corporate `serviceAccess` data reflecting the new flattened
 * structure — the `"More Services"` category is removed and its services sit at
 * the top level, each carrying `enableMoreService: true` (and an `icon` slot).
 *
 * Used while the backend `user/services/serviceAccess` change is pending. Derived
 * from the shared partner catalogue (`staticPartnerPermissions`) so the admin and
 * corporate mocks stay in sync. Remove this file and switch back to the live
 * `getUserServices()` response once the backend returns the flattened shape.
 *
 * NOTE: every service is marked `hasAccess: true` so the flattened structure is
 * fully visible during development; the backend will drive real access per user.
 */
// PROTOTYPE-SETUP: SIDEBAR_MODE "only-this-module" — only these services keep access, so the sidebar and
// CorporateAccessGuard show Payroll, ESS and Onboarding. Every other service stays in the list (hasAccess: false).
export const PROTOTYPE_SERVICE_LABELS = ['Payroll', 'ESS', 'Onboarding'];

// PROTOTYPE-SETUP: prototype-only entries. ESS mounts the employee portal at /ess, Onboarding the setup
// flows at /onboarding (routes derived from the label via toServiceRoute).
const PROTOTYPE_SERVICES: ServicesListResponse['data'] = [
    {
        serviceCategory: 'ESS',
        label: 'ESS',
        alias: 'Employee Self-Service',
        hasAccess: true,
        services: [],
        subServices: [],
        enableMoreService: false,
        icon: EssIcon,
    },
    {
        serviceCategory: 'Onboarding',
        label: 'Onboarding',
        hasAccess: true,
        services: [],
        subServices: [],
        enableMoreService: false,
        icon: OnboardingIcon,
    },
];

const hasPrototypeAccess = (label: string) => PROTOTYPE_SERVICE_LABELS.includes(label);

export const staticCorporateServiceAccess: ServicesListResponse['data'] = [
    ...staticPartnerPermissions.map(permission => ({
        serviceCategory: permission.label,
        label: permission.label,
        hasAccess: hasPrototypeAccess(permission.label),
        services: [],
        subServices: (permission.subServices ?? []).map(subService => ({
            label: subService.label,
            hasAccess: hasPrototypeAccess(permission.label),
        })),
        enableMoreService: permission.enableMoreService ?? false,
        icon: permission.icon ?? '',
    })),
    ...PROTOTYPE_SERVICES,
];

export default staticCorporateServiceAccess;
