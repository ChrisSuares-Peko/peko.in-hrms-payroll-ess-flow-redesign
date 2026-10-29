import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { refetchDomainHostingPricing } from '../../api/domainHostingPlans';

const useRefetchDomainHostingPricing = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const refetchPricing = useCallback(async () => {
        setIsLoading(true);
        const data = await refetchDomainHostingPricing({ userId: id, userType: role });
        setIsLoading(false);
        return data;
    }, [id, role]);

    return { isLoading, refetchPricing };
};

export default useRefetchDomainHostingPricing;
