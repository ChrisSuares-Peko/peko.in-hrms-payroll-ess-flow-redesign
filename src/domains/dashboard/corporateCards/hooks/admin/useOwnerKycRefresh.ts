import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getKycStatus } from '../../api/user/kycApi';
import { Member } from '../../utils/types';

/**
 * Brings the account owner's KYC status up to date on the People screen.
 *
 * The listing only reads our stored `cardholderKyc` record, and that record advances solely when something
 * ASKS the issuer — the cardholder-side status poll, or the vendor's KYC webhook. Neither happens while an
 * admin sits on this screen, so an approved KYC kept rendering as Pending indefinitely.
 *
 * Reads only the CALLER'S OWN status: the endpoint resolves the owner's cardholder row from their session and
 * refuses anyone else (requireOwnCardholderIdentity), so this cannot fetch another person's KYC. Bounded by
 * the server's own per-mobile cooldown, so a remount storm cannot hammer the issuer.
 *
 * Fires once per mount, and only when there is something to learn — a row that is already Completed is
 * terminal. `refreshed` flips only when the status actually moved, so the caller refetches the page once
 * rather than looping on its own result.
 */
export const useOwnerKycRefresh = (members: Member[]) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const attempted = useRef(false);
    const [refreshed, setRefreshed] = useState(0);

    const owner = members.find(m => m.isAccountOwner);
    const stale = !!owner && owner.kycStatus !== 'Completed';

    useEffect(() => {
        if (!stale || attempted.current) return;
        attempted.current = true;

        const run = async () => {
            const res = await getKycStatus(role, id);
            if (res && res.data?.kyc?.isCompleted) setRefreshed(n => n + 1);
        };
        run();
    }, [stale, role, id]);

    return { refreshed };
};
