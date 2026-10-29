import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createDomainHostingPlan, updateDomainHostingPlan } from '../../api/domainHostingPlans';
import { DomainHostingPlan } from '../../types/domainHostingPlan';

const useCreateDomainHostingPlan = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const createPlan = useCallback(
        async (payload: DomainHostingPlan) => {
            setIsLoading(true);
            const data: any | false = await createDomainHostingPlan({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    const updatePlan = useCallback(
        async (payload: DomainHostingPlan) => {
            setIsLoading(true);
            const data: any | false = await updateDomainHostingPlan({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    return { isLoading, createPlan, updatePlan };
};

export default useCreateDomainHostingPlan;
