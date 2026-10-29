import { useEffect, useState } from 'react';

import { DEMO_REQUIRED_ONBOARDING_DOCUMENTS } from '@src/prototype/demoEmployee';
import { useEssAuth } from '@src/prototype/essSession';

import { RequiredOnboardingDocument, getRequiredOnboardingDocuments } from '../api/onboarding';

// Fetches the HR-configured documents this employee must upload during onboarding.
export const useRequiredOnboardingDocuments = () => {
    // PROTOTYPE-SETUP: ESS identity comes from useEssAuth (DEMO_EMPLOYEE when there is no token).
    const { role, id, token } = useEssAuth();
    const [documents, setDocuments] = useState<RequiredOnboardingDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // PROTOTYPE-SETUP: no token -> the demo HR configuration (documents + bank), so every step renders.
        if (!token) {
            setDocuments(DEMO_REQUIRED_ONBOARDING_DOCUMENTS);
            setLoading(false);
            return undefined;
        }
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
    }, [role, id, token]);

    return { documents, loading };
};
