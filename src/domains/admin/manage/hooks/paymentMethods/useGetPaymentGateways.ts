import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getPaymentGatewaysApi } from '../../api/paymentMethods';

const useGetPaymentGateways = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [gatewayOptions, setGatewayOptions] = useState<DropDown>([]);

    const getPaymentGateways = useCallback(async () => {
        setIsLoading(true);
        const data = await getPaymentGatewaysApi({ userId: id, userType: role });
        if (data) {
            setGatewayOptions(
                data.map(gateway => ({ value: gateway.pgProvider, label: gateway.name }))
            );
        }
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        getPaymentGateways();
    }, [getPaymentGateways]);

    return { gatewayOptions, gatewayLoading: isLoading };
};

export default useGetPaymentGateways;
