import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listAsset } from '../../api/assets';
import { AssetListingResponse } from '../../types/assets';

export function useGetAssets() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [assets, setAssets] = useState<any[]>([]);
    const allAssetList = useCallback(async () => {
        const data: AssetListingResponse | false = await listAsset({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                assetName: item.assetName ?? '',
                assetCategory: item.assetCategory ?? '',
                usedBy: item.cloud_employee?.employeeName ?? '',
                serialNumber: item?.serialNumber ?? '',
                purchasedDate: item.purchasedDate ?? '',
                assetType: item?.assetType ?? '',
                warranty: item?.warranty ?? '',
                amount: item?.amount ?? '',
                status: item?.status ?? '',
                actions: '',
                id: item?.id ?? '',
            }));

            setAssets(arr);
        }
    }, [role, id]);

    useEffect(() => {
        allAssetList();
    }, [allAssetList]);

    const generateAssetDropdown = (data: any[]) => {
        const excludedStatuses = ['Inactive', 'Disposed', 'Damaged', 'Unavailable'];

        return data
            .filter(asset => !excludedStatuses.includes(asset.status))
            .map(asset => ({
                value: asset.id,
                label: asset.assetName,
            }));
    };
    return { assetsData: assets, generateAssetDropdown };
}
