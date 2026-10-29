import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { onboardVirtualAccountApi } from '../api/virtualAccount';
import { OnboardVirtualAccountPayload, VirtualAccountRecord } from '../types/virtualAccount';

export default function useVirtualAccountApi() {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const onboard = async (
        values: OnboardVirtualAccountPayload
    ): Promise<VirtualAccountRecord | false> => {
        setIsLoading(true);
        const resp = await onboardVirtualAccountApi({
            ...values,
            userId: id,
            userType: role,
        });
        setIsLoading(false);

        if (resp) {
            dispatch(
                showToast({
                    description: 'Virtual account created successfully',
                    variant: 'success',
                })
            );
        }
        return resp;
    };

    return { onboard, isLoading };
}
