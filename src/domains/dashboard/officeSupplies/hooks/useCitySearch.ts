import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { debounce } from 'lodash';

import { useAppSelector } from '@src/hooks/store';

import { lookupPostcode } from '../api/cityList';
import { INDIAN_PIN_RE, resolveCity, searchLocalCities } from '../utils/indianCityStdCodes';

/**
 * A selectable city option: `value` is the ONDC std code, `label` the display
 * name. `pincode`/`state` are present when resolved from a pincode lookup (used
 * for the "{pincode} · {state}" secondary line and recent locations).
 */
export type CityOption = { label: string; value: string; pincode?: string; state?: string };

/**
 * Hybrid location search — fully offline for names (no Google dependency):
 *  - a 6-digit **pincode** is resolved via India Post (purchase MS) → city;
 *  - otherwise the text is searched in the local merged std-code index
 *    (~2,700 cities from stdCodes.json + the curated list).
 * Every result carries a valid ONDC "std:<STD_CODE>" — names missing from the
 * index resolve through their state's anchor city (see resolveCity).
 */
export function useCitySearch() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<CityOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const runId = useRef(0);

    const run = useCallback(
        async (text: string) => {
            const q = text.trim();
            runId.current += 1;
            const thisRun = runId.current;
            if (!q) {
                setOptions([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);

            let opts: CityOption[] = [];
            if (INDIAN_PIN_RE.test(q)) {
                // Pincode → India Post → city → std code (own or state anchor).
                const result = await lookupPostcode({ userId: id, userType: role, postcode: q });
                if (result && result.city) {
                    const city = resolveCity(result.city, result.state);
                    opts = [{ label: city.name, value: city.code, pincode: q, state: result.state }];
                }
            } else {
                // City name → local merged std-code index (state shown so
                // duplicate names across states stay distinguishable).
                opts = searchLocalCities(q).map(c => ({
                    label: c.name,
                    value: c.code,
                    state: c.state,
                }));
            }

            // A newer keystroke's search superseded this one.
            if (runId.current !== thisRun) return;

            setOptions(opts);
            setIsSearching(false);
        },
        [id, role]
    );

    const search = useMemo(() => debounce((text: string) => run(text), 500), [run]);

    useEffect(() => () => search.cancel(), [search]);

    return { options, isSearching, search };
}
