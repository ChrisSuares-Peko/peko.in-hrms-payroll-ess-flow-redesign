import { useState } from 'react';

import { cityFromGeocode, indianPincode, SelectedCity } from '../utils/indianCityStdCodes';

const GPS_TIMEOUT_MS = 8000;

export type CurrentLocationResult =
    | { status: 'ok'; city: SelectedCity; pincode?: string; state?: string }
    | { status: 'denied' }
    | { status: 'error' };

/** Resolve the browser's GPS position to a lat/lng (or null on denial/error). */
export const getPosition = (): Promise<GeolocationPosition | null> =>
    new Promise(resolve => {
        if (!('geolocation' in navigator)) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve(pos),
            () => resolve(null),
            { timeout: GPS_TIMEOUT_MS, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false }
        );
    });

/** Resolve a lat/lng to an Indian PIN via BigDataCloud (same source as `detect`). */
export const pincodeFromCoords = async (lat: number, lng: number): Promise<string | undefined> => {
    const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return indianPincode(data.postcode);
};

/**
 * "Use my current location": browser GPS → BigDataCloud reverse-geocode (free,
 * no API key). In India this maps to an ONDC `std:` code; outside India the
 * city is stored with an empty code. Returns a tagged result so the caller
 * can toast appropriately.
 */
export const useCurrentLocation = () => {
    const [isDetecting, setIsDetecting] = useState(false);

    const detect = async (): Promise<CurrentLocationResult> => {
        setIsDetecting(true);
        try {
            const pos = await getPosition();
            if (!pos) return { status: 'denied' };

            const { latitude, longitude } = pos.coords;
            const res = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (!res.ok) return { status: 'error' };
            const data = await res.json();

            const cityName: string | undefined = data.city || data.locality;
            const country = data.countryCode || data.countryName;
            if (!cityName && !country) return { status: 'error' };

            return {
                status: 'ok',
                city: cityFromGeocode({
                    cityName,
                    state: data.principalSubdivision,
                    countryCode: data.countryCode,
                    countryName: data.countryName,
                }),
                pincode: indianPincode(data.postcode),
                state: data.principalSubdivision || undefined,
            };
        } catch {
            return { status: 'error' };
        } finally {
            setIsDetecting(false);
        }
    };

    return { detect, isDetecting };
};
