import { Flex, Typography } from 'antd';
import type { TableProps } from 'antd';

import { DateCell, REQUEST_TYPE_LABELS, StatusPill, maskedLast4, money } from './lookupMeta';
import LookupTableCard from './LookupTableCard';
import useLookupList from '../hooks/useLookupList';
import { LookupRequestRow } from '../types';

const columns: TableProps<LookupRequestRow>['columns'] = [
    {
        title: 'Raised On',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) => <DateCell value={value} />,
    },
    {
        title: 'Request',
        key: 'requestType',
        render: (_: unknown, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium">
                    {REQUEST_TYPE_LABELS[row.requestType] ?? row.requestType}
                </Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {[row.cardType, row.cardLast4 ? maskedLast4(row.cardLast4) : null]
                        .filter(Boolean)
                        .join(' · ') || '-'}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Cardholder',
        dataIndex: 'cardholderName',
        key: 'cardholderName',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'Amount',
        dataIndex: 'requestedAmount',
        key: 'requestedAmount',
        render: (value: number | null) => money(value),
    },
    {
        title: 'Reason',
        dataIndex: 'reason',
        key: 'reason',
        render: (value: string | null) => (
            <Typography.Text className="whitespace-normal max-w-[260px] inline-block">
                {value || '-'}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        key: 'status',
        render: (_: unknown, row) => (
            <Flex vertical gap={2} className="max-w-[260px]">
                <StatusPill status={row.status} />
                {row.decisionNote && (
                    <Typography.Text
                        type={row.status === 'REJECTED' ? 'danger' : 'secondary'}
                        className="text-xs whitespace-normal"
                    >
                        {row.decisionNote}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Decided On',
        dataIndex: 'decidedAt',
        key: 'decidedAt',
        render: (value: string | null) => <DateCell value={value} />,
    },
];

const RequestsTable = ({ corporateId }: { corporateId: number | undefined }) => {
    const { isLoading, rows, count, page, pageSize, setPage } = useLookupList<LookupRequestRow>(
        corporateId,
        'requests'
    );

    return (
        <LookupTableCard<LookupRequestRow>
            title="Card Requests"
            subtitle="Issuance, limit increase, unfreeze and termination requests with their outcome"
            columns={columns}
            dataSource={rows}
            rowKey="id"
            loading={isLoading}
            emptyText="No requests raised"
            pagination={{ page, pageSize, total: count, onChange: setPage }}
        />
    );
};

export default RequestsTable;
