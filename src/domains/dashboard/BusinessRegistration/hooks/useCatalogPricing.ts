import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCatalog } from '../api';
import { EntityType } from '../types';
import { CATALOG_SERVICE_IDS, CatalogPricing, parseCatalog } from '../utils/catalog';

// Fetches live IndiaFilings pricing for the selected entity. Entities without a
// known catalog service_id resolve to null so the caller uses its fallback price.
export const useCatalogPricing = (entityType?: EntityType) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const [pricing, setPricing] = useState<CatalogPricing | null>(null);
    const [loading, setLoading] = useState(false);

    const serviceId = entityType ? CATALOG_SERVICE_IDS[entityType] : undefined;

    useEffect(() => {
        if (!serviceId) {
            setPricing(null);
            return undefined;
        }
        let active = true;
        setLoading(true);
        getCatalog({ userId: Number(userId), userType: userType ?? '', serviceId })
            .then(res => {
                if (active) setPricing(res ? parseCatalog(res) : null);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [serviceId, userId, userType]);

    return { pricing, loading };
};
