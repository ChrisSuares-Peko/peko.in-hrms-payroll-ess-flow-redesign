import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from 'lodash';

import { INDIAN_PIN_RE } from '../utils/indianCityStdCodes';

export type PlaceOption = {
    label: string;
    lat: number;
    lng: number;
};

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_HEADERS = { Accept: 'application/json' };

type NominatimRow = {
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: { country_code?: string };
};

/** Nominatim search URL restricted to India. PIN queries use postalcode, not free text. */
export const nominatimIndiaSearchUrl = ({
    q,
    postalcode,
    limit,
}: {
    q?: string;
    postalcode?: string;
    limit: number;
}) => {
    const params = new URLSearchParams({
        format: 'json',
        addressdetails: '1',
        countrycodes: 'in',
        limit: String(limit),
    });
    if (postalcode) params.set('postalcode', postalcode);
    else if (q) params.set('q', q);
    return `${NOMINATIM_SEARCH_URL}?${params}`;
};

export const isIndiaNominatimRow = (row: NominatimRow) =>
    String(row.address?.country_code || 'in').toLowerCase() === 'in';

/** Keep places whose label (or first segment) starts with the typed query. */
export const filterPlacesByPrefix = (items: PlaceOption[], query: string): PlaceOption[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(o => {
        const label = o.label.toLowerCase();
        const head = label.split(',')[0]?.trim() || label;
        return label.startsWith(q) || head.startsWith(q);
    });
};

const rowsToPlaces = (data: unknown): PlaceOption[] =>
    (Array.isArray(data) ? data : [])
        .filter((row: NominatimRow) => isIndiaNominatimRow(row))
        .map((r: NominatimRow) => ({
            label: String(r.display_name || ''),
            lat: parseFloat(r.lat || ''),
            lng: parseFloat(r.lon || ''),
        }))
        .filter(o => o.label && Number.isFinite(o.lat) && Number.isFinite(o.lng));

/**
 * One-off, awaitable geocode of a single place name — for click handlers that
 * need "resolve this now" rather than live-typing suggestions (e.g. the
 * "Locate on map" tab centering on the currently selected city). Not
 * debounced/stateful like useNominatimSearch below; callers firing this
 * repeatedly should debounce themselves.
 */
export async function geocodeFirstMatch(
    query: string
): Promise<{ lat: number; lng: number } | null> {
    const q = query.trim();
    if (!q) return null;
    try {
        const res = await fetch(nominatimIndiaSearchUrl({ q, limit: 1 }), {
            headers: NOMINATIM_HEADERS,
        });
        if (!res.ok) return null;
        const data = await res.json();
        const places = rowsToPlaces(data);
        const first = places[0];
        return first ? { lat: first.lat, lng: first.lng } : null;
    } catch {
        return null;
    }
}

const coordsFromNominatimRow = (row: NominatimRow | null) => {
    if (!row || !isIndiaNominatimRow(row)) return null;
    const lat = parseFloat(row.lat || '');
    const lng = parseFloat(row.lon || '');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
};

/**
 * Resolve an Indian 6-digit pincode to lat/lng via Nominatim (postal-code
 * search, then a plain "{pin}, India" query if that is empty).
 */
export async function geocodePincode(
    postcode: string
): Promise<{ lat: number; lng: number } | null> {
    const pin = postcode.replace(/\D/g, '');
    if (!INDIAN_PIN_RE.test(pin)) return null;
    try {
        const postal = await fetch(nominatimIndiaSearchUrl({ postalcode: pin, limit: 1 }), {
            headers: NOMINATIM_HEADERS,
        });
        if (postal.ok) {
            const data = await postal.json();
            const coords = coordsFromNominatimRow(Array.isArray(data) ? data[0] : null);
            if (coords) return coords;
        }
    } catch {
        // fall through to the free-text query
    }
    return geocodeFirstMatch(`${pin}, India`);
}

/**
 * Debounced free-text place search via OpenStreetMap Nominatim — used by
 * LocationMapStep's search bar to pan the map to a typed area. Mirrors
 * useCitySearch's 500ms debounce convention. India-only: PIN queries hit
 * postalcode+countrycodes=in so foreign 6-digit codes never appear.
 */
export function useNominatimSearch() {
    const [options, setOptions] = useState<PlaceOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const runId = useRef(0);
    const abortRef = useRef<AbortController | null>(null);

    const run = useCallback(async (text: string) => {
        const q = text.trim();
        runId.current += 1;
        const thisRun = runId.current;

        abortRef.current?.abort();
        if (!q) {
            setOptions([]);
            setIsSearching(false);
            return;
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setIsSearching(true);
        try {
            const isPin = INDIAN_PIN_RE.test(q);
            const res = await fetch(
                isPin
                    ? nominatimIndiaSearchUrl({ postalcode: q, limit: 5 })
                    : nominatimIndiaSearchUrl({ q, limit: 5 }),
                { headers: NOMINATIM_HEADERS, signal: controller.signal }
            );
            const data = res.ok ? await res.json() : [];

            if (runId.current !== thisRun) return; // a newer keystroke superseded this one

            const places = rowsToPlaces(data);
            // Prefix filter is for locality names. A PIN's display_name is the
            // place ("Connaught Place, Delhi…"), not the digits, so filtering
            // by prefix would drop India and keep foreign labels that start
            // with the PIN.
            setOptions(isPin ? places : filterPlacesByPrefix(places, q));
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') return;
            if (runId.current === thisRun) setOptions([]);
        } finally {
            if (runId.current === thisRun) setIsSearching(false);
        }
    }, []);

    const search = useMemo(() => debounce((text: string) => run(text), 500), [run]);

    useEffect(
        () => () => {
            search.cancel();
            abortRef.current?.abort();
        },
        [search]
    );

    return { options, isSearching, search };
}
