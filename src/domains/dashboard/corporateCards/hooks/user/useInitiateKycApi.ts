import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { initiateKycFull } from '../../api/user/kycApi';
import { setKycStage } from '../../slices/corporateCardsSlice';

export const useInitiateKycApi = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleInitiateKyc = async () => {
        setSubmitLoading(true);
        const res = await initiateKycFull(role, id);
        if (res) {
            if (res.data?.alreadyCompleted || res.data?.state === 'COMPLETED') {
                dispatch(setKycStage('verified'));
            } else {
                const webLink = res.data?.kycLink?.webLink;
                if (webLink) {
                    window.open(webLink, '_blank', 'noopener,noreferrer');
                } else {
                    dispatch(
                        showToast({
                            variant: 'info',
                            description:
                                res.message || 'Could not open KYC verification. Please try again.',
                        })
                    );
                }
            }
        } else {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Failed to initiate KYC. Please try again.',
                })
            );
        }
        setSubmitLoading(false);
    };

    return { handleInitiateKyc, submitLoading };
};
