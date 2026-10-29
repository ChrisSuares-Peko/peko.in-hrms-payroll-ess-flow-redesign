import { Flex, Typography } from 'antd';
import type { TableProps } from 'antd';

import { DateCell, StatusPill, maskedLast4 } from './lookupMeta';
import LookupTableCard from './LookupTableCard';
import useLookupList from '../hooks/useLookupList';
import { LookupDispatchRow } from '../types';

const columns: TableProps<LookupDispatchRow>['columns'] = [
    {
        title: 'Ordered On',
        dataIndex: 'orderedOn',
        key: 'orderedOn',
        render: (value: string) => <DateCell value={value} />,
    },
    {
        title: 'Cardholder',
        key: 'holder',
        render: (_: unknown, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium">{row.holder || '-'}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {maskedLast4(row.last4)}
                    {row.nameOnCard ? ` · ${row.nameOnCard}` : ''}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Shipping Address',
        dataIndex: 'shippingAddress',
        key: 'shippingAddress',
        render: (value: string | null) => (
            <Typography.Text className="whitespace-normal max-w-[260px] inline-block">
                {value || '-'}
            </Typography.Text>
        ),
    },
    {
        title: 'Order Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: string) => <StatusPill status={value} />,
    },
    {
        title: 'AWB Number(s)',
        key: 'dispatches',
        render: (_: unknown, row) =>
            row.dispatches.length ? (
                <Flex vertical gap={6}>
                    {row.dispatches.map((dispatch, index) => (
                        <Flex vertical key={`${dispatch.awbNumber ?? 'awb'}-${index}`}>
                            <Typography.Text
                                copyable={!!dispatch.awbNumber}
                                className="font-medium"
                            >
                                {dispatch.awbNumber || '-'}
                            </Typography.Text>
                            <Typography.Text type="secondary" className="text-xs">
                                {[dispatch.courierPartnerName, dispatch.origin]
                                    .filter(Boolean)
                                    .join(' · ') || '-'}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>
            ) : (
                <Typography.Text type="secondary">Not dispatched</Typography.Text>
            ),
    },
    {
        title: 'Dispatched / Delivered',
        key: 'dates',
        render: (_: unknown, row) => {
            const latest = row.dispatches[row.dispatches.length - 1];
            if (!latest) return '-';
            return (
                <Flex vertical gap={2}>
                    <DateCell value={latest.dispatchedAtUtc} />
                    {latest.receivedAt ? (
                        <StatusPill status="Delivered" />
                    ) : (
                        <StatusPill status="In transit" />
                    )}
                </Flex>
            );
        },
    },
];

const DispatchesTable = ({ corporateId }: { corporateId: number | undefined }) => {
    const { isLoading, rows, count, page, pageSize, setPage } = useLookupList<LookupDispatchRow>(
        corporateId,
        'dispatches'
    );

    return (
        <LookupTableCard<LookupDispatchRow>
            title="Physical Card Dispatches"
            subtitle="Physical card orders with courier AWB numbers"
            columns={columns}
            dataSource={rows}
            rowKey="key"
            loading={isLoading}
            emptyText="No physical cards ordered"
            pagination={{ page, pageSize, total: count, onChange: setPage }}
        />
    );
};

export default DispatchesTable;
