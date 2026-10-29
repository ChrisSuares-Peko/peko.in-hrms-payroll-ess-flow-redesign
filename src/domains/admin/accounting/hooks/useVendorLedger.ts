import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getVendorCommissions,
    getVendorCostOfSales,
    getVendorCreditNotes,
    getVendorDebitNotes,
    getVendorDeposits,
    getVendorLedgerDetail,
    getVendorLedgerList,
    getVendorTransactions,
} from '../api/vendorLedger';
import { LEDGER_TABS, LedgerTabKey } from '../config/ledgerPaths';
import {
    VendorLedgerDetailResponse,
    VendorLedgerEntry,
    VendorLedgerKpis,
    VendorLedgerRow,
    VendorLedgerTabFilters,
} from '../types/vendorLedger';

type ListFilters = { page: number; itemsPerPage: number; searchText: string };

export const useVendorLedgerList = (filters: ListFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [vendors, setVendors] = useState<VendorLedgerRow[]>([]);
    const [kpis, setKpis] = useState<VendorLedgerKpis | null>(null);
    const [count, setCount] = useState(0);
    const [generatedAt, setGeneratedAt] = useState('');
    const [accountConfigured, setAccountConfigured] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(
        async (refresh: boolean) => {
            if (refresh) setIsRefreshing(true);
            else setIsLoading(true);

            const data = await getVendorLedgerList({
                userId: id,
                userType: role,
                refresh,
                ...filters,
            });

            if (data) {
                setVendors(data.vendors);
                setKpis(data.kpis);
                setCount(data.recordsTotal);
                setGeneratedAt(data.generatedAt);
                setAccountConfigured(data.vendorDepositsAccountConfigured !== false);
            } else {
                setVendors([]);
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
        vendors,
        kpis,
        count,
        generatedAt,
        accountConfigured,
        isLoading,
        isRefreshing,
        refresh,
    };
};

export const useVendorLedgerDetail = (vendorId: string, range?: { from: string; to: string }) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<VendorLedgerDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const loadedVendorId = useRef('');
    const from = range ? range.from : undefined;
    const to = range ? range.to : undefined;

    const load = useCallback(
        async (showSpinner: boolean) => {
            if (showSpinner) setIsLoading(true);
            const result = await getVendorLedgerDetail({
                userId: id,
                userType: role,
                vendorId,
                from,
                to,
            });
            setData(result || null);
            setIsLoading(false);
        },
        [id, role, vendorId, from, to]
    );

    useEffect(() => {
        const firstLoadForVendor = loadedVendorId.current !== vendorId;
        loadedVendorId.current = vendorId;
        load(firstLoadForVendor);
    }, [load, vendorId]);

    const refetch = useCallback(() => load(false), [load]);

    return {
        vendor: data ? data.vendor : null,
        summary: data ? data.summary : null,
        accountConfigured: data ? data.vendorDepositsAccountConfigured !== false : true,
        gstRate: data && typeof data.gstRate === 'number' ? data.gstRate : null,
        isLoading,
        notFound: !isLoading && data === null,
        refetch,
    };
};

const TAB_LOADERS = {
    [LEDGER_TABS.transactions]: getVendorTransactions,
    [LEDGER_TABS.commissions]: getVendorCommissions,
    [LEDGER_TABS.costOfSales]: getVendorCostOfSales,
    [LEDGER_TABS.debitNotes]: getVendorDebitNotes,
    [LEDGER_TABS.deposits]: getVendorDeposits,
    [LEDGER_TABS.creditNotes]: getVendorCreditNotes,
};

export const useVendorLedgerTab = (
    vendorId: string,
    tab: LedgerTabKey,
    filters: VendorLedgerTabFilters
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<VendorLedgerEntry[]>([]);
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
        const data = await loader({ userId: id, userType: role, vendorId, ...filters });
        if (data) {
            setRows(data.entries as VendorLedgerEntry[]);
            setCount(data.recordsTotal);
        } else {
            setRows([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, vendorId, tab, filters]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, count, isLoading, refetch: load };
};
