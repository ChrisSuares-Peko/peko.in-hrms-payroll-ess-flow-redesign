import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { getServiceOperatorsApi } from '@src/domains/admin/settings/api/cashback';
import { ServiceProviderData, ServiceProvider } from '@src/domains/admin/settings/types/cashback';
import { useAppSelector } from '@src/hooks/store';

const useGetAllServiceOperators = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [serviceData, setServiceData] = useState<DropDown>();

    const getAllServiceProvider = useCallback(async () => {
        setIsLoading(true);
        const data: ServiceProviderData | false = await getServiceOperatorsApi({
            userId: id,
            userType: role,
        });
        if (data) {
            const arr = data.data.map((item: ServiceProvider) => ({
                value: item.id.toString(),
                label: item.serviceProvider,
            }));
            setServiceData(arr);
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getAllServiceProvider();
    }, [getAllServiceProvider]);

    return {
        serviceOperatorLoading: isLoading,
        serviceData,
    };
};

export default useGetAllServiceOperators;
