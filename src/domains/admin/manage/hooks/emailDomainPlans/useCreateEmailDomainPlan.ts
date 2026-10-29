import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    createEmailDomainPlans,
    getAllProducts,
    updateEmailDomainPlans,
} from '../../api/emailDomainPlans';
import { DropDown, ProductApiResponse, EmailDomainPlans } from '../../types/emailDomainPlan';

const UseCreateEmailDomainPlan = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [allProducts, setAllProducts] = useState<DropDown>([]);

    const createNewEmailDomainPlan = useCallback(
        async (payload: EmailDomainPlans) => {
            setIsLoading(true);
            const data: any | false = await createEmailDomainPlans({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    const updateCurrentEmailDomainPlan = useCallback(
        async (payload: any) => {
            setIsLoading(true);
            const data: any | false = await updateEmailDomainPlans({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return data;
            }
            setIsLoading(false);
            return data;
        },
        [id, role]
    );

    const getProductData = useCallback(async () => {
        setIsLoading(true);
        const data: ProductApiResponse | false = await getAllProducts({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.data.map(product => ({
                value: product.id,
                label: product.name,
            }));
            setAllProducts(arr);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getProductData();
    }, [getProductData]);

    return { isLoading, createNewEmailDomainPlan, updateCurrentEmailDomainPlan, allProducts };
};

export default UseCreateEmailDomainPlan;
