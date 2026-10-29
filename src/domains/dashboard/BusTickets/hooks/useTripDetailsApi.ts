import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getTripDetails } from '../api';
import { TripDetails } from '../types/buslist';

interface Options {
    bpId?: string;
    dpId?: string;
    skip?: boolean;
}

export default function useTripDetailsApi(tripId: string, options?: Options) {
    const { bpId, dpId, skip = false } = options ?? {};
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!tripId || skip) return;
        setIsLoading(true);
        getTripDetails({ userId: id, userType: role, id: tripId, bpId, dpId })
            .then(data => setTripDetails(data))
            .finally(() => setIsLoading(false));
    }, [tripId, id, role, skip, bpId, dpId]);

    return { tripDetails, isLoading };
}
