import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { lookupPostcode } from '../api/cityList';
import { cityFromGeocode, isIndiaCountry, type SelectedCity } from '../utils/indianCityStdCodes';

export type GeocodedAddress = {
    displayName: string;
    city: string | null;
    state: string | null;
    pincode: string | null;
    /** ONDC `std:` city in India; empty code outside India. */
    stdCity: SelectedCity;
};

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Reverse-geocodes a lat/lng via OpenStreetMap Nominatim (free, no API key) —
 * pairs with the Leaflet map in LocationMapStep. Stateful (owns `resolved`/
 * `isResolving` itself, rather than returning a bare promise for the caller
 * to juggle) so a fast pan-pan-pan can't let an older in-flight request's
 * response land after and overwrite a newer one: each call aborts whatever
 * request came before it, so only the latest one can ever update state.
 */
export function useReverseGeocode() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [resolved, setResolved] = useState<GeocodedAddress | null>(null);
    const [isResolving, setIsResolving] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const reverseGeocode = useCallback((lat: number, lng: number) => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsResolving(true);
        (async () => {
            try {
                const res = await fetch(
                    `${NOMINATIM_REVERSE_URL}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
                    { headers: { Accept: 'application/json' }, signal: controller.signal }
                );
                if (!res.ok) {
                    setResolved(null);
                    return;
                }
                const data = await res.json();
                if (!data || data.error) {
                    setResolved(null);
                    return;
                }

                const address = data.address || {};
                let city = address.city || address.town || address.village || address.county || null;
                let state = address.state || null;
                const pincode = address.postcode || null;
                const countryCode = address.country_code || null;
                const countryName = address.country || null;

                // India Post pincode lookup is India-only — a foreign postcode
                // must not map onto an Indian city.
                if (pincode && isIndiaCountry(countryCode || countryName)) {
                    const postcodeResult = await lookupPostcode({ userId: id, userType: role, postcode: pincode });
                    if (abortRef.current !== controller) return;
                    if (postcodeResult) {
                        const { city: pinCity, state: pinState } = postcodeResult;
                        if (pinCity) {
                            city = pinCity;
                            state = pinState || state;
                        }
                    }
                }

                const stdCity = cityFromGeocode({
                    cityName: city || state,
                    state,
                    countryCode,
                    countryName,
                });
                setResolved({
                    displayName: data.display_name || '',
                    city,
                    state,
                    pincode,
                    stdCity,
                });
            } catch (err) {
                // AbortError means a newer call superseded this one — that
                // newer call owns the final state, so leave it alone.
                if ((err as Error)?.name === 'AbortError') return;
                setResolved(null);
            } finally {
                if (abortRef.current === controller) setIsResolving(false);
            }
        })();
    }, [id, role]);

    // Abort any still-in-flight request when the owning component unmounts.
    useEffect(() => () => abortRef.current?.abort(), []);

    return { resolved, isResolving, reverseGeocode };
}
