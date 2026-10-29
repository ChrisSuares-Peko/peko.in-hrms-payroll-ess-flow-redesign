import { useCallback, useEffect, useState } from 'react';

import { holdsPayrollMembership } from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { buildDemoEmployeeProfile } from '@src/prototype/demoEmployee';
import { useEssAuth, useIsEssOnboardingRoute } from '@src/prototype/essSession';

import { EmployeeProfile, getEmployeeProfile } from '../api/onboarding';

// Local-state fetch (matches useOnboardingStatus.ts's pattern) rather than a
// Redux slice — this domain doesn't use Redux for employee data anywhere else.
export const useEmployeeProfile = () => {
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, id, serviceMemberships, token } = useEssAuth();
    const isOnboardingRoute = useIsEssOnboardingRoute();
    const holdsPayroll = holdsPayrollMembership(role, serviceMemberships);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);

    const load = useCallback(async () => {
        // PROTOTYPE-SETUP: no token -> profile built from DEMO_EMPLOYEE instead of exiting on the role check.
        if (!token) {
            setProfile(buildDemoEmployeeProfile(!isOnboardingRoute));
            setLoading(false);
            return;
        }
        // Avoid firing employee-only requests during a role switch.
        if (role !== 'user') return;
        // An employee who holds only Corporate Cards has no payroll record at all, so this endpoint
        // answers 404 for them. Asking at all is the bug, not the 404.
        if (!holdsPayroll) {
            setProfile(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await getEmployeeProfile({ userType: role, userId: id });
            setProfile(data);
        } catch {
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, [role, id, holdsPayroll, token, isOnboardingRoute]);

    useEffect(() => {
        load();
    }, [load]);

    return { loading, profile, reload: load };
};
