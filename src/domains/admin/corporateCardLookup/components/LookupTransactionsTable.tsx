import { useCallback, useEffect, useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import type { TableProps } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { DateCell, maskedLast4, money } from './lookupMeta';
import LookupTableCard from './LookupTableCard';
import {
    getCorporateCardTransaction,
    getCorporateCardTransactions,
} from '../../reports/api/corporateCardTransactions';
import StatusTag from '../../reports/components/corporateCards/StatusTag';
import TransactionDetailDrawer from '../../reports/components/corporateCards/TransactionDetailDrawer';
import {
    eventLabel,
    transactionTypeLabel,
} from '../../reports/components/corporateCards/transactionMeta';
import {
    CorporateCardTransactionDetail,
    CorporateCardTransactionRow,
} from '../../reports/types/corporateCardTransactions';

const PAGE_SIZE = 10;

const LookupTransactionsTable = ({ corporateId }: { corporateId: number | undefined }) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [rows, setRows] = useState<CorporateCardTransactionRow[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [viewRecord, setViewRecord] = useState<CorporateCardTransactionDetail | null>(null);
    const [viewLoadingId, setViewLoadingId] = useState<number | null>(null);

    useEffect(() => {
        setPage(1);
    }, [corporateId]);

    useEffect(() => {
        if (!corporateId) {
            setRows([]);
            setCount(0);
            return;
        }
        const load = async () => {
            setIsLoading(true);
            const data = await getCorporateCardTransactions({
                userId: id,
                userType: role,
                corporateId,
                page,
                itemsPerPage: PAGE_SIZE,
            });
            setRows(data ? data.rows : []);
            setCount(data ? data.count : 0);
            setIsLoading(false);
        };
        load();
    }, [id, role, corporateId, page]);

    const openTransaction = useCallback(
        async (transactionId: number) => {
            setViewLoadingId(transactionId);
            const detail = await getCorporateCardTransaction(role, id, transactionId);
            setViewLoadingId(null);
            if (!detail) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Could not load the transaction. Please try again.',
                    })
                );
                return;
            }
            setViewRecord(detail);
        },
        [role, id, dispatch]
    );

    const columns: TableProps<CorporateCardTransactionRow>['columns'] = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: string) => <DateCell value={value} />,
        },
        {
            title: 'Transaction',
            key: 'transaction',
            render: (_: unknown, row) => (
                <Flex vertical>
                    <Typography.Text className="font-medium">{row.displayId}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        {row.transactionUniqueId}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Cardholder',
            key: 'cardholder',
            render: (_: unknown, row) => (
                <Flex vertical>
                    <Typography.Text>{row.cardholderName || '-'}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        {maskedLast4(row.cardLast4)}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Merchant',
            key: 'merchant',
            render: (_: unknown, row) => (
                <Flex vertical>
                    <Typography.Text>{row.merchantName || '-'}</Typography.Text>
                    <Typography.Text type="secondary" className="text-xs">
                        {row.category || row.merchantCity || '-'}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'transactionAmount',
            key: 'transactionAmount',
            render: (value: number) => money(value),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: unknown, row) => (
                <Flex vertical gap={2} className="max-w-[240px]">
                    <StatusTag status={row.status} />
                    <Typography.Text type="secondary" className="text-xs">
                        {eventLabel(row.eventType)} · {transactionTypeLabel(row.transactionType)}
                    </Typography.Text>
                    {row.declineReason && (
                        <Typography.Text type="danger" className="text-xs whitespace-normal">
                            {row.declineReason}
                        </Typography.Text>
                    )}
                </Flex>
            ),
        },
        {
            title: '',
            key: 'action',
            render: (_: unknown, row) => (
                <Button
                    type="link"
                    loading={viewLoadingId === row.id}
                    onClick={() => openTransaction(row.id)}
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <>
            <LookupTableCard<CorporateCardTransactionRow>
                title="Card Transactions"
                columns={columns}
                dataSource={rows}
                rowKey="id"
                loading={isLoading}
                emptyText="No card transactions"
                pagination={{ page, pageSize: PAGE_SIZE, total: count, onChange: setPage }}
            />
            <TransactionDetailDrawer record={viewRecord} onClose={() => setViewRecord(null)} />
        </>
    );
};

export default LookupTransactionsTable;
