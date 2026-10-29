import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getAddonPricing } from '../api';
import { AddonPricingResponse } from '../types';

export default function useGetAddonPricing({
    addonsAccessKey,
    quantity,
}: {
    addonsAccessKey?: string;
    quantity?: number;
}) {
    const [quote, setQuote] = useState<AddonPricingResponse | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(addonsAccessKey && quantity));
    const { role, id } = useAppSelector(state => state.reducer.auth);

    useEffect(() => {
        let cancelled = false;
        if (!addonsAccessKey || !quantity || quantity <= 0) {
            setQuote(null);
            setIsLoading(false);
            return undefined;
        }
        setIsLoading(true);
        (async () => {
            const data = await getAddonPricing({
                userId: id,
                userType: role,
                addonsAccessKey,
                quantity,
            });
            if (cancelled) return;
            setQuote(data && typeof data.expectedPaymentAmount === 'number' ? data : null);
            setIsLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [addonsAccessKey, quantity, id, role]);

    return { quote, isLoading };
}
