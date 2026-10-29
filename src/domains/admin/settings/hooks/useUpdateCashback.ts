import { useCallback, useState } from 'react';

import { SuccessGenericResponse } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { cashbackServiceProviderApi, createCashbackApi, updateCashbackApi } from '../api/cashback';
import { ServiceData, newCashback } from '../types/cashback';

const useUpdateCashback = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const updateCurrentCashback = useCallback(
        async (payload: newCashback) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<ServiceData> | false = await updateCashbackApi({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const createNewCashback = useCallback(
        async (payload: newCashback) => {
            setIsLoading(true);
            const data: SuccessGenericResponse<ServiceData> | false = await createCashbackApi({
                userId: id,
                userType: role,
                ...payload,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );
    const getCashbackServiceProvider = useCallback(
        async (payload: any, partnerId: string | null, packageId: string | null) => {
            const operatorIds = payload;
            setIsLoading(true);
            const data: SuccessGenericResponse<any> | false = await cashbackServiceProviderApi({
                userId: id,
                userType: role,
                operatorIds,
                partnerId,
                packageId,
            });
            if (data) {
                return data;
            }
            setIsLoading(false);
            return false;
        },
        [id, role]
    );

    return { isLoading, createNewCashback, updateCurrentCashback, getCashbackServiceProvider };
};

export default useUpdateCashback;
