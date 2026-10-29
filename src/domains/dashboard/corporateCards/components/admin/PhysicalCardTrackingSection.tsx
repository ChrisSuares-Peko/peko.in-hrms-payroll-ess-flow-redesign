import { useEffect, useMemo, useState } from 'react';

import { Empty, Pagination, Select, Tooltip, Typography } from 'antd';
import type { PaginationProps } from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';
import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateTime, formattedTimetoText } from '@utils/dateFormat';

import { DispatchApiRecord, PhysicalTrackingApiRow } from '../../api/admin/physicalTrackingApi';
import { usePhysicalTrackingApi } from '../../hooks/admin/usePhysicalTrackingApi';
import CardThumb from '../common/CardThumb';
import StatusTag from '../common/StatusTag';

const { Title, Text } = Typography;

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
    { label: 'Ordered', value: 'Ordered' },
    { label: 'Issued', value: 'Issued' },
    { label: 'Failed', value: 'Failed' },
];

const COPY = {
    title: 'Physical card tracking',
    subtitle:
        'Once a physical card is ordered it cannot be undone. The card provider pushes dispatch details (reference, AWB, courier, delivery address) to the portal via webhook.',
};

const DASH = '—';

/** Statuses StatusTag knows; anything else the API sends falls back to plain text. */
const TAGGED = new Set(['Ordered', 'Issued', 'Failed', 'Replaced']);

/**
 * A movement reads "Bluedart · AWB 35870411223" then "Shipped 17 October 2026, 2:30 PM · Bengaluru,
 * Karnataka 560034". The zone-resolved instant is preferred over the issuer's zone-less string, which
 * the browser would otherwise read as local time.
 */
const DispatchLine = ({ record }: { record: DispatchApiRecord }) => {
    const when = record.dispatchedAtUtc ?? record.dispatchedOn;
    const shipped = when ? formattedDateTime(new Date(when)) : null;
    return (
        <div className="flex flex-col gap-0.5">
            <Text className="text-sm text-textHeadings">
                {[record.courierPartnerName, record.awbNumber ? `AWB ${record.awbNumber}` : null]
                    .filter(Boolean)
                    .join(' · ') || DASH}
            </Text>
            {(shipped || record.origin) && (
                <Text className="text-xs text-textGreyLight">
                    {[shipped ? `Shipped ${shipped}` : null, record.origin]
                        .filter(Boolean)
                        .join(' · ')}
                </Text>
            )}
        </div>
    );
};

const buildColumns = (showMember: boolean): ColumnsType<PhysicalTrackingApiRow> => [
    {
        key: 'orderedOn',
        title: 'Date',
        dataIndex: 'orderedOn',
        // width: 130,
        render: (value: string) => (
            <Text className="whitespace-nowrap text-sm text-textBody">
                {value ? formattedTimetoText(new Date(value)) : DASH}
            </Text>
        ),
    },
    ...(showMember
        ? [
              {
                  key: 'member',
                  title: 'Member',
                  dataIndex: 'holder',
                  //   width: 180,
                  ellipsis: true,
                  render: (_: string, row: PhysicalTrackingApiRow) => (
                      <div className="flex min-w-0 flex-col">
                          <Tooltip title={row.holder ?? undefined}>
                              <Text className="block truncate text-sm font-medium text-textHeadings">
                                  {row.holder || DASH}
                              </Text>
                          </Tooltip>
                          <Text className="block truncate text-xs text-textGreyLight">
                              {row.department}
                          </Text>
                      </div>
                  ),
              },
          ]
        : []),
    {
        key: 'card',
        title: 'Physical card',
        dataIndex: 'last4',
        // width: 190,
        render: (last4: string | null, row) => (
            <div className="flex min-w-0 items-center gap-3">
                <CardThumb />
                <div className="flex min-w-0 flex-col">
                    <Text className="whitespace-nowrap text-sm text-textHeadings">
                        {last4 ? `**** **** **** ${last4}` : 'Not issued yet'}
                    </Text>
                    {row.nameOnCard && (
                        <Text className="block truncate text-xs text-textGreyLight">
                            {row.nameOnCard}
                        </Text>
                    )}
                </div>
            </div>
        ),
    },
    {
        key: 'shippingAddress',
        title: 'Shipping address',
        dataIndex: 'shippingAddress',
        // width: 140,
        render: (value: string | null) => (
            <Tooltip title={value ?? undefined}>
                <Text className="line-clamp-2 text-sm text-textBody">{value || DASH}</Text>
            </Tooltip>
        ),
    },
    {
        key: 'referenceNumber',
        title: 'Reference',
        dataIndex: 'referenceNumber',
        // width: 130,
        render: (value: string | null) => (
            <Text className="whitespace-nowrap text-sm text-textBody">{value || DASH}</Text>
        ),
    },
    {
        key: 'tracking',
        title: 'Tracking',
        dataIndex: 'dispatches',
        // width: 320,
        render: (dispatches: DispatchApiRecord[]) => {
            if (!dispatches?.length) {
                return <Text className="text-sm text-textGreyLight">{DASH}</Text>;
            }
            // Newest first: a re-dispatch is what an admin chasing a delivery wants at the top.
            const ordered = [...dispatches].reverse();
            return (
                <div className="flex flex-col gap-2">
                    <StatusTag status="Dispatched" />
                    {ordered.map((record, index) => (
                        <DispatchLine
                            key={`${record.awbNumber ?? 'awb'}-${record.dispatchedOn ?? index}`}
                            record={record}
                        />
                    ))}
                </div>
            );
        },
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        // width: 120,
        render: (status: string) =>
            TAGGED.has(status) ? (
                <StatusTag status={status as 'Ordered'} />
            ) : (
                <Text className="text-sm text-textBody">{status || DASH}</Text>
            ),
    },
];

/** "Showing 1–4 of 24 requests" — mirrors the account-statement footer. */
const resultsLabel = (page: number, pageSize: number, total: number) => {
    if (total === 0) return 'No physical card requests';
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `Showing ${from}–${to} of ${total} requests`;
};

const PagerButton = ({ label }: { label: string }) => (
    <button type="button" className="px-3 py-1 text-sm font-medium text-textHeadings">
        {label}
    </button>
);

const makePageItemRender =
    (current: number, lastPage: number): PaginationProps['itemRender'] =>
    (_page, type, element) => {
        if (type === 'prev') return current <= 1 ? null : <PagerButton label="Previous" />;
        if (type === 'next') return current >= lastPage ? null : <PagerButton label="Next" />;
        return element;
    };

interface PhysicalCardTrackingSectionProps {
    /**
     * Whether to name the cardholder each order belongs to. An admin table spans the whole corporate and
     * needs it; a cardholder is reading their own orders, and the server does not resolve the name for
     * them, so the column would only ever render a dash.
     */
    showMember?: boolean;
    emptyText?: string;
}

/**
 * "Physical card tracking": one row per physical card order, with the courier movements the issuer
 * pushed through the dispatch webhook.
 *
 * One component for both audiences because the endpoint is dual-role — it scopes rows from the session,
 * so the admin table and the cardholder's differ only in whose orders come back and whether the member
 * column is worth a column.
 */
const PhysicalCardTrackingSection = ({
    showMember = true,
    emptyText,
}: PhysicalCardTrackingSectionProps) => {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<string>();
    const screens = useScreenSize();
    const isCompact = screens.md === false;

    useEffect(() => {
        setPage(1);
    }, [status]);

    const { rows, total, isLoading } = usePhysicalTrackingApi(page, PAGE_SIZE, status);
    const columns = useMemo(() => buildColumns(showMember), [showMember]);
    const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col gap-1">
                    <Title level={4} className="!mb-0 !text-textHeadings">
                        {COPY.title}
                    </Title>
                    <Text className="max-w-3xl text-sm text-textBody">{COPY.subtitle}</Text>
                </div>
                <Select
                    allowClear
                    placeholder="Select Status"
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS}
                    className="w-full sm:w-48"
                />
            </div>

            {/* -mt-2.5 cancels the 10px marginBottom GenericTable spends on its column-visibility
                toolbar, which renders empty here because no column opts into visibilityToggle. Without
                it the header floats 10px below the card's top border. Same compensation StatementTable
                makes; the margin itself is not ours to remove — every other GenericTable is laid out
                around it. */}
            <div className="overflow-hidden rounded-2xl border border-borderCard bg-white">
                <div className="-mt-2.5">
                    <GenericTable
                        columns={columns}
                        dataSource={rows}
                        rowKey="key"
                        loading={isLoading}
                        scroll={{ x: 'max-content' }}
                        pagination={false}
                        {...(emptyText
                            ? {
                                  locale: {
                                      emptyText: (
                                          <Empty
                                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                                              description={emptyText}
                                          />
                                      ),
                                  },
                              }
                            : {})}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 sm:px-2">
                <Text className="text-sm text-textGreyLight">
                    {resultsLabel(page, PAGE_SIZE, total)}
                </Text>
                <Pagination
                    current={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={setPage}
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

export default PhysicalCardTrackingSection;
