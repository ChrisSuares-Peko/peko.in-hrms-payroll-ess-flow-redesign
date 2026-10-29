import { useEffect, useRef, useState } from 'react';

import { useCurrentLocation } from './useCurrentLocation';
import { useDefaultCity } from './useDefaultCity';
import { resolveCity, SelectedCity, withPincode } from '../utils/indianCityStdCodes';

const CITY_STORAGE_KEY = 'officeSuppliesSelectedCity';
const CITY_SOURCE_STORAGE_KEY = 'officeSuppliesCitySource';

/** How the stored city was chosen: picked by the user in the modal, or auto-derived. */
type CitySource = 'user' | 'auto';

/**
 * The persisted office-supplies delivery city (localStorage), or null. Exported
 * so lightweight consumers (e.g. the PDP delivery-estimate button) can read the
 * selected location without mounting the full city hook and its GPS/default
 * side effects.
 */
export const readStoredCity = (): SelectedCity | null => {
    try {
        const raw = localStorage.getItem(CITY_STORAGE_KEY);
        const city = raw ? (JSON.parse(raw) as SelectedCity) : null;
        if (!city) return null;
        // Empty code = outside India. Do not remap the name onto Delhi.
        if (!city.code) return city;
        const base = city.code.startsWith('std:') ? city : resolveCity(city.name);
        return withPincode(base, city.pincode);
    } catch {
        return null;
    }
};

// Cities stored before the source key existed count as auto-derived.
const readStoredCitySource = (): CitySource => {
    try {
        return localStorage.getItem(CITY_SOURCE_STORAGE_KEY) === 'user' ? 'user' : 'auto';
    } catch {
        return 'auto';
    }
};

/**
 * Shared, persisted city selection for the office-supplies domain — reads
 * from localStorage first (so a direct navigation or hard refresh on ANY
 * page resolves the same city immediately, no re-detect flash), then
 * auto-detects via GPS, falling back to the corporate profile's default city.
 * Extracted out of OfficeSupplies.tsx so both the home (browse) page and the
 * product-results page share one city, not two independently-drifting ones.
 */
export function useOfficeSuppliesCity() {
    const [selectedCity, setSelectedCity] = useState<SelectedCity | null>(readStoredCity);

    const { detect, isDetecting } = useCurrentLocation();
    // A city the user explicitly picked in the modal always wins — skip GPS then.
    const skipGps = useRef(selectedCity !== null && readStoredCitySource() === 'user');
    const [gpsDone, setGpsDone] = useState(skipGps.current);

    const persistCity = (city: SelectedCity | null, source: CitySource) => {
        setSelectedCity(city);
        try {
            if (city) {
                localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(city));
                localStorage.setItem(CITY_SOURCE_STORAGE_KEY, source);
            } else {
                localStorage.removeItem(CITY_STORAGE_KEY);
                localStorage.removeItem(CITY_SOURCE_STORAGE_KEY);
            }
        } catch {
            // ignore storage errors
        }
    };

    const handleUserSelectCity = (city: SelectedCity | null) => persistCity(city, 'user');

    // Auto-detect the city from the browser location on load. On denial/error the
    // fallback is silent: keep the stored auto city, else let useDefaultCity resolve.
    const hasDetected = useRef(false);
    useEffect(() => {
        if (skipGps.current || hasDetected.current) return undefined;
        hasDetected.current = true;

        let cancelled = false;
        detect().then(result => {
            if (cancelled) return;
            if (result.status === 'ok') persistCity(withPincode(result.city, result.pincode), 'auto');
            setGpsDone(true);
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Only fall back to the profile-address default once GPS has settled without a city.
    const { defaultCity, isLoading: isLoadingDefault } = useDefaultCity(gpsDone && !selectedCity);

    // Apply the resolved default city only if the user still hasn't picked one.
    useEffect(() => {
        if (defaultCity && !selectedCity) {
            persistCity(defaultCity, 'auto');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultCity]);

    return {
        selectedCity,
        setSelectedCity: handleUserSelectCity,
        isLoadingCity: (isDetecting || isLoadingDefault) && !selectedCity,
    };
}
