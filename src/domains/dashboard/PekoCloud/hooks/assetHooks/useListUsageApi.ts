import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listUsageHistory } from '../../api/assets';
import { AssetUsageListingResponse } from '../../types/assets/index';

export const useGetAllAssetUsageApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string,
    assetId: number
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docListData, setDocListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [count, setCount] = useState<number>();
    const getAssetUsageHistoryList = useCallback(async () => {
        setIsLoading(true);
        const data: AssetUsageListingResponse | false = await listUsageHistory({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            assetId,
        });

        if (data) {
            const arr = data?.result?.map(item => ({
                employee: item?.cloud_employee?.employeeName ?? '',
                employeeEmail: item?.cloud_employee?.employeeEmail ?? '',
                assignDate: item?.assignDate ?? '',
                returnDate: item.returnDate ?? '',
                returnStatus: item.returnStatus ?? '',
                remarks: item.remarks ?? '',
                status: '',
                actions: '',
                id: item?.id ?? '',
                empId: item?.cloud_employee?.id ?? '',
            }));
            setCount(data.totalData);
            setDocListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText, assetId]);
    useEffect(() => {
        getAssetUsageHistoryList();
    }, [getAssetUsageHistoryList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
