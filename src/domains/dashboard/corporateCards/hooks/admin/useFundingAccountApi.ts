import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getFundingAccount } from '../../api/admin/walletApi';
import { FundingAccountDetails } from '../../utils/types';

/**
 * Fetches the corporate's funding (virtual bank) account the first time the top-up modal opens, then
 * caches it for the session. `loaded` distinguishes "not fetched yet" from "fetched, not provisioned"
 * (both surface as a null account).
 */
export const useFundingAccountApi = (open: boolean) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [fundingAccount, setFundingAccount] = useState<FundingAccountDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!open || loaded) return;
        let active = true;
        (async () => {
            setIsLoading(true);
            const res = await getFundingAccount(role, id);
            if (active) {
                setFundingAccount(res);
                setLoaded(true);
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line consistent-return
        return () => {
            active = false;
        };
    }, [open, loaded, role, id]);

    return { fundingAccount, isLoading, loaded };
};
