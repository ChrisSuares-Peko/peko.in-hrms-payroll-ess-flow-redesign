import { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchCountries } from '../../api';
import { Country } from '../../types';

interface CountryOption {
    label: string;
    value: string;
}

export const useAddressCountries = (isInternationalReceiver: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [countries, setCountries] = useState<Country[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);

    useEffect(() => {
        if (!isInternationalReceiver) return;
        setIsLoadingCountries(true);
        fetchCountries({ userType: role, userId: id }).then(res => {
            if (res && res.countries && res.countries.length > 0) {
                const list: Country[] = res.countries;
                const hasIndia = list.some(c => c.alpha2Code === 'IN');
                setCountries(hasIndia ? list : [{ name: 'India', alpha2Code: 'IN' }, ...list]);
            }
            setIsLoadingCountries(false);
        });
    }, [isInternationalReceiver, role, id]);

    const countryOptions: CountryOption[] = useMemo(
        () =>
            countries
                .filter(c => c.name && c.alpha2Code)
                .map(c => ({ label: c.name, value: c.alpha2Code })),
        [countries]
    );

    return { countryOptions, isLoadingCountries };
};
