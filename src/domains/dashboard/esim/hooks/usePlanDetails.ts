import { useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPlanDetails } from '../api';
import { MultiOrderPayload } from '../types';

export function usePlanDetails() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [detailsMap, setDetailsMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    const inEsimRef = useRef<Set<string>>(new Set());

    const getKey = (orders: MultiOrderPayload['orders']) =>
        orders
            .map(o => `${o.country}_${o.data}_${o.validity}_${o.quantity}`)
            .sort()
            .join('|');

    const fetchPlanDetails = async (payload: MultiOrderPayload) => {
        if (!payload?.orders?.length) return null;
        const key = getKey(payload.orders);

        if (detailsMap[key]) {
            return detailsMap[key];
        }

        if (inEsimRef.current.has(key)) {
            return null;
        }

        inEsimRef.current.add(key);
        setLoading(true);

        try {
            const dataResp = await getPlanDetails({
                userId: id,
                userType: role,
                orders: payload.orders,
            });

            if (dataResp) {
                setDetailsMap(prev => ({
                    ...prev,
                    [key]: dataResp,
                }));
                return dataResp;
            }

            return null;
        } finally {
            inEsimRef.current.delete(key);
            setLoading(false);
        }
    };

    return {
        fetchPlanDetails,
        detailsMap,
        loading,
    };
}
