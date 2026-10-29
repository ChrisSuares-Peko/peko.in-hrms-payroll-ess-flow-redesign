import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listVehicleUsageHistory } from '../../api/fleet';
import { VehicleUsageListingResponse } from '../../types/fleetManagement';

export const useGetAllVehicleUsageApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string,
    fleetId: number
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docListData, setDocListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getVehicleUsageHistoryList = useCallback(async () => {
        setIsLoading(true);
        const data: VehicleUsageListingResponse | false = await listVehicleUsageHistory({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            fleetId,
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
    }, [id, role, itemsPerPage, page, searchText, fleetId]);
    useEffect(() => {
        getVehicleUsageHistoryList();
    }, [getVehicleUsageHistoryList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
