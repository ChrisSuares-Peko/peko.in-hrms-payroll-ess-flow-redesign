import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getServiceList } from '../api/index';
import { ConnectListResponse, ConnectTableData } from '../types/index';

export function useConnectApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tableData, setTableData] = useState<ConnectTableData>([]);
    const [isLoading, setIsLoading] = useState(true);

    const getConnectList = useCallback(async () => {
        try {
            const data: ConnectListResponse | false = await getServiceList({
                userId: id,
                userType: role,
            });

            if (data) {
                const connectServiceData = data as ConnectListResponse;
                const arr = connectServiceData?.data?.map(connect => ({
                    id: connect.id,
                    name: connect.serviceProvider,
                    image: connect.logo ?? '',
                    tagline: connect.tagline ?? '',
                    offer: connect.rewards ?? '',
                }));
                setTableData(arr);
            }
        } catch (error) {
            console.error('Error fetching connect list:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id, role]);

    useEffect(() => {
        getConnectList();
    }, [getConnectList]);

    return { data: tableData, isLoading };
}
