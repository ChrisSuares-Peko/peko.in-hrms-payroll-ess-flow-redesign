import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listAsset } from '../../api/assets';
import { AssetListingResponse } from '../../types/assets';

export const useGetAllAssetApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string
) => {
    const initialInfoDetails = {
        totalAssets: 0,
        totalAssigned: 0,
        availableAssets: 0,
        totalAssetSpent: 0,
    };
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [infoDetails, setInfoDetails] = useState(initialInfoDetails);
    const [docListData, setDocListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getAssetList = useCallback(async () => {
        setIsLoading(true);
        const data: AssetListingResponse | false = await listAsset({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
        });

        if (data) {
            let totalAssigned = 0;
            let totalAssetSpent = 0;
            const arr = data?.result?.map(item => {
                if (item.cloud_employee?.employeeName) {
                    totalAssigned += 1;
                }
                totalAssetSpent += Number(item.amount || 0);
                return {
                    assetName: item.assetName ?? '',
                    assetCategory: item.assetCategory ?? '',
                    usedBy: item.cloud_employee?.employeeName ?? '',
                    serialNumber: item?.serialNumber ?? '',
                    purchasedDate: item.purchasedDate ?? '',
                    assetType: item?.assetType ?? '',
                    warranty: item?.warranty ?? '',
                    amount: item?.amount ?? '',
                    status: item?.status ?? '',
                    employeeId: item.cloud_employee?.id ?? '',
                    department: item.cloud_employee?.department ?? '',
                    joiningDate: item.cloud_employee?.joiningDate ?? '',
                    used: item.cloud_employee?.used ?? 'N/A',
                    usingFor: item.cloud_employee?.usingFor ?? 'N/A',
                    actions: '',
                    id: item?.id ?? '',
                };
            });
            const totalAssets = data.totalData;
            const availableAssets = totalAssets - totalAssigned;
            setCount(data.totalData);
            setInfoDetails({ totalAssets, totalAssigned, totalAssetSpent, availableAssets });
            setDocListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText]);
    useEffect(() => {
        getAssetList();
    }, [getAssetList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
        infoDetails,
    };
};
