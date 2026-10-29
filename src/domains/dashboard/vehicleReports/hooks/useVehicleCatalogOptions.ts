import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getVehicleCatalog } from '../api/index';
import { SelectOption } from '../types/index';

interface Params {
    category: string;
    make?: string;
    model?: string;
    year?: string;
}

interface CascadeLevel {
    options: SelectOption[];
    loading: boolean;
}

const toOptions = (values: string[]): SelectOption[] => values.map(value => ({ label: value, value }));

// One cascade level. Fetches only while `enabled`, tracks its own loading state, and
// discards a stale in-flight response if the dependency changes again before it
// resolves — the same pattern as CompanyIncorporation's useFetchNic.
const useCascadeLevel = (
    enabled: boolean,
    userId: number,
    userType: string,
    payload: { category: string; make?: string; model?: string; year?: string }
): CascadeLevel => {
    const [options, setOptions] = useState<SelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const { category, make, model, year } = payload;

    useEffect(() => {
        if (!enabled) {
            setOptions([]);
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        setLoading(true);
        setOptions([]); // clear stale options immediately on a dependency change

        getVehicleCatalog({ userId, userType, category, make, model, year }).then(response => {
            if (cancelled) return;
            setOptions(response ? toOptions(response) : []);
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [enabled, userId, userType, category, make, model, year]);

    return { options, loading };
};

// Backs the Vehicle Information section's four dependent selects (make → model →
// year → trim), each proxied through Peko's Droom MYBIZ catalog endpoint. `category`
// is a fixed local enum (Car/Bike/…), not fetched — see VehicleInformationSection.
const useVehicleCatalogOptions = ({ category, make, model, year }: Params) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const makes = useCascadeLevel(!!category, userId, userType, { category });
    const models = useCascadeLevel(!!category && !!make, userId, userType, { category, make });
    const years = useCascadeLevel(!!category && !!make && !!model, userId, userType, {
        category,
        make,
        model,
    });
    const trims = useCascadeLevel(!!category && !!make && !!model && !!year, userId, userType, {
        category,
        make,
        model,
        year,
    });

    return {
        makes: makes.options,
        makesLoading: makes.loading,
        models: models.options,
        modelsLoading: models.loading,
        years: years.options,
        yearsLoading: years.loading,
        trims: trims.options,
        trimsLoading: trims.loading,
    };
};

export default useVehicleCatalogOptions;
