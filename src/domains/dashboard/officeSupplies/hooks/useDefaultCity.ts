import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getSavedAddressApi } from '../api/address';
import { lookupPostcode } from '../api/cityList';
import { Address, SavedAddressResponse } from '../types/address';
import { DEFAULT_CITY, matchCityByName, SelectedCity, withPincode } from '../utils/indianCityStdCodes';

/** Pick the default-flagged address, else the first one with a pincode or city. */
const pickAddress = (addresses: Address[]): Address | undefined =>
    addresses.find(a => a.default === 1 && (a.zipCode || a.city)) ||
    addresses.find(a => a.zipCode || a.city) ||
    addresses.find(a => a.default === 1);

/**
 * Resolve the city to pre-select for Office Supplies on first visit, in order:
 *   1. the profile default address's PINCODE → India Post → city (mapped to an ONDC city),
 *   2. the address's city string (mapped to an ONDC city),
 *   3. DEFAULT_CITY (Delhi).
 *
 * No geolocation — reads the saved profile addresses the app already exposes. Pass
 * `enabled = false` to skip the lookup (e.g. a city is already stored). Once resolved,
 * `defaultCity` is always a valid city.
 */
export const useDefaultCity = (enabled: boolean = true) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [defaultCity, setDefaultCity] = useState<SelectedCity | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(enabled);
    const hasRun = useRef(false);

    const resolve = useCallback(async (): Promise<SelectedCity> => {
        const data: SavedAddressResponse | false = await getSavedAddressApi({
            userId: id,
            userType: role,
        });

        const addresses = data ? data.addressDetails : [];
        const address = pickAddress(addresses || []);

        // 1. pincode → India Post → city → ONDC city
        const postcode = address?.zipCode?.trim();
        if (postcode) {
            const resolved = await lookupPostcode({ userId: id, userType: role, postcode });
            const byPin = resolved ? matchCityByName(resolved.city) : null;
            if (byPin) return withPincode(byPin, postcode);
        }

        // 2. address city string, else 3. Delhi — keep the PIN when we have one
        return withPincode(matchCityByName(address?.city) || DEFAULT_CITY, postcode);
    }, [id, role]);

    useEffect(() => {
        if (!enabled || hasRun.current) return undefined;
        hasRun.current = true;

        let cancelled = false;
        setIsLoading(true);
        resolve()
            .then(city => {
                if (!cancelled) setDefaultCity(city);
            })
            .catch(() => {
                if (!cancelled) setDefaultCity(DEFAULT_CITY);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [enabled, resolve]);

    return { defaultCity, isLoading };
};
