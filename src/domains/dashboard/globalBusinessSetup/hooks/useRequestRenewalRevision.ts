import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { requestRenewalRevision } from '../api/globalBusinessSetup';

const useRequestRenewalRevision = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isRequesting, setIsRequesting] = useState(false);

    const request = async (renewalId: string) => {
        setIsRequesting(true);
        try {
            const res = await requestRenewalRevision({
                userId: id,
                userType: role,
                id: renewalId,
            });
            if (res) {
                dispatch(
                    showToast({
                        description: 'Revision requested.',
                        variant: 'success',
                    })
                );
                return res;
            }
            dispatch(
                showToast({
                    description: 'Failed to request revision. Please try again.',
                    variant: 'error',
                })
            );
            return null;
        } finally {
            setIsRequesting(false);
        }
    };

    return { request, isRequesting };
};

export default useRequestRenewalRevision;
