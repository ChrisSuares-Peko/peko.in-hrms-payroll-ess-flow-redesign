import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Pagination, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppDispatch } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { showToast } from '@src/slices/apiSlice';

import { entryNumberCell } from './vendorColumns';
import { manualJournalPath } from '../../config/manualOperations';
import { withFaqTitles } from '../../faq/FaqHint';
import { Posting } from '../../types/posting';
import { formatInr } from '../../utils/commission';
import LedgerFilterBar from '../common/LedgerFilterBar';
import { postingColumn } from '../common/PostingCell';
import SummaryStrip from '../serviceDetail/SummaryStrip';
import TabHeader from '../serviceDetail/TabHeader';

const PAGE_SIZE = 10;

export const STATEMENT_CARD_LABELS = {
    openingBalance: 'Opening Balance',
    totalDebit: 'Total Debit',
    totalCredit: 'Total Credit',
    closingBalance: 'Closing Balance',
};

export type LedgerStatementEntry = {
    date: string | null;
    particulars: string;
    reference: string | null;
    entryNumber: string | null;
    type: string;
    debit: number | null;
    credit: number | null;
    balance: number;
    posting: Posting;
};

export type LedgerStatementData = {
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    entries: LedgerStatementEntry[];
    recordsTotal: number;
    truncated: boolean;
};

export type LedgerStatementFilters = {
    page: number;
    itemsPerPage: number;
    from: string;
    to: string;
    searchText?: string;
    side?: string;
};

const SIDE_OPTIONS = [
    { value: 'debit', label: 'Debit' },
    { value: 'credit', label: 'Credit' },
];

export type StatementFormat = 'export' | 'pdf';

type StatementRow = Omit<LedgerStatementEntry, 'posting'> & {
    key: string;
    marker?: 'opening' | 'closing';
    posting?: Posting;
};

const amount = (value: number | null) => (value === null ? '' : formatInr(value));

const sideCell = (row: { debit: number | null; credit: number | null }, value: number | null) =>
    row.debit === null && row.credit === null ? '—' : amount(value);

const markerCell = (row: StatementRow) =>
    row.marker ? { className: '!bg-bgLightGray !font-semibold' } : {};

export const statementColumns: ColumnsType<StatementRow> = [
    {
        title: 'Date',
        key: 'date',
        width: 130,
        onCell: markerCell,
        render: (_, row) => (row.date ? dayjs(row.date).format('DD MMM YYYY') : ''),
    },
    {
        title: 'Particulars',
        key: 'particulars',
        width: 260,
        onCell: markerCell,
        render: (_, row) => row.particulars,
    },
    {
        title: 'Reference',
        key: 'reference',
        width: 160,
        onCell: markerCell,
        render: (_, row) => row.reference || '—',
    },
    {
        title: 'Entry No.',
        key: 'entryNumber',
        width: 120,
        onCell: markerCell,
        render: (_, row) => entryNumberCell(row.entryNumber),
    },
    { title: 'Type', key: 'type', width: 130, onCell: markerCell, render: (_, row) => row.type },
    {
        title: 'Debit',
        key: 'debit',
        width: 140,
        align: 'right',
        onCell: markerCell,
        render: (_, row) => sideCell(row, row.debit),
    },
    {
        title: 'Credit',
        key: 'credit',
        width: 140,
        align: 'right',
        onCell: markerCell,
        render: (_, row) => sideCell(row, row.credit),
    },
    {
        title: 'Balance',
        key: 'balance',
        width: 150,
        align: 'right',
        onCell: markerCell,
        render: (_, row) => formatInr(row.balance),
    },
    {
        ...postingColumn<StatementRow>({
            linkTo: row => (row.reference ? manualJournalPath(row.reference) : null),
        }),
        onCell: markerCell,
    },
];

// The opening and closing lines are rows rather than a detached footer, so they read and
// export the same way every other line does.
export const withMarkers = (
    statement: LedgerStatementData,
    page: number,
    pageSize: number,
    showMarkers = true
): StatementRow[] => {
    const rows: StatementRow[] = statement.entries.map((entry, index) => ({
        ...entry,
        key: `${entry.reference || 'row'}-${index}-${entry.balance}`,
    }));

    // A filtered statement lists only its matching lines: the opening and closing lines carry
    // the whole period's figures, which would not add up beside them.
    const onFirstPage = showMarkers && page === 1;
    const onLastPage = showMarkers && page * pageSize >= statement.recordsTotal;

    return [
        ...(onFirstPage
            ? [
                  {
                      key: 'opening',
                      marker: 'opening' as const,
                      date: null,
                      particulars: 'Opening balance',
                      reference: null,
                      entryNumber: null,
                      type: 'Opening',
                      debit: null,
                      credit: null,
                      balance: statement.openingBalance,
                  },
              ]
            : []),
        ...rows,
        ...(onLastPage
            ? [
                  {
                      key: 'closing',
                      marker: 'closing' as const,
                      date: null,
                      particulars: 'Closing balance',
                      reference: null,
                      entryNumber: null,
                      type: 'Closing',
                      debit: statement.totalDebit,
                      credit: statement.totalCredit,
                      balance: statement.closingBalance,
                  },
              ]
            : []),
    ];
};

type LedgerStatementPanelProps<T extends LedgerStatementData> = {
    description: string;
    partyName: string;
    range: { from: string; to: string };
    convention: string;
    warning?: ReactNode;
    notice?: (statement: T) => ReactNode;
    // Offers a search and a Debit / Credit filter above the table.
    filterable?: boolean;
    searchPlaceholder?: string;
    load: (filters: LedgerStatementFilters) => Promise<T | false>;
    download: (format: StatementFormat, filters: LedgerStatementFilters) => Promise<Blob | false>;
};

const LedgerStatementPanel = <T extends LedgerStatementData>({
    description,
    partyName,
    range,
    convention,
    warning,
    notice,
    filterable = false,
    searchPlaceholder = 'Search particulars, reference or type',
    load,
    download,
}: LedgerStatementPanelProps<T>) => {
    const dispatch = useAppDispatch();
    const [statement, setStatement] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [downloading, setDownloading] = useState<StatementFormat | null>(null);
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState({ searchText: '' });
    const [side, setSide] = useState<string | undefined>();
    const { searchText, updateSearchText } = useDebounceSearch(setQuery);
    const isFiltered = Boolean(query.searchText || side);

    // A search or a filter can shrink the statement below the page an admin is on.
    useEffect(() => {
        setPage(1);
    }, [query.searchText, side]);

    const filters = useMemo<LedgerStatementFilters>(
        () => ({
            page,
            itemsPerPage: PAGE_SIZE,
            from: range.from,
            to: range.to,
            ...(query.searchText ? { searchText: query.searchText } : {}),
            ...(side ? { side } : {}),
        }),
        [page, range.from, range.to, query.searchText, side]
    );

    const fetchStatement = useCallback(async () => {
        setIsLoading(true);
        const data = await load(filters);
        setStatement(data || null);
        setIsLoading(false);
    }, [load, filters]);

    useEffect(() => {
        fetchStatement();
    }, [fetchStatement]);

    const downloadAs = async (format: StatementFormat) => {
        setDownloading(format);
        const blob = await download(format, filters);
        setDownloading(null);

        if (!blob) {
            dispatch(
                showToast({ description: 'Could not download the statement', variant: 'error' })
            );
            return;
        }

        const extension = format === 'pdf' ? 'pdf' : 'xlsx';
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${partyName} statement ${range.from} to ${range.to}.${extension}`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const rows = statement ? withMarkers(statement, page, PAGE_SIZE, !isFiltered) : [];

    // Nothing matching the filters leaves nothing to export.
    const nothingToExport = !statement || (isFiltered && statement.recordsTotal === 0);

    return (
        <div>
            <TabHeader
                title="Statement of Accounts"
                description={description}
                action={
                    <Flex gap={8} wrap="wrap">
                        <Button
                            icon={<DownloadOutlined />}
                            loading={downloading === 'export'}
                            disabled={nothingToExport}
                            onClick={() => downloadAs('export')}
                        >
                            Export Excel
                        </Button>
                        <Tooltip title="Opens a statement ready to send or file">
                            <Button
                                icon={<FilePdfOutlined />}
                                loading={downloading === 'pdf'}
                                disabled={nothingToExport}
                                onClick={() => downloadAs('pdf')}
                            >
                                Download PDF
                            </Button>
                        </Tooltip>
                    </Flex>
                }
            />

            {warning}

            {statement && notice ? notice(statement) : null}

            {statement && (
                <div className="mb-4">
                    <SummaryStrip
                        faq={{ screen: 'Statements', tab: 'Cards' }}
                        items={[
                            {
                                label: STATEMENT_CARD_LABELS.openingBalance,
                                value: formatInr(statement.openingBalance),
                            },
                            {
                                label: STATEMENT_CARD_LABELS.totalDebit,
                                value: formatInr(statement.totalDebit),
                            },
                            {
                                label: STATEMENT_CARD_LABELS.totalCredit,
                                value: formatInr(statement.totalCredit),
                            },
                            {
                                label: STATEMENT_CARD_LABELS.closingBalance,
                                value: formatInr(statement.closingBalance),
                                tone:
                                    statement.closingBalance < 0
                                        ? ('warning' as const)
                                        : ('default' as const),
                            },
                        ]}
                        footnote={convention}
                    />
                </div>
            )}

            {statement && statement.truncated && (
                <Alert
                    className="mb-4"
                    type="warning"
                    showIcon
                    message="This statement hit its row limit. Narrow the date range to see every line."
                />
            )}

            {filterable && (
                <LedgerFilterBar
                    note={
                        isFiltered && (
                            <Typography.Text className="text-[13px] text-textBody">
                                The figures above still cover the whole period.
                            </Typography.Text>
                        )
                    }
                    selects={[
                        {
                            key: 'side',
                            label: 'Debit or credit',
                            placeholder: 'All entries',
                            options: SIDE_OPTIONS,
                            value: side,
                            onChange: setSide,
                            className: 'w-full sm:w-40',
                        },
                    ]}
                    search={{
                        value: searchText,
                        placeholder: searchPlaceholder,
                        onChange: updateSearchText,
                    }}
                />
            )}

            <GenericTable
                rowKey="key"
                columns={withFaqTitles(statementColumns, 'Statements', 'Columns')}
                dataSource={rows}
                loading={isLoading}
                pagination={false}
                locale={{
                    emptyText: isFiltered
                        ? 'No lines match your search or filter.'
                        : 'No movements in this period.',
                }}
                className="rounded-xl border border-solid border-borderCard overflow-hidden"
            />
            <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={statement ? statement.recordsTotal : 0}
                onChange={setPage}
                showSizeChanger={false}
                hideOnSinglePage
                className="mt-4 text-end justify-end"
            />
        </div>
    );
};

export default LedgerStatementPanel;
