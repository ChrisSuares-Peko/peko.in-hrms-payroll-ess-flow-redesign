import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { RequiredOnboardingDocument, getRequiredOnboardingDocuments } from '../api/onboarding';

// Fetches the HR-configured documents this employee must upload during onboarding.
export const useRequiredOnboardingDocuments = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [documents, setDocuments] = useState<RequiredOnboardingDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Avoid firing employee-only requests during a role switch.
        if (role !== 'user') return undefined;
        let active = true;
        setLoading(true);
        getRequiredOnboardingDocuments({ userType: role, userId: id })
            .then(docs => active && setDocuments(docs ?? []))
            .catch(() => active && setDocuments([]))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [role, id]);

    return { documents, loading };
};
