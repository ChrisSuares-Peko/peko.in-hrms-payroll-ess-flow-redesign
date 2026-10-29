import type { FC } from 'react';

import { Badge, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import type { ComplianceItem } from '../types';
import { complianceStatusColor, complianceStatusLabel } from '../utils';

interface ComplianceTableProps {
    data: ComplianceItem[];
    total: number;
    loading: boolean;
    page: number;
    pageSize: number;
    onPageChange: (page: number, pageSize: number) => void;
}

const columns: ColumnsType<ComplianceItem> = [
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
    },
    {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: ComplianceItem['status']) => (
            <Badge
                status={complianceStatusColor[status] as any}
                text={complianceStatusLabel[status]}
            />
        ),
    },
    {
        title: 'Due Date',
        dataIndex: 'dueDate',
        key: 'dueDate',
        render: (date: string) => (date ? dayjs(date).format('DD MMM YYYY') : '-'),
    },
    {
        title: 'Created At',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
];

const ComplianceTable: FC<ComplianceTableProps> = ({
    data,
    total,
    loading,
    page,
    pageSize,
    onPageChange,
}) => (
    <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
            current: page,
            pageSize,
            total,
            onChange: onPageChange,
        }}
    />
);

export default ComplianceTable;
