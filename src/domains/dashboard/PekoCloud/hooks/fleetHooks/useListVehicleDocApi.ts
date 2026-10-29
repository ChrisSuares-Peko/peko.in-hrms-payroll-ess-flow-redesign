import { useState, useCallback, useEffect } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { listVehicleDoc } from '../../api/fleet';
import { VehicleDocListingResponse } from '../../types/fleetManagement';

export const useGetAllVehicleDocApi = (
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
    const getVehcileDocList = useCallback(async () => {
        setIsLoading(true);
        const data: VehicleDocListingResponse | false = await listVehicleDoc({
            userId: id,
            userType: role,
            itemsPerPage,
            page,
            searchText,
            fleetId,
        });

        if (data) {
            const arr = data?.result?.map(item => {
                const currentDate = new Date();
                const issueDate = new Date(item?.issueDate);
                const expireDate = new Date(item.expireDate);
                let status = '';

                if (currentDate > expireDate) {
                    status = 'Expired';
                } else if (currentDate < issueDate) {
                    status = 'Upcoming';
                } else {
                    status = 'Active';
                }
                return {
                    documentName: item.documentName ?? '',
                    documentNumber: item.documentNumber ?? '',
                    documentType: item.documentType ?? '',
                    issueDate: item?.issueDate ?? '',
                    expireDate: item.expireDate ?? '',
                    status,
                    actions: '',
                    id: item?.id ?? '',
                    document: item.document ?? '',
                    documentAvailability: item.document ? 'Available' : 'NA',
                };
            });
            setCount(data.totalData);
            setDocListData(arr);
        }
        setIsLoading(false);
    }, [id, role, itemsPerPage, page, searchText, fleetId]);
    useEffect(() => {
        getVehcileDocList();
    }, [getVehcileDocList, reloadTable]);

    return {
        tableDatas: docListData,
        orderCount: count,
        tableLoading: isLoading,
    };
};
