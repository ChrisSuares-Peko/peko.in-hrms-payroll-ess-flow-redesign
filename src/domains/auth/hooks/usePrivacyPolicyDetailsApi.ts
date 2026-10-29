import { useCallback, useEffect, useState } from 'react';

import { getEnforcePrivacyPolicy, getPrivacyPolicyDetails } from '../api';

export type PrivacyPolicyItem = {
    id: number;
    privacyPolicyRegistrationText: string;
    effectiveFrom: string;
    status: string;
    isMandatory: number;
    hyperLinkText?: string;
    validationText?: string;
};

export default function usePrivacyPolicyDetailsApi() {
    const [isLoading, setIsLoading] = useState(false);
    const [privacyPolicyDetails, setPrivacyPolicyDetails] = useState<PrivacyPolicyItem[]>([]);

    const fetchPrivacyPolicyDetails = useCallback(async () => {
        setIsLoading(true);

        const enforceResponse = await getEnforcePrivacyPolicy();
        const shouldEnforce = enforceResponse?.data?.enforcePrivacyPolicy === true;

        if (shouldEnforce) {
            const response = await getPrivacyPolicyDetails();
            setPrivacyPolicyDetails(response?.data ?? []);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchPrivacyPolicyDetails();
    }, [fetchPrivacyPolicyDetails]);

    return { privacyPolicyDetails, isLoading };
}
