import { Pagination, Typography } from 'antd';
import type { PaginationProps } from 'antd';
import type { ColumnsType } from 'antd/lib/table';
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';
import type { IconType } from 'react-icons/lib';

import GenericTable from '@components/atomic/GenericTable';
import useScreenSize from '@hooks/useScreenSize';

import { cn } from '../../../utils/cn';
import { STATEMENT_COPY } from '../../../utils/statementData';
import { StatementRow, StatementTrend } from '../../../utils/types';

const { Text } = Typography;

const cell = (v: string) => v || STATEMENT_COPY.emptyCell;

const isBold = (row: StatementRow) => row.kind !== 'txn';

const closingCell = (row: StatementRow) =>
    row.kind === 'closing' ? { className: '!bg-bgLightGray !border-b-0' } : {};

/** Trend → curved trend arrow + colour. inGreen=credit (green ↘), downRed/upRed=debit (red). */
const TREND: Record<StatementTrend, { Icon: IconType; className: string }> = {
    inGreen: { Icon: FaArrowTrendDown, className: 'text-savingsTagLightText' },
    downRed: { Icon: FaArrowTrendDown, className: 'text-textLightRed' },
    upRed: { Icon: FaArrowTrendUp, className: 'text-textLightRed' },
};

const columns: ColumnsType<StatementRow> = [
    {
        key: 'date',
        title: 'Date',
        dataIndex: 'date',
        width: 175,
        onCell: closingCell,
        render: (_: string, row: StatementRow) => (
            <Text className="break-normal text-sm text-textBody">{row.date}</Text>
        ),
    },
    {
        key: 'description',
        title: 'Description',
        dataIndex: 'description',
        width: 320,
        onCell: closingCell,
        render: (_: string, row: StatementRow) => {
            const trend = row.trend ? TREND[row.trend] : undefined;
            return (
                <div className="flex items-center gap-2">
                    {trend && <trend.Icon className={cn('text-sm', trend.className)} />}
                    <Text
                        className={cn(
                            'text-sm',
                            isBold(row) ? 'font-semibold text-textHeadings' : 'text-textHeadings'
                        )}
                    >
                        {row.description}
                    </Text>
                </div>
            );
        },
    },
    {
        key: 'reference',
        title: 'Reference',
        dataIndex: 'reference',
        width: 150,
        onCell: closingCell,
        render: (_: string, row: StatementRow) => (
            <Text className="text-sm text-textBody">{cell(row.reference)}</Text>
        ),
    },
    {
        key: 'type',
        title: 'Type',
        dataIndex: 'type',
        width: 140,
        onCell: closingCell,
        render: (_: string, row: StatementRow) =>
            row.type ? (
                <span className="inline-flex items-center rounded-full bg-listBg px-3 py-1 text-xs font-medium text-textBody">
                    {row.type}
                </span>
            ) : (
                <Text className="text-sm text-textGreyLight">--</Text>
            ),
    },
    {
        key: 'moneyOut',
        title: 'Money out',
        dataIndex: 'moneyOut',
        width: 140,
        onCell: closingCell,
        render: (_: string, row: StatementRow) => (
            <Text
                className={cn(
                    'text-sm',
                    isBold(row) ? 'font-semibold text-textHeadings' : 'text-textBody'
                )}
            >
                {cell(row.moneyOut)}
            </Text>
        ),
    },
    {
        key: 'moneyIn',
        title: 'Money in',
        dataIndex: 'moneyIn',
        width: 140,
        onCell: closingCell,
        render: (_: string, row: StatementRow) => (
            <Text
                className={cn(
                    'text-sm',
                    isBold(row) ? 'font-semibold text-textHeadings' : 'text-textBody'
                )}
            >
                {cell(row.moneyIn)}
            </Text>
        ),
    },
    {
        key: 'balance',
        title: 'Balance',
        dataIndex: 'balance',
        width: 140,
        onCell: closingCell,
        render: (_: string, row: StatementRow) => (
            <Text
                className={cn(
                    'whitespace-nowrap text-sm',
                    isBold(row) ? 'font-semibold text-textHeadings' : 'text-textBody'
                )}
            >
                {cell(row.balance)}
            </Text>
        ),
    },
];

interface StatementTableProps {
    rows: StatementRow[];
    loading?: boolean;
    title: string;
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

/** "Showing 1–20 of 87 transactions" — the window of movements on screen, markers excluded. */
const resultsLabel = (page: number, pageSize: number, total: number) => {
    if (total === 0) return 'No transactions';
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `Showing ${from}–${to} of ${total} transactions`;
};

const PagerButton = ({ label }: { label: string }) => (
    <button type="button" className="px-3 py-1 text-sm font-medium text-textHeadings">
        {label}
    </button>
);

/**
 * "Next" / "Previous" read as labelled buttons rather than bare arrows; page numbers keep antd's own item.
 * Each is dropped when it has nowhere to go — "Previous" on the first page, "Next" on the last — so neither
 * ever renders as a control that looks clickable but isn't (antd marks its own item disabled, which a custom
 * button doesn't inherit).
 */
const makePageItemRender =
    (current: number, lastPage: number): PaginationProps['itemRender'] =>
    (_page, type, element) => {
        if (type === 'prev') return current <= 1 ? null : <PagerButton label="Previous" />;
        if (type === 'next') return current >= lastPage ? null : <PagerButton label="Next" />;
        return element;
    };

const StatementTable = ({
    rows,
    loading,
    title,
    total,
    page,
    pageSize,
    onPageChange,
}: StatementTableProps) => {
    const screens = useScreenSize();
    const isCompact = screens.md === false;
    const lastPage = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="flex flex-col">
            <div className="overflow-hidden rounded-2xl border border-borderCard bg-white">
                <div className="border-b-0 border-borderCard bg-bgLightGray px-6 pt-5 pb-3">
                    <Text className="text-sm sm:text-base font-semibold text-textHeadings xl:text-lg">
                        {title}
                    </Text>
                </div>
                <div className="-mt-2.5">
                    <GenericTable
                        columns={columns}
                        dataSource={rows}
                        loading={loading}
                        rowKey="key"
                        pagination={false}
                    />
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4 sm:px-6">
                <Text className="text-sm text-textGreyLight">
                    {resultsLabel(page, pageSize, total)}
                </Text>
                <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    onChange={onPageChange}
                    showSizeChanger={false}
                    {...(isCompact
                        ? {}
                        : {
                              className: '!flex-wrap justify-end',
                              itemRender: makePageItemRender(page, lastPage),
                          })}
                />
            </div>
        </div>
    );
};

export default StatementTable;
