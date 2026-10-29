import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getBpDpDetails } from '../api';
import { BpDpDetails } from '../types/buslist';

export default function useBpDpDetailsApi(tripId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [bpDpDetails, setBpDpDetails] = useState<BpDpDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!tripId) return;
        setIsLoading(true);
        getBpDpDetails({ userId: id, userType: role, id: tripId })
            .then(data => setBpDpDetails(data))
            .finally(() => setIsLoading(false));
    }, [tripId, id, role]);

    return { bpDpDetails, isLoading };
}
