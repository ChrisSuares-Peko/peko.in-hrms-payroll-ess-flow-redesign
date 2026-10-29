import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getPlanPricing } from '../api/globalBusinessSetup';
import { CountryDataValues } from '../types/globalBusinessSetup';
import { PricingType } from '../types/pricing';

// Provider API is retired (vendor removed it) — this hook now fetches
// pricing only. Freezone display metadata comes from the country payload.
export const usePricing = () => {
    const [pricing, setPricing] = useState<PricingType[]>([]);
    const [loading, setLoading] = useState(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const fetchPricing = async (countryData: CountryDataValues) => {
        setLoading(true);
        // Freezone is optional — most countries don't supply freezones for
        // their company types. Forward empty string so request URLs don't
        // include `freezone=undefined`.
        const freezone = countryData.freezone || '';
        const pricingRes = await getPlanPricing({
            userId: id,
            userType: role,
            freezone,
            country: countryData.country,
            company_type: countryData.type,
        });
        const allPricing: PricingType[] = (pricingRes as PricingType[]) || [];
        const activePricing = allPricing
            .filter(p => p.status === 'active')
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setPricing(activePricing);
        setLoading(false);
    };

    const clearPricing = () => {
        setPricing([]);
    };

    return { pricing, loading, fetchPricing, clearPricing };
};

// Backwards-compatible alias while consumers migrate.
export const useProviders = usePricing;
