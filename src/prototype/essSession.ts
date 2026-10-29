// PROTOTYPE-SETUP: ESS identity + route helpers for the prototype.
// ESS pages are mounted under /ess/* (and onboarding under /onboarding/ess/*) inside the corporate
// dashboard layout, while the logged-in user stays the corporate MOCK_AUTHENTICATED_USER.
import { useCallback } from 'react';

import { useLocation } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { DEMO_EMPLOYEE } from './demoEmployee';

export const ESS_ROOT = '/ess';
export const ONBOARDING_ROOT = '/onboarding';
export const PAYROLL_ONBOARDING_ROOT = `${ONBOARDING_ROOT}/payroll`;
export const ESS_ONBOARDING_ROOT = `${ONBOARDING_ROOT}/ess`;
export const ESS_ONBOARDING_PROFILE = `${ESS_ONBOARDING_ROOT}/profile-completion`;

const DEMO_PAYROLL_MEMBERSHIP = [
    { label: 'Payroll', hasAccess: true, role: UserRole.EMPLOYEE, status: 'active' },
];

/**
 * Drop-in for `useAppSelector(state => state.reducer.auth)` inside the ESS domain.
 * With a real token (a real employee session) it returns auth untouched. With no token (the
 * prototype) it scopes ESS to DEMO_EMPLOYEE: API URLs are built as `user/<DEMO_EMPLOYEE.id>/...`
 * and the employee name/email come from the demo data. The stored auth state is not changed.
 */
export const useEssAuth = () => {
    const auth = useAppSelector(state => state.reducer.auth);
    if (auth.token || auth.employeeProfileId) return auth;
    return {
        ...auth,
        role: UserRole.EMPLOYEE as string,
        id: DEMO_EMPLOYEE.id,
        employeeProfileId: DEMO_EMPLOYEE.id,
        employeeName: DEMO_EMPLOYEE.name,
        employeeEmail: DEMO_EMPLOYEE.email,
        employeeMobile: DEMO_EMPLOYEE.mobileNo,
        serviceMemberships: DEMO_PAYROLL_MEMBERSHIP,
    };
};

/** True while rendering the ESS onboarding flow (/onboarding/ess/*). */
export const useIsEssOnboardingRoute = () =>
    useLocation().pathname.toLowerCase().startsWith(ESS_ONBOARDING_ROOT);

/**
 * Maps the ESS domain's absolute `/employee/...` links to wherever the page is mounted:
 * /ess/* in the prototype, unchanged inside the real /employee portal.
 */
export const useEssPath = () => {
    const { pathname } = useLocation();
    const lower = pathname.toLowerCase();
    return useCallback(
        (target: string) => {
            const inEss = lower === ESS_ROOT || lower.startsWith(`${ESS_ROOT}/`);
            const inOnboarding = lower.startsWith(ESS_ONBOARDING_ROOT);
            if (!inEss && !inOnboarding) return target;
            if (target === paths.employee.onboarding) return ESS_ONBOARDING_PROFILE;
            if (target === paths.employee.home || target === paths.employee.index) return ESS_ROOT;
            return target.startsWith(`${paths.employee.index}/`)
                ? `${ESS_ROOT}${target.slice(paths.employee.index.length)}`
                : target;
        },
        [lower]
    );
};
