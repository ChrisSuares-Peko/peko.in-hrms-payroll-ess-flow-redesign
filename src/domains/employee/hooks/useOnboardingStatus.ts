import { useCallback, useEffect, useState } from 'react';

import { holdsPayrollMembership } from '@src/domains/dashboard/corporateCards/utils/activeRole';
import { useAppSelector } from '@src/hooks/store';

import { EmployeeProfile, getEmployeeProfile } from '../api/onboarding';

// Completion is a real backend flag (Employee.isCompleted), set once the Emergency
// Contact step succeeds — unlike AE, which infers it client-side from field presence.
export const useOnboardingStatus = () => {
    const { role, id, serviceMemberships } = useAppSelector(state => state.reducer.auth);
    const holdsPayroll = holdsPayrollMembership(role, serviceMemberships);
    const [loading, setLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);

    const load = useCallback(async () => {
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
    }, [role, id, holdsPayroll]);

    useEffect(() => {
        load();
    }, [load]);

    return { loading, isComplete, profile, reload: load };
};
