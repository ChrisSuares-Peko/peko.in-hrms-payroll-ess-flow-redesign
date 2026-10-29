import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getHostingServices } from '../api/index';

export interface HostingService {
    planType: string;
    label: string;
    startingPrice: number | null;
}

export default function useHostingServices() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [services, setServices] = useState<HostingService[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        const data = await getHostingServices({ userId: id, userType: role });
        if (data) setServices(data);
        setIsLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    return { services, isLoading };
}
