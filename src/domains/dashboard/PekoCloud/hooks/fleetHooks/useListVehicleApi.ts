import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listVehicle } from '../../api/fleet';
import { FleetListingResponse } from '../../types/fleetManagement';

export const useGetAllVehicleApi = (
    page: number,
    itemsPerPage: number,
    reloadTable: boolean,
    searchText: string
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [docListData, setDocListData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [count, setCount] = useState<number>();
    const getVehicleList = useCallback(async () => {
        setIsLoading(true);
        const data: FleetListingResponse | false = await listVehicle({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
        });
        if (data) {
            const arr = data?.result?.map(item => ({
                vehicleName: item.vehicleName ?? '',
                vehicleType: item.vehicleType ?? '',
                usedBy: item.cloud_employee?.employeeName ?? '',
                vehicleNumber: item?.vehicleNumber ?? '',
                purchasedDate: item.purchasedDate ?? '',
                assetType: item?.assetType ?? '',
                dateOfRenewal: item?.dateOfRenewal ?? '',
                amount: item?.amount ?? '',
                odoMeter: item?.odoMeter ?? '',
                engineTransmission: item?.engineTransmission ?? '',
                chassisNumber: item?.chassisNumber ?? '',
                modelYear: item?.modelYear ?? '',
                amountRecurring: item?.amountRecurring ?? '',
                vendor: item?.vendor ?? '',
                employeeId: item.cloud_employee?.id ?? '',
                department: item.cloud_employee?.department ?? '',
                joiningDate: item.cloud_employee?.joiningDate ?? '',
                used: item.cloud_employee?.used ?? 'N/A',
                usingFor: item.cloud_employee?.usingFor ?? 'N/A',
                actions: '',
                status: item?.status ?? '',
                id: item?.id ?? '',
            }));

            setCount(data.totalData);
            setDocListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText]);

    useEffect(() => {
        getVehicleList();
    }, [getVehicleList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
