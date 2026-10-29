import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getPartnerDebitNotes,
    getPartnerLedgerDetail,
    getPartnerLedgerList,
    getPartnerPayouts,
    getPartnerSubscriptions,
    getPartnerTransactions,
} from '../api/partnerLedger';
import { LEDGER_TABS, LedgerTabKey } from '../config/ledgerPaths';
import {
    PartnerDebitNoteEntry,
    PartnerLedgerDetailResponse,
    PartnerLedgerKpis,
    PartnerLedgerRow,
    PartnerLedgerTabFilters,
    PartnerPayoutEntry,
    PartnerSubscriptionEntry,
    PartnerTransactionEntry,
} from '../types/partnerLedger';

type ListFilters = { page: number; itemsPerPage: number; searchText: string };

export type PartnerLedgerEntry =
    | PartnerTransactionEntry
    | PartnerSubscriptionEntry
    | PartnerPayoutEntry
    | PartnerDebitNoteEntry;

export const usePartnerLedgerList = (filters: ListFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [partners, setPartners] = useState<PartnerLedgerRow[]>([]);
    const [kpis, setKpis] = useState<PartnerLedgerKpis | null>(null);
    const [count, setCount] = useState(0);
    const [generatedAt, setGeneratedAt] = useState('');
    const [accountConfigured, setAccountConfigured] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(
        async (refresh: boolean) => {
            if (refresh) setIsRefreshing(true);
            else setIsLoading(true);

            const data = await getPartnerLedgerList({
                userId: id,
                userType: role,
                ...filters,
                refresh,
            });

            if (data) {
                setPartners(data.partners || []);
                setKpis(data.kpis || null);
                setCount(data.recordsTotal || 0);
                setGeneratedAt(data.generatedAt || '');
                setAccountConfigured(data.partnershipAccountConfigured !== false);
            } else {
                setPartners([]);
                setCount(0);
            }

            setIsLoading(false);
            setIsRefreshing(false);
        },
        [id, role, filters]
    );

    useEffect(() => {
        load(false);
    }, [load]);

    const refresh = useCallback(() => load(true), [load]);

    return {
        partners,
        kpis,
        count,
        generatedAt,
        accountConfigured,
        isLoading,
        isRefreshing,
        refresh,
    };
};

export const usePartnerLedgerDetail = (partnerId: string, range?: { from: string; to: string }) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<PartnerLedgerDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const loadedPartnerId = useRef('');
    const from = range ? range.from : undefined;
    const to = range ? range.to : undefined;

    const load = useCallback(
        async (showSpinner: boolean) => {
            if (showSpinner) setIsLoading(true);
            const result = await getPartnerLedgerDetail({
                userId: id,
                userType: role,
                partnerId,
                from,
                to,
            });
            setData(result || null);
            setIsLoading(false);
        },
        [id, role, partnerId, from, to]
    );

    // The spinner shows only the first time a partner is opened, so a write or a date change
    // refetches without unmounting the tab underneath it.
    useEffect(() => {
        const firstLoadForPartner = loadedPartnerId.current !== partnerId;
        loadedPartnerId.current = partnerId;
        load(firstLoadForPartner);
    }, [load, partnerId]);

    const refetch = useCallback(() => load(false), [load]);

    return {
        partner: data ? data.partner : null,
        summary: data ? data.summary : null,
        accountConfigured: data ? data.partnershipAccountConfigured !== false : true,
        gstRate: data && typeof data.gstRate === 'number' ? data.gstRate : null,
        isLoading,
        notFound: !isLoading && data === null,
        refetch,
    };
};

const TAB_LOADERS = {
    [LEDGER_TABS.transactions]: getPartnerTransactions,
    [LEDGER_TABS.ownSubscriptions]: getPartnerSubscriptions,
    [LEDGER_TABS.payments]: getPartnerPayouts,
    [LEDGER_TABS.debitNotes]: getPartnerDebitNotes,
};

export const usePartnerLedgerTab = (
    partnerId: string,
    tab: LedgerTabKey,
    filters: PartnerLedgerTabFilters
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<PartnerLedgerEntry[]>([]);
    const [count, setCount] = useState(0);
    const [owed, setOwed] = useState(0);
    const [lastPayoutDate, setLastPayoutDate] = useState<string | null>(null);
    const [openingBalanceSet, setOpeningBalanceSet] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        const loader = TAB_LOADERS[tab as keyof typeof TAB_LOADERS];
        if (!loader) {
            setRows([]);
            setCount(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const data = await loader({ userId: id, userType: role, partnerId, ...filters });
        if (data) {
            setRows(data.entries as PartnerLedgerEntry[]);
            setCount(data.recordsTotal);
            // Only the payments tab carries the card above the table.
            setOwed('owed' in data ? data.owed : 0);
            setLastPayoutDate('lastPayoutDate' in data ? data.lastPayoutDate : null);
            setOpeningBalanceSet(
                'openingBalanceSet' in data ? Boolean(data.openingBalanceSet) : false
            );
        } else {
            setRows([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, partnerId, tab, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, count, owed, lastPayoutDate, openingBalanceSet, isLoading, refetch: load };
};
