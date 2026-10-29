import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateSignerApi, getAgreementApi } from '../api/index';
import { GetAgreementRespnse } from '../types/uploadInvoiceType';

export default function useUserAgrement() {
    const dispatch = useDispatch();
    const [agreementData, setAgreementData] = useState<GetAgreementRespnse>();
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const [loading, setLoading] = useState<boolean>(false);
    const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
    async function updateSigner(payload: any) {
        setLoading(true);
        const response = await updateSignerApi({
            userId: id,
            userType: role,
            payload,
        });

        if (response) {
            dispatch(
                showToast({
                    description: 'Signer details updated',
                    variant: 'success',
                })
            );
            getAgreementData();
            // handleClose();
        }
        setLoading(false);
    }

    const getAgreementData = useCallback(async () => {
        setIsDataLoading(true);
        const response = await getAgreementApi({
            userId: id,
            userType: role,
        });

        if (response) {
            setAgreementData(response);
        }
        setIsDataLoading(false);
    }, [id, role]);

    useEffect(() => {
        getAgreementData();
    }, [getAgreementData]);

    return { updateSigner, loading, isDataLoading, agreementData };
}
