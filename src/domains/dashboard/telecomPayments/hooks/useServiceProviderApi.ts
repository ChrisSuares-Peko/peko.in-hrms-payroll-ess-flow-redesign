import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getServiceProvider } from '../api/index';
import { OptionsType, ServiceProviderResponse } from '../types/index';

export default function useServiceProviderApi(categoryName: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [serviceProviderData, setServiceProviderData] = useState<OptionsType[]>();

    const getServiceProviderList = useCallback(async () => {
        if (!categoryName) {
            setIsLoading(false);
            return;
        }
        const data: ServiceProviderResponse | false = await getServiceProvider({
            userId: id,
            userType: role,
            categoryName,
        });
        if (data) {
            const providersData = data.billersArray?.map((provider: any) => ({
                value: provider.billerId ?? '',
                label: provider.billerName ?? '',
                customerParams: Array.isArray(provider.billerInputParams?.paramInfo)
                    ? provider.billerInputParams.paramInfo
                    : [provider.billerInputParams?.paramInfo].filter(Boolean),
                billerFetchRequiremet: provider.billerFetchRequiremet ?? '',
                billerFetchRequirement: provider.billerFetchRequirement ?? '',
                billerSupportBillValidation: provider.billerSupportBillValidation ?? '',
                billerAdhoc: provider.billerAdhoc ?? '',
                billerPaymentChannels: provider.billerPaymentChannels ?? undefined,
            }));
            setServiceProviderData(providersData);
        }
        setIsLoading(false);
    }, [id, role, categoryName]);

    useEffect(() => {
        getServiceProviderList();
    }, [getServiceProviderList]);

    return { serviceProviderData, isLoading };
}
