import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getCopyCashbackCompareApi,
    postAddCashbacksToPackageApi,
    postClonePackageToPartnerApi,
} from '../api/cashbackCopy';
import {
    AddCashbacksPayload,
    ClonePackagePayload,
    CopyComparePayload,
} from '../types/cashbackCopy';

const useCopyCashback = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [compareData, setCompareData] = useState<CopyComparePayload>();

    const fetchCompareData = useCallback(
        async (fromPartnerId: string, toPartnerId: string) => {
            setIsLoading(true);
            const resp = await getCopyCashbackCompareApi({
                userId: id,
                userType: role,
                fromPartnerId,
                toPartnerId,
            });
            setIsLoading(false);
            if (resp) {
                setCompareData(resp as CopyComparePayload);
                return resp as CopyComparePayload;
            }
            setCompareData(undefined);
            return undefined;
        },
        [id, role]
    );

    const addCashbacksToPackage = useCallback(
        async (payload: AddCashbacksPayload) => {
            setIsLoading(true);
            const resp = await postAddCashbacksToPackageApi({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsLoading(false);
            return resp;
        },
        [id, role]
    );

    const clonePackageToPartner = useCallback(
        async (payload: ClonePackagePayload) => {
            setIsLoading(true);
            const resp = await postClonePackageToPartnerApi({
                userId: id,
                userType: role,
                ...payload,
            });
            setIsLoading(false);
            return resp;
        },
        [id, role]
    );

    return {
        isLoading,
        compareData,
        setCompareData,
        fetchCompareData,
        addCashbacksToPackage,
        clonePackageToPartner,
    };
};

export default useCopyCashback;
