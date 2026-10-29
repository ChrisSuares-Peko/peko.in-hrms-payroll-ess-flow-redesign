import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listVehicleMaintenanceHistory } from '../../api/fleet';
import { VehicleMaintenanceListingResponse } from '../../types/fleetManagement';

export const useGetAllVehicleMaintenanceDataApi = (
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
    const getVehicleMaintenanceList = useCallback(async () => {
        setIsLoading(true);
        const data: VehicleMaintenanceListingResponse | false = await listVehicleMaintenanceHistory(
            {
                userId: id,
                userType: role,
                itemsPerPage,
                page,
                searchText,
                fleetId,
            }
        );

        if (data) {
            const arr = data?.result?.map(item => ({
                dateAndTime: item?.date ?? '',
                repairCategory: item?.repairCategory ?? '',
                serviceType: item?.serviceType ?? '',
                dateReceived: item?.receivedDate ?? '',
                amount: item?.amount ?? '',
                status: '',
                actions: '',
                id: item?.id ?? '',
            }));
            setCount(data.totalData);
            setDocListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText, fleetId]);
    useEffect(() => {
        getVehicleMaintenanceList();
    }, [getVehicleMaintenanceList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
