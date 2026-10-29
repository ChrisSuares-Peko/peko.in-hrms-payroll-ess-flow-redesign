import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyPanKyc } from '../api/tax';
import { setPanDetails, setKycBusinesses } from '../slice/taxMoreSlice';

const useKyc = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isVerifying, setIsVerifying] = useState(false);

    const verifyPan = useCallback(
        async (values: { pan: string; fullName: string; dob: string; stateCode: string }) => {
            setIsVerifying(true);
            const resp = await verifyPanKyc({
                userId: id,
                userType: role,
                pan: values.pan,
                fullName: values.fullName || undefined,
                dob: values.dob || undefined,
                stateCode: values.stateCode,
            });
            setIsVerifying(false);

            if (resp && resp.status) {
                dispatch(
                    setPanDetails({
                        pan: values.pan.toUpperCase(),
                        fullName: resp.data.fullName ?? values.fullName,
                        dob: resp.data.dob ?? values.dob,
                    })
                );
                dispatch(setKycBusinesses(resp.data.businesses));
                return true;
            }

            if (resp && !resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'PAN verification failed',
                        variant: 'error',
                    })
                );
            }

            return false;
        },
        [id, role, dispatch]
    );

    return { isVerifying, verifyPan };
};

export default useKyc;
