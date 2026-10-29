import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getSubscriberBills,
    getSubscriberLedgerDetail,
    getSubscriberLedgerList,
    getSubscriberTransactions,
    getSubscriberWallet,
} from '../api/subscriberLedger';
import { LEDGER_TABS, LedgerTabKey } from '../config/ledgerPaths';
import {
    SubscriberLedgerDetailResponse,
    SubscriberLedgerEntry,
    SubscriberLedgerKpis,
    SubscriberLedgerRow,
    SubscriberLedgerTabFilters,
} from '../types/subscriberLedger';

type ListFilters = {
    page: number;
    itemsPerPage: number;
    searchText: string;
    partnerId?: string;
};

export const useSubscriberLedgerList = (filters: ListFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [subscribers, setSubscribers] = useState<SubscriberLedgerRow[]>([]);
    const [kpis, setKpis] = useState<SubscriberLedgerKpis | null>(null);
    const [count, setCount] = useState(0);
    const [generatedAt, setGeneratedAt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(
        async (refresh: boolean) => {
            if (refresh) setIsRefreshing(true);
            else setIsLoading(true);

            const data = await getSubscriberLedgerList({
                userId: id,
                userType: role,
                refresh,
                ...filters,
            });

            if (data) {
                setSubscribers(data.subscribers);
                setKpis(data.kpis);
                setCount(data.recordsTotal);
                setGeneratedAt(data.generatedAt);
            } else {
                setSubscribers([]);
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

    return { subscribers, kpis, count, generatedAt, isLoading, isRefreshing, refresh };
};

export const useSubscriberLedgerDetail = (
    credentialId: string,
    range?: { from: string; to: string }
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<SubscriberLedgerDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const loadedId = useRef('');
    const from = range ? range.from : undefined;
    const to = range ? range.to : undefined;

    const load = useCallback(
        async (showSpinner: boolean) => {
            if (showSpinner) setIsLoading(true);
            const result = await getSubscriberLedgerDetail({
                userId: id,
                userType: role,
                credentialId,
                from,
                to,
            });
            setData(result || null);
            setIsLoading(false);
        },
        [id, role, credentialId, from, to]
    );

    useEffect(() => {
        const firstLoad = loadedId.current !== credentialId;
        loadedId.current = credentialId;
        load(firstLoad);
    }, [load, credentialId]);

    const refetch = useCallback(() => load(false), [load]);

    return {
        subscriber: data ? data.subscriber : null,
        summary: data ? data.summary : null,
        isLoading,
        notFound: !isLoading && data === null,
        refetch,
    };
};

const TAB_LOADERS = {
    [LEDGER_TABS.transactions]: getSubscriberTransactions,
    [LEDGER_TABS.wallet]: getSubscriberWallet,
    [LEDGER_TABS.bills]: getSubscriberBills,
};

export const useSubscriberLedgerTab = (
    credentialId: string,
    tab: LedgerTabKey,
    filters: SubscriberLedgerTabFilters
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<SubscriberLedgerEntry[]>([]);
    const [count, setCount] = useState(0);
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
        const data = await loader({ userId: id, userType: role, credentialId, ...filters });
        if (data) {
            setRows(data.entries as SubscriberLedgerEntry[]);
            setCount(data.recordsTotal);
        } else {
            setRows([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, credentialId, tab, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, count, isLoading, refetch: load };
};
