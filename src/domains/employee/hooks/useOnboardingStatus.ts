import { useCallback, useEffect, useState } from 'react';

import { holdsPayrollMembership } from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { buildDemoEmployeeProfile } from '@src/prototype/demoEmployee';
import { useEssAuth, useIsEssOnboardingRoute } from '@src/prototype/essSession';

import { EmployeeProfile, getEmployeeProfile } from '../api/onboarding';

// Completion is a real backend flag (Employee.isCompleted), set once the Emergency
// Contact step succeeds — unlike AE, which infers it client-side from field presence.
export const useOnboardingStatus = () => {
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, id, serviceMemberships, token } = useEssAuth();
    const isOnboardingRoute = useIsEssOnboardingRoute();
    const holdsPayroll = holdsPayrollMembership(role, serviceMemberships);
    const [loading, setLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);

    const load = useCallback(async () => {
        // PROTOTYPE-SETUP: no token -> DEMO_EMPLOYEE. Status follows the route: "in progress" under
        // /onboarding/ess/* so every step renders, "completed" under /ess/* so Home doesn't redirect.
        if (!token) {
            const demo = buildDemoEmployeeProfile(!isOnboardingRoute);
            setProfile(demo);
            setIsComplete(Boolean(demo.isCompleted));
            setLoading(false);
            return;
        }
        // Avoid firing employee-only requests during a role switch.
        if (role !== 'user') return;
        // Without Payroll there is no onboarding to be part-way through, and the endpoint 404s.
        if (!holdsPayroll) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await getEmployeeProfile({ userType: role, userId: id });
            setProfile(data);
            setIsComplete(Boolean(data?.isCompleted));
        } catch {
            setIsComplete(false);
        } finally {
            setLoading(false);
        }
    }, [role, id, holdsPayroll, token, isOnboardingRoute]);

    useEffect(() => {
        load();
    }, [load]);

    return { loading, isComplete, profile, reload: load };
};
