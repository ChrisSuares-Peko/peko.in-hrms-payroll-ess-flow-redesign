import { Flex, Typography } from 'antd';
import type { TableProps } from 'antd';

import { DateCell, StatusPill } from './lookupMeta';
import LookupTableCard from './LookupTableCard';
import useLookupList from '../hooks/useLookupList';
import { LookupActivityRow } from '../types';

const columns: TableProps<LookupActivityRow>['columns'] = [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) => <DateCell value={value} />,
    },
    {
        title: 'Change',
        key: 'title',
        render: (_: unknown, row) => (
            <Flex vertical>
                <Typography.Text className="font-medium">{row.title || row.action}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {row.category || '-'}
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
        title: 'Details / Failure Reason',
        key: 'description',
        render: (_: unknown, row) => (
            <Flex vertical className="max-w-[420px]">
                <Typography.Text
                    type={row.isFailure ? 'danger' : undefined}
                    className="whitespace-normal"
                >
                    {row.description || '-'}
                </Typography.Text>
                {row.isFailure && row.responseCode !== null && (
                    <Typography.Text type="secondary" className="text-xs">
                        Issuer code: {row.responseCode}
                    </Typography.Text>
                )}
            </Flex>
        ),
    },
    {
        title: 'Performed By',
        dataIndex: 'actor',
        key: 'actor',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'Status',
        key: 'status',
        render: (_: unknown, row) => (
            <StatusPill
                status={row.isFailure ? 'Failed' : 'Activated'}
                label={row.isFailure ? 'Failed' : 'Success'}
            />
        ),
    },
];

const ActivityTable = ({ corporateId }: { corporateId: number | undefined }) => {
    const { isLoading, rows, count, page, pageSize, setPage } = useLookupList<LookupActivityRow>(
        corporateId,
        'activity'
    );

    return (
        <LookupTableCard<LookupActivityRow>
            title="Platform Activity"
            subtitle="Card issuance, freeze / unfreeze, limit changes, dispatch and termination, with failure reasons"
            columns={columns}
            dataSource={rows}
            rowKey="id"
            loading={isLoading}
            emptyText="No activity recorded"
            onRow={row => ({ style: row.isFailure ? { backgroundColor: '#fef2f2' } : undefined })}
            pagination={{ page, pageSize, total: count, onChange: setPage }}
        />
    );
};

export default ActivityTable;
