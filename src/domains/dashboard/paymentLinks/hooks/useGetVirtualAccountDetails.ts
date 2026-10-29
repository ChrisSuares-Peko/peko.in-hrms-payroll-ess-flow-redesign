import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVirtualAccountDetails } from '../api';
import type { VirtualAccountDetailsData } from '../types/paymentLinkTypes';

export default function useGetVirtualAccountDetails() {
    const { role, id } = useAppSelector((state) => state.reducer.auth);

    const [isLoading, setIsLoading] = useState(false);
    const [details, setDetails] = useState<VirtualAccountDetailsData | null>(null);

    const fetchDetails = useCallback(async () => {
        setIsLoading(true);
        const data = await getVirtualAccountDetails({ userId: id, userType: role });
        setIsLoading(false);
        if (data) setDetails(data);
    }, [id, role]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    return { details, isLoading, refetch: fetchDetails };
}
