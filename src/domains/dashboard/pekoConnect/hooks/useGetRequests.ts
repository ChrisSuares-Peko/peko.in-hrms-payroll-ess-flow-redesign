import { useCallback, useEffect, useState } from 'react';

import { getRequests } from '../api/index';

export function useGetRequests() {
    const [requests, setRequests] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getRequests();
            const preData = data.filter((it: any) => it.status === 'PENDING');
            setRequests(preData);
        } catch (error) {
            console.error('Error fetching requests:', error);
            setRequests(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { requests, isLoading, refresh: fetchData };
}
