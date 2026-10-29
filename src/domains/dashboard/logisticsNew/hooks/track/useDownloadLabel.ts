import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { downloadLabelApi } from '../../api';

export const useDownloadLabel = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadLabel = useCallback(
        async (trackingNumber: string) => {
            setIsLoading(true);

            const data = await downloadLabelApi({
                userType: role,
                userId: id,
                trackingNumber,
            });

            if (data && data.labelUrl) {
                window.open(data.labelUrl, '_blank');
            } else {
                dispatch(
                    showToast({
                        description: 'Failed to download label.',
                        variant: 'error',
                    })
                );
            }

            setIsLoading(false);
            return data;
        },
        [id, role, dispatch]
    );

    return {
        isLoading,
        handleDownloadLabel,
    };
};
