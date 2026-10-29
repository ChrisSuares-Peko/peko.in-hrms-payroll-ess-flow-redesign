import { useCallback, useEffect, useState } from 'react';

import { SavedTraveller, SavedTravellerPayload, TravellerOption } from '@customtypes/savedTraveller';
import { useAppSelector } from '@src/hooks/store';
import {
    deleteSavedTraveller,
    getSavedTravellers,
    postSavedTraveller,
} from '@src/services/savedTravellers';

export interface SaveTravellerResult {
    ok: boolean;
    traveller?: SavedTraveller;
    atLimit?: boolean;
    message?: string;
}

export const generateSavedTravellersDropdown = (list: SavedTraveller[]): TravellerOption[] =>
    (list || []).map(t => {
        const fullName = `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim();
        return {
            value: `saved:${t.id}`,
            label: t.email ? `${fullName} (${t.email})` : fullName,
            source: 'saved',
            savedId: t.id,
            fullName,
            dateOfBirth: t.dateOfBirth ?? '',
            gender: t.gender ?? '',
            mobileNo: t.contactNo ?? '',
            email: t.email ?? '',
            addressLine1: t.addressLine1 ?? '',
            addressLine2: t.addressLine2 ?? '',
            city: t.city ?? '',
            nationality: t.nationality ?? '',
            passportNo: t.passportNo ?? '',
            passportExpiryDate: t.passportExpiry ?? '',
            title: t.title ?? '',
            passportIssueDate: t.passportIssueDate ?? '',
            cellCountryCode: t.cellCountryCode ?? '',
            pan: t.pan ?? '',
        };
    });

interface CacheEntry {
    data: SavedTraveller[];
    limit: number;
    loaded: boolean;
    inflight: Promise<void> | null;
    subscribers: Set<() => void>;
}

const cache = new Map<string, CacheEntry>();
const cacheKey = (role: string, id: number, accessKey: string) => `${role}:${id}:${accessKey}`;

const getEntry = (key: string): CacheEntry => {
    let entry = cache.get(key);
    if (!entry) {
        entry = { data: [], limit: Infinity, loaded: false, inflight: null, subscribers: new Set() };
        cache.set(key, entry);
    }
    return entry;
};

const notify = (entry: CacheEntry) => entry.subscribers.forEach(fn => fn());

const loadEntry = (
    key: string,
    role: string,
    id: number,
    accessKey: string,
    force: boolean
): Promise<void> => {
    const entry = getEntry(key);
    if (entry.inflight) return entry.inflight;
    if (entry.loaded && !force) return Promise.resolve();
    entry.inflight = getSavedTravellers({ userType: role, userId: id, type: accessKey })
        .then(res => {
            if (res) {
                entry.data = res.travellers;
                entry.limit = res.limit;
                entry.loaded = true;
            }
        })
        .finally(() => {
            entry.inflight = null;
            notify(entry);
        });
    return entry.inflight;
};

export const useSavedTravellers = (serviceAccessKey: string) => {
    const auth = useAppSelector(state => state.reducer.auth);
    const role = auth?.role;
    const id = auth?.id;
    const key =
        role != null && id != null && serviceAccessKey
            ? cacheKey(role, id, serviceAccessKey)
            : null;

    const [, forceRender] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!key || role == null || id == null) return undefined;
        const entry = getEntry(key);
        const rerender = () => forceRender(n => n + 1);
        entry.subscribers.add(rerender);
        if (!entry.loaded && !entry.inflight) {
            setIsLoading(true);
            loadEntry(key, role, id, serviceAccessKey, false).finally(() => setIsLoading(false));
        }
        return () => {
            entry.subscribers.delete(rerender);
        };
    }, [key, role, id, serviceAccessKey]);

    const entry = key ? getEntry(key) : null;
    const data = entry ? entry.data : [];
    const limit = entry ? entry.limit : Infinity;
    const canSaveMore = data.length < limit;

    const fetchSavedTravellers = useCallback(async () => {
        if (!key || role == null || id == null) return;
        await loadEntry(key, role, id, serviceAccessKey, true);
    }, [key, role, id, serviceAccessKey]);

    const saveTraveller = async (payload: SavedTravellerPayload): Promise<SaveTravellerResult> => {
        if (role == null || id == null) return { ok: false };
        const resp = await postSavedTraveller(role, id, { ...payload, type: serviceAccessKey });
        if (resp && resp.status) {
            await fetchSavedTravellers();
            return { ok: true, traveller: resp.data };
        }
        if (resp && resp.responseCode === '003') {
            await fetchSavedTravellers();
            return { ok: false, atLimit: true, message: resp.message };
        }
        return { ok: false };
    };

    const removeTraveller = async (travellerId: number) => {
        if (role == null || id == null) return false;
        const ok = await deleteSavedTraveller(role, id, travellerId);
        if (ok) await fetchSavedTravellers();
        return ok;
    };

    return {
        data,
        limit,
        canSaveMore,
        isLoading,
        fetchSavedTravellers,
        saveTraveller,
        removeTraveller,
        generateSavedTravellersDropdown,
    };
};
