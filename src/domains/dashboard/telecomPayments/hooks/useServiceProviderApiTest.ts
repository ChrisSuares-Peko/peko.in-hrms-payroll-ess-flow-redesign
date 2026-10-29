import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getServiceProvider } from '../api/index';
import { OptionsType, ServiceProviderResponse } from '../types/index';

export default function useServiceProviderApi(categoryName: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [serviceProviderData, setServiceProviderData] = useState<OptionsType[]>();

    const getServiceProviderList = useCallback(async () => {
        const data: ServiceProviderResponse | false = await getServiceProvider({
            userId: id,
            userType: role,
            categoryName: 'Mobile',
        });
        if (data) {
            const providersData = data.billersArray?.map((provider: any) => ({
                value: provider.billerId ?? '',
                label: provider.billerName ?? '',
                customerParams: Array.isArray(provider.billerInputParams.paramInfo)
                    ? provider.billerInputParams.paramInfo
                    : [provider.billerInputParams.paramInfo],
            }));
            setServiceProviderData(providersData);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getServiceProviderList();
    }, [getServiceProviderList]);

    return { serviceProviderData, isLoading };
}
