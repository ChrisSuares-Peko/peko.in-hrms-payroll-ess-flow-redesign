import { useCallback, useEffect, useState } from 'react';

import { defaultSelectType } from '@src/domains/dashboard/logistics/types';
import { useAppSelector } from '@src/hooks/store';

import { getServiceOperatorsApi } from '../api/dropdowns';
import { ServiceProvider, ServiceProviderData } from '../types/common';

export default function useGetServiceOperators(searchText?: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [serviceData, setServiceData] = useState<defaultSelectType[]>([{ label: '', value: '' }]);
    const [isLoading, setIsLoading] = useState(false);

    const getAllServiceProvider = useCallback(async () => {
        setIsLoading(true);
        const data: ServiceProviderData | false = await getServiceOperatorsApi({
            userId: id,
            userType: role,
            searchText: searchText || '',
        });
        if (data) {
            const arr = data.data.map((item: ServiceProvider) => ({
                value: item.id.toString(),
                label: item.serviceProvider,
            }));
            setServiceData(arr);
        }
        setIsLoading(false);
    }, [id, role, searchText]);

    // const getAllServiceProvider = useCallback(async () => {
    //     setIsLoading(true);
    //     const data: ServiceProviderData | false = await getServiceOperatorsApi({
    //         userId: id,
    //         userType: role,
    //     });
    //     if (data) {
    //         const arr = data.data.map((item: ServiceProvider) => ({
    //             value: item.id.toString(),
    //             label: item.serviceProvider,
    //         }));
    //         setServiceData(arr);
    //     }
    // }, [id, role]);

    useEffect(() => {
        getAllServiceProvider();
    }, [getAllServiceProvider]);

    return {
        isLoading,
        serviceData,
        setServiceData,
    };
}
