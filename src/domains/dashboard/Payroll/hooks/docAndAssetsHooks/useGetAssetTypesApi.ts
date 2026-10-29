import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { assetTypeListing } from '../../api/docAndAssetsApi/index';
import { AssetType, AssetTypesResponse } from '../../types/docAndAssetsTypes/index';

export const useGetAssetListingType = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [assetData, setAssetData] = useState<AssetType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getAssetList = useCallback(async () => {
        const data: AssetTypesResponse | false = await assetTypeListing({
            userId: id,
            userType: role,
        });
        if (data) {
            setAssetData(data.assetTypes);

            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getAssetList();
    }, [getAssetList]);

    return { assetTypes: assetData, isLoading };
};
