import { useCallback, useState } from 'react';

import { SelectedCity } from '../utils/indianCityStdCodes';

/** A selected location, optionally enriched with the pincode/state it resolved from. */
export type RecentLocation = SelectedCity & { pincode?: string; state?: string };

const RECENTS_KEY = 'officeSuppliesRecentCities';
const MAX_RECENTS = 5;

const readRecents = (): RecentLocation[] => {
    try {
        const raw = localStorage.getItem(RECENTS_KEY);
        const parsed = raw ? (JSON.parse(raw) as RecentLocation[]) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * Persisted "recent locations" list for the Deliver-to picker (localStorage).
 * De-dupes by ONDC `code`, newest first, capped at MAX_RECENTS.
 */
export const useRecentLocations = () => {
    const [recents, setRecents] = useState<RecentLocation[]>(readRecents);

    const addRecent = useCallback((entry: RecentLocation) => {
        if (!entry?.code) return;
        setRecents(prev => {
            const next = [entry, ...prev.filter(r => r.code !== entry.code)].slice(0, MAX_RECENTS);
            try {
                localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
            } catch {
                // ignore storage errors
            }
            return next;
        });
    }, []);

    return { recents, addRecent };
};
