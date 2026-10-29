import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listAssetInfo } from '../../api/assets';
import { AssetsInfoResponse } from '../../types/assets';

export const useGetAllAssetInfoApi = (reloadTable: boolean) => {
    const initialInfoDetails = {
        totalAssets: 0,
        totalAssigned: 0,
        availableAssets: 0,
        totalAssetSpent: 0,
    };
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState(initialInfoDetails);
    const [isLoading, setIsLoading] = useState(true);
    const getAssetsInfo = useCallback(async () => {
        setIsLoading(true);
        const data: AssetsInfoResponse | false = await listAssetInfo({
            userId: id,
            userType: role,
        });

        if (data) {
            setInfoDetails({
                totalAssets: data.totalAssets,
                totalAssigned: data.totalAssigned,
                totalAssetSpent: data.totalSpent,
                availableAssets: data.availableAssets,
            });
        }
        setIsLoading(false);
    }, [id, role]);
    useEffect(() => {
        getAssetsInfo();
    }, [getAssetsInfo, reloadTable]);

    return {
        tableLoading: isLoading,
        infoDetails,
    };
};
