import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { createOwnerCardholderProfile } from '../../api/user/switchRoleApi';
import { isAccountOwner } from '../../utils/activeRole';

/**
 * Makes sure the account owner's cardholder row exists, so the People table can list them as its first
 * member.
 *
 * Without this the requirement is circular: the row is what puts them in the list, and until this change the
 * only thing that created it was switching to Employee mode — so an account that had never used the switcher
 * (which is most of them) would never see itself, and would have no row to act on.
 *
 * Safe to run on a page load: the endpoint is idempotent, needs no input (the server builds the row from the
 * personal name and OTP-verified mobile captured at registration), and can only ever create the CALLER's own
 * row. Fired once per mount, guarded by a ref — `created` re-triggers the member fetch, so re-running on that
 * would loop.
 *
 * Owner-only. An employee Admin viewing the same screen has no such row to create (their member row IS
 * their identity) and the server refuses them with 007, so they must not ask at all.
 */
export const useEnsureOwnerCardholder = () => {
    const { role } = useAppSelector(state => state.reducer.auth);
    const isOwner = isAccountOwner(role);

    const attempted = useRef(false);
    const [isProvisioning, setIsProvisioning] = useState(isOwner);
    const [created, setCreated] = useState(false);

    useEffect(() => {
        if (!isOwner || attempted.current) return;
        attempted.current = true;

        const run = async () => {
            const res = await createOwnerCardholderProfile();
            setIsProvisioning(false);
            if (res && res.data?.created) setCreated(true);
        };
        run();
    }, [isOwner]);

    return { isProvisioning, created };
};
