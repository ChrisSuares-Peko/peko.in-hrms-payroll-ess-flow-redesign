import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEmailDomainPlans } from '../api/index';
import { EmailDomainPlansResponse, EmailDomainPlans, EmailDomain } from '../types/types';

export default function useEmailDomainPlansApi(productId: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [plansData, setPlansData] = useState<EmailDomainPlans[]>([]);
    const [productData, setProductData] = useState<EmailDomain | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getEmailDomainPlansList = useCallback(async () => {
        setIsLoading(true);
        const data: EmailDomainPlansResponse | false = await getEmailDomainPlans({
            userId: id,
            userType: role,
            productId,
        });
        if (data) {
            setPlansData(data.planDatas);
            setProductData(data.productData);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role, productId]);

    useEffect(() => {
        getEmailDomainPlansList();
    }, [getEmailDomainPlansList]);

    return { plansData, productData, isLoading };
}
