import { Typography } from 'antd';
import type { TableProps } from 'antd';

import { DateCell, StatusPill, money } from './lookupMeta';
import LookupTableCard from './LookupTableCard';
import useLookupList from '../hooks/useLookupList';
import { LookupTopUpRow } from '../types';

const columns: TableProps<LookupTopUpRow>['columns'] = [
    {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        render: (value: string) => <DateCell value={value} />,
    },
    {
        title: 'Type',
        dataIndex: 'method',
        key: 'method',
    },
    {
        title: 'Reference',
        dataIndex: 'reference',
        key: 'reference',
        render: (value: string | null) =>
            value ? <Typography.Text copyable>{value}</Typography.Text> : '-',
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (value: string | null) => value || '-',
    },
    {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (value: number) => (
            <Typography.Text className="font-medium text-green-600">{money(value)}</Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: () => <StatusPill status="COMPLETED" label="Completed" />,
    },
];

const TopUpsTable = ({ corporateId }: { corporateId: number | undefined }) => {
    const { isLoading, rows, count, page, pageSize, setPage } = useLookupList<LookupTopUpRow>(
        corporateId,
        'top-ups'
    );

    return (
        <LookupTableCard<LookupTopUpRow>
            title="Wallet Top-ups"
            subtitle="Money credited to the corporate card wallet (top-ups, refunds, cashback)"
            columns={columns}
            dataSource={rows}
            rowKey="id"
            loading={isLoading}
            emptyText="No top-ups yet"
            pagination={{ page, pageSize, total: count, onChange: setPage }}
        />
    );
};

export default TopUpsTable;
