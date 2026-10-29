import { useCallback, useEffect, useState } from 'react';

import { PrivacyPolicyItem } from './usePrivacyPolicyDetailsApi';
import { getUserPrivacyPolicies } from '../api';

export default function useUserPrivacyPoliciesApi() {
    const [userPrivacyPolicies, setUserPrivacyPolicies] = useState<PrivacyPolicyItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserPrivacyPolicies = useCallback(async () => {
        setIsLoading(true);
        const data: PrivacyPolicyItem[] | false = await getUserPrivacyPolicies();
        if (data) {
            setUserPrivacyPolicies(data);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchUserPrivacyPolicies();
    }, [fetchUserPrivacyPolicies]);

    return { userPrivacyPolicies, isLoading };
}
