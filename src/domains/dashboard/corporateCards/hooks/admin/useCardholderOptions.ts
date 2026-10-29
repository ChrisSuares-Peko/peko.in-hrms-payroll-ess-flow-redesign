import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getCardUsers } from '../../api/admin/cardUsersApi';
import { SelectOption } from '../../utils/types';

/**
 * Fetches cardholders from the admin-only /cardholders endpoint and returns dropdown-ready options.
 * Defaults to KYC-completed only — a cardholder filter should only offer members who can
 * actually hold a card / have transactions or requests (mirrors the Issue Card drawer).
 *
 * `enabled` gates the fetch: pass `false` on non-admin (cardholder/subcorporate) views. /cardholders
 * is guarded by verifyCorporateAdmin, so calling it from a subcorporate session 403s (and, via the
 * '004' response code, redirects the UI to /404) — a subcorporate is a single cardholder and has no
 * cardholder filter to populate.
 */
export const useCardholderOptions = (kycStatus = 'COMPLETED', enabled = true): SelectOption[] => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [options, setOptions] = useState<SelectOption[]>([]);

    useEffect(() => {
        if (!enabled) {
            setOptions([]);
            return undefined;
        }
        let cancelled = false;
        const fetch = async () => {
            const res = await getCardUsers(role, id, { kycStatus, itemsPerPage: 100 });
            if (!cancelled && res && res.data?.rows?.length) {
                setOptions(res.data.rows.map(u => ({ label: u.name, value: String(u.id) })));
            }
        };
        fetch();
        return () => {
            cancelled = true;
        };
    }, [role, id, kycStatus, enabled]);

    return options;
};
