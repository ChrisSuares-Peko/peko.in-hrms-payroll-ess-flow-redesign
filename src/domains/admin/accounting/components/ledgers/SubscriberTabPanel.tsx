import { useEffect, useMemo, useState } from 'react';

import { DownloadOutlined, FileSearchOutlined, SwapOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Pagination, Tooltip } from 'antd';
import { Link } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { faqTabOf, withFaqTitles } from '@src/domains/admin/accounting/faq/FaqHint';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { SUBSCRIBER_TAB_COPY, subscriberTabColumns } from './subscriberColumns';
import { downloadSubscriberOrderDocument } from '../../api/subscriberLedger';
import { LEDGER_TABS, LedgerTabKey } from '../../config/ledgerPaths';
import { useSubscriberLedgerTab } from '../../hooks/useSubscriberLedger';
import useSubscriberLedgerExport from '../../hooks/useSubscriberLedgerExport';
import {
    SubscriberBillEntry,
    SubscriberLedgerTabFilters,
    SubscriberOrderDocument,
    SubscriberTransactionEntry,
} from '../../types/subscriberLedger';
import ExportButtons from '../common/ExportButtons';
import LedgerFilterBar, { FilterSpec, LedgerSearchInput } from '../common/LedgerFilterBar';
import TabHeader from '../serviceDetail/TabHeader';

const PAGE_SIZE = 10;

export const ADJUST_WALLET_PATH = `${paths.systemUser.accounts}/${paths.accounts.transferFunds}`;
export const WALLET_REPORT_PATH = `${paths.systemUser.reports}/${paths.reportsAdmin.walletReport}`;

// The wallet is one running balance with no date column, so it cannot be floored the way the
// order-derived tabs are. These two say so rather than letting the bases be mistaken.
const WALLET_BASIS_TABS: LedgerTabKey[] = [LEDGER_TABS.wallet];

type FilterKey = 'status' | 'type' | 'side';

type SubscriberFilter = FilterSpec & { key: FilterKey };

type FilterControls = {
    searchPlaceholder: string;
    selects: SubscriberFilter[];
    emptyText: string;
};

// Each choice is a name the table itself shows (its Status or Type pill, or the Debit and
// Credit columns), so a filter never promises something the table lacks. Bills shows none of
// these, so it can only be searched.
const FILTER_CONTROLS: Partial<Record<LedgerTabKey, FilterControls>> = {
    [LEDGER_TABS.transactions]: {
        searchPlaceholder: 'Search reference or service',
        selects: [
            {
                key: 'status',
                label: 'Status',
                placeholder: 'All statuses',
                options: [
                    { value: 'success', label: 'Success' },
                    { value: 'refunded', label: 'Refunded' },
                    { value: 'failed', label: 'Failed' },
                ],
                className: 'w-full sm:w-44',
            },
        ],
        emptyText: 'No transactions match your search or filter.',
    },
    [LEDGER_TABS.wallet]: {
        searchPlaceholder: 'Search reference, particulars or type',
        selects: [
            {
                key: 'type',
                label: 'Type',
                placeholder: 'All types',
                options: [
                    { value: 'purchase', label: 'Purchase' },
                    { value: 'refund', label: 'Refund' },
                    { value: 'cashback', label: 'Cashback' },
                    { value: 'cashback-reversal', label: 'Cashback reversal' },
                    { value: 'top-up', label: 'Top-up' },
                    { value: 'admin-credit', label: 'Admin credit' },
                    { value: 'admin-withdrawal', label: 'Admin withdrawal' },
                ],
                className: 'w-full sm:w-48',
            },
            {
                key: 'side',
                label: 'Debit or credit',
                placeholder: 'All entries',
                options: [
                    { value: 'debit', label: 'Debit' },
                    { value: 'credit', label: 'Credit' },
                ],
                className: 'w-full sm:w-40',
            },
        ],
        emptyText: 'No wallet entries match your search or filter.',
    },
    [LEDGER_TABS.bills]: {
        searchPlaceholder: 'Search reference, document number or service',
        selects: [],
        emptyText: 'No bills match your search.',
    },
};

type SubscriberTabPanelProps = {
    credentialId: string;
    subscriberName: string;
    tab: LedgerTabKey;
    range: { from: string; to: string };
};

const SubscriberTabPanel = ({
    credentialId,
    subscriberName,
    tab,
    range,
}: SubscriberTabPanelProps) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [page, setPage] = useState(1);
    const [downloading, setDownloading] = useState<string | null>(null);

    const [query, setQuery] = useState({ searchText: '' });
    const [selected, setSelected] = useState<Partial<Record<FilterKey, string>>>({});
    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const controls = FILTER_CONTROLS[tab];

    const picked = useMemo(
        () =>
            Object.fromEntries(Object.entries(selected).filter(([, value]) => value)) as Partial<
                Record<FilterKey, string>
            >,
        [selected]
    );
    const isFiltered = Boolean(query.searchText) || Object.keys(picked).length > 0;

    // Changing the date range, the search or a filter can shrink the result set below the page
    // an admin is currently on, which would otherwise request a page past the end.
    useEffect(() => {
        setPage(1);
    }, [range.from, range.to, query.searchText, picked]);

    const filters = useMemo<SubscriberLedgerTabFilters>(
        () => ({
            page,
            itemsPerPage: PAGE_SIZE,
            from: range.from,
            to: range.to,
            ...(query.searchText ? { searchText: query.searchText } : {}),
            ...picked,
        }),
        [page, range.from, range.to, query.searchText, picked]
    );
    const { rows, count, isLoading } = useSubscriberLedgerTab(credentialId, tab, filters);
    const { exportingFormat, exportAs } = useSubscriberLedgerExport(
        credentialId,
        subscriberName,
        tab,
        {
            ...range,
            searchText: query.searchText,
            ...picked,
        }
    );

    const copy = SUBSCRIBER_TAB_COPY[tab];

    const downloadDocument = async (row: {
        id: string;
        orderId: number;
        document: SubscriberOrderDocument;
        label: string;
        corporateTxnId: string;
    }) => {
        setDownloading(row.id);
        const blob = await downloadSubscriberOrderDocument({
            userId: id,
            userType: role,
            credentialId,
            orderId: row.orderId,
            document: row.document,
        });
        setDownloading(null);

        if (!blob) {
            dispatch(
                showToast({
                    description: `Could not download the ${row.label.toLowerCase()}`,
                    variant: 'error',
                })
            );
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${subscriberName} ${row.label} ${row.corporateTxnId}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const downloadBill = (row: SubscriberBillEntry) => downloadDocument(row);

    const transactionActions = (row: SubscriberTransactionEntry) =>
        row.receiptAvailable ? (
            <Tooltip title="Download the payment receipt as it was issued">
                <Button
                    size="small"
                    aria-label={`Download Receipt for ${row.corporateTxnId}`}
                    icon={<DownloadOutlined />}
                    loading={downloading === `${row.id}:receipt`}
                    onClick={() =>
                        downloadDocument({
                            id: `${row.id}:receipt`,
                            orderId: row.id,
                            document: 'receipt',
                            label: 'Receipt',
                            corporateTxnId: row.corporateTxnId,
                        })
                    }
                >
                    Receipt
                </Button>
            </Tooltip>
        ) : null;

    const billActions = (row: SubscriberBillEntry) => (
        <Tooltip title={`Download the ${row.label.toLowerCase()} as it was issued`}>
            <Button
                size="small"
                aria-label={`Download ${row.label} for ${row.corporateTxnId}`}
                icon={<DownloadOutlined />}
                loading={downloading === row.id}
                onClick={() => downloadBill(row)}
            >
                Download
            </Button>
        </Tooltip>
    );

    const columns = subscriberTabColumns(
        tab,
        tab === LEDGER_TABS.bills ? billActions : undefined,
        tab === LEDGER_TABS.transactions ? transactionActions : undefined
    );

    // A tab with nothing to filter by keeps its search in the header, after the export buttons.
    const searchInHeader = controls !== undefined && controls.selects.length === 0;
    const search = {
        value: searchText,
        placeholder: controls ? controls.searchPlaceholder : '',
        onChange: updateSearchText,
    };

    return (
        <div>
            <TabHeader
                title={copy ? copy.title : ''}
                description={copy ? copy.description(subscriberName) : ''}
                action={
                    <Flex gap={8} wrap="wrap">
                        <ExportButtons
                            onExport={exportAs}
                            loadingFormat={exportingFormat}
                            disabled={isLoading || count === 0}
                        />
                        {searchInHeader && <LedgerSearchInput {...search} />}
                        {tab === LEDGER_TABS.wallet && (
                            <>
                                <Link to={ADJUST_WALLET_PATH}>
                                    <Button icon={<SwapOutlined />}>Adjust wallet</Button>
                                </Link>
                                <Link to={WALLET_REPORT_PATH}>
                                    <Button icon={<FileSearchOutlined />}>Wallet report</Button>
                                </Link>
                            </>
                        )}
                    </Flex>
                }
            />
            {controls && !searchInHeader && (
                <LedgerFilterBar
                    selects={controls.selects.map(filter => ({
                        ...filter,
                        value: selected[filter.key],
                        onChange: value =>
                            setSelected(current => ({ ...current, [filter.key]: value })),
                    }))}
                    search={search}
                />
            )}
            {WALLET_BASIS_TABS.includes(tab) && (
                <Alert
                    type="info"
                    showIcon
                    className="!mb-4"
                    message="This tab reads the wallet, not the accounting period"
                    description="Wallet figures cover the subscriber's whole history because the balance is a single running number with no date. Order figures — transactions and bills — start at the accounting go live date, so the two are not on the same basis."
                />
            )}
            <GenericTable
                rowKey="id"
                columns={withFaqTitles(columns, 'Subscribers', faqTabOf(tab))}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                locale={controls && isFiltered ? { emptyText: controls.emptyText } : undefined}
                className="rounded-xl border border-solid border-borderCard overflow-hidden"
            />
            <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={count}
                onChange={setPage}
                showSizeChanger={false}
                hideOnSinglePage
                className="mt-4 text-end justify-end"
            />
        </div>
    );
};

export default SubscriberTabPanel;
