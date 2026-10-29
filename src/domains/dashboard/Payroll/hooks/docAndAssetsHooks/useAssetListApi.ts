import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { assetList } from '../../api/docAndAssetsApi/index';
import { assetTable, assetsListingResponse } from '../../types/docAndAssetsTypes/index';

export const useGetEmployeeAssetsApi = (
    page: number,
    limit: number,
    year: number,
    month: number | string,
    searchText: string,
    assetStatus: string,
    assetType: string,
    reloadTable: boolean
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [assetData, setAssetData] = useState<assetTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>(0);
    const getAssetsData = useCallback(async () => {
        setIsLoading(true);
        const data: assetsListingResponse | false = await assetList({
            userId: id,
            userType: role,
            limit,
            page,
            year,
            month,
            searchText,
            assetStatus,
            assetType,
        });
        if (data) {
            const arr = data?.assetData?.map(item => ({
                dateAdded: new Date(item?.createdAt).toISOString().split('T')[0] ?? '',
                assetType: item?.assetType ?? '',
                assetName: item?.assetName ?? '',
                assetId: item?.assetId ?? '',
                batchNo: item.batchNo ?? '',
                purchasedDate: new Date(item?.purchasedDate).toISOString().split('T')[0] ?? '',
                user: item.employee.fullName ?? '',
                status: item?.status ?? '',
                action: '',
                id: item.id,
            }));

            setAssetData(arr);
            setCount(data?.totalCount);
        }
        setIsLoading(false);
    }, [id, role, limit, page, year, month, searchText, assetStatus, assetType]);

    useEffect(() => {
        getAssetsData();
    }, [getAssetsData, reloadTable]);

    return { assetData, assetLoading: isLoading, assetCount: count };
};
