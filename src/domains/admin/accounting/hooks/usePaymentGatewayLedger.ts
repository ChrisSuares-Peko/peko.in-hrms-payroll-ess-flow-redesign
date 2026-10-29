import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getPaymentGatewayDetail,
    getPaymentGatewayList,
    getPaymentGatewaySettlements,
    getPaymentGatewayTransactions,
} from '../api/paymentGatewayLedger';
import { LEDGER_TABS, LedgerTabKey } from '../config/ledgerPaths';
import {
    PaymentGatewayDetailResponse,
    PaymentGatewayKpis,
    PaymentGatewayRow,
    PaymentGatewaySettlementEntry,
    PaymentGatewayTabFilters,
    PaymentGatewayTransactionEntry,
} from '../types/paymentGatewayLedger';

type ListFilters = { page: number; itemsPerPage: number; searchText: string };

export const usePaymentGatewayList = (filters: ListFilters) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [gateways, setGateways] = useState<PaymentGatewayRow[]>([]);
    const [kpis, setKpis] = useState<PaymentGatewayKpis | null>(null);
    const [count, setCount] = useState(0);
    const [generatedAt, setGeneratedAt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const load = useCallback(
        async (refresh: boolean) => {
            if (refresh) setIsRefreshing(true);
            else setIsLoading(true);

            const data = await getPaymentGatewayList({
                userId: id,
                userType: role,
                ...filters,
                refresh,
            });

            if (data) {
                setGateways(data.gateways || []);
                setKpis(data.kpis || null);
                setCount(data.recordsTotal || 0);
                setGeneratedAt(data.generatedAt || '');
            } else {
                setGateways([]);
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

    return { gateways, kpis, count, generatedAt, isLoading, isRefreshing, refresh };
};

export const usePaymentGatewayDetail = (
    gatewayId: string,
    range?: { from: string; to: string }
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [data, setData] = useState<PaymentGatewayDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const loadedGatewayId = useRef('');
    const from = range ? range.from : undefined;
    const to = range ? range.to : undefined;

    const load = useCallback(
        async (showSpinner: boolean) => {
            if (showSpinner) setIsLoading(true);
            const result = await getPaymentGatewayDetail({
                userId: id,
                userType: role,
                gatewayId,
                from,
                to,
            });
            setData(result || null);
            setIsLoading(false);
        },
        [id, role, gatewayId, from, to]
    );

    // The spinner shows only the first time a gateway is opened, so a write or a date change
    // refetches without unmounting the tab underneath it.
    useEffect(() => {
        const firstLoadForGateway = loadedGatewayId.current !== gatewayId;
        loadedGatewayId.current = gatewayId;
        load(firstLoadForGateway);
    }, [load, gatewayId]);

    const refetch = useCallback(() => load(false), [load]);

    return {
        gateway: data ? data.gateway : null,
        summary: data ? data.summary : null,
        isLoading,
        notFound: !isLoading && data === null,
        refetch,
    };
};

const EMPTY_CARD = {
    outstanding: 0,
    collected: 0,
    received: 0,
    fees: 0,
    opening: 0,
    transactionCount: 0,
    lastReceiptDate: null as string | null,
    openingBalanceSet: false,
    openingBalanceAsOf: null as string | null,
};

// Received & Bills is two tables from one call, so the hook keeps both lists and both
// totals rather than the single pair every other ledger tab needs.
export const usePaymentGatewayLedgerTab = (
    gatewayId: string,
    tab: LedgerTabKey,
    filters: PaymentGatewayTabFilters,
    feePage = 1
) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [rows, setRows] = useState<
        PaymentGatewayTransactionEntry[] | PaymentGatewaySettlementEntry[]
    >([]);
    const [count, setCount] = useState(0);
    const [feeRows, setFeeRows] = useState<PaymentGatewaySettlementEntry[]>([]);
    const [feeCount, setFeeCount] = useState(0);
    const [card, setCard] = useState(EMPTY_CARD);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const auth = { userId: id, userType: role, gatewayId };

        if (tab === LEDGER_TABS.receivedAndBills) {
            const data = await getPaymentGatewaySettlements({ ...auth, ...filters, feePage });
            if (data) {
                setRows(data.entries);
                setCount(data.recordsTotal);
                setFeeRows(data.feeEntries);
                setFeeCount(data.feeRecordsTotal);
                setCard({
                    outstanding: data.outstanding,
                    collected: data.collected,
                    received: data.received,
                    fees: data.fees,
                    opening: data.opening,
                    transactionCount: data.transactionCount,
                    lastReceiptDate: data.lastReceiptDate,
                    openingBalanceSet: Boolean(data.openingBalanceSet),
                    openingBalanceAsOf: data.openingBalanceAsOf ?? null,
                });
            } else {
                setRows([]);
                setCount(0);
                setFeeRows([]);
                setFeeCount(0);
            }
            setIsLoading(false);
            return;
        }

        if (tab === LEDGER_TABS.transactions) {
            const data = await getPaymentGatewayTransactions({ ...auth, ...filters });
            setRows(data ? data.entries : []);
            setCount(data ? data.recordsTotal : 0);
            setIsLoading(false);
            return;
        }

        setRows([]);
        setCount(0);
        setIsLoading(false);
    }, [id, role, gatewayId, tab, filters, feePage]);

    useEffect(() => {
        load();
    }, [load]);

    return { rows, count, feeRows, feeCount, card, isLoading, refetch: load };
};
