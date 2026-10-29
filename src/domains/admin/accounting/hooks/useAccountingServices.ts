import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAccountingServices, updateAccountingServiceCommissionStatus } from '../api/services';
import { AccountingPlanType, AccountingService, AccountingServiceFilters } from '../types/services';

export default function useAccountingServices(
    type: AccountingPlanType,
    filters: AccountingServiceFilters
) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [services, setServices] = useState<AccountingService[]>([]);
    const [count, setCount] = useState(0);

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        const data = await getAccountingServices({ userId: id, userType: role, type, ...filters });
        if (data) {
            setServices(data.services);
            setCount(data.recordsTotal);
        } else {
            setServices([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, type, filters]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const toggleCommissionConfigured = useCallback(
        async (service: AccountingService) => {
            const resp = await updateAccountingServiceCommissionStatus({
                userId: id,
                userType: role,
                id: service.id,
                isCommissionConfigured: !service.commissionConfigured,
            });
            if (resp && resp.status) {
                fetchServices();
                return true;
            }
            return false;
        },
        [id, role, fetchServices]
    );

    return { isLoading, services, count, refetch: fetchServices, toggleCommissionConfigured };
}
