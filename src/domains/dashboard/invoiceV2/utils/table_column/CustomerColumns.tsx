import type { CSSProperties } from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { CustomerRow } from '../../types/customer';

export const TABLE_HEADER_STYLE: CSSProperties = {
    backgroundColor: '#FAFBFB',
    color: '#42526D',
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '1.24px solid #EAECF0',
};

const getCustomerColumns = (
    onEdit: (row: CustomerRow) => void,
    onDelete: (row: CustomerRow) => void,
    statusFilter?: string[]
): ColumnsType<CustomerRow> => [
    {
        title: 'Customer ID',
        dataIndex: 'id',
        key: 'id',
        sorter: true,
        render: id => (
            <Typography.Text className="text-[#42526D] text-sm">
                {`CUST-${String(id).padStart(3, '0')}`}
            </Typography.Text>
        ),
    },
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        render: name => (
            <Typography.Text className="text-[#42526D] text-sm">{name}</Typography.Text>
        ),
    },
    {
        title: 'GSTIN',
        dataIndex: 'gstin',
        key: 'gstin',
        render: gstin => (
            <Typography.Text className="text-[#42526D] text-sm">{gstin}</Typography.Text>
        ),
    },
    {
        title: 'Contact',
        key: 'contact',
        render: (_, row) => (
            <Flex vertical gap={2}>
                <Typography.Text className="text-[#42526D] text-sm">
                    {row.phoneNumber}
                </Typography.Text>
                <Typography.Text className="text-[#A1A1AA] text-sm">{row.email}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Location',
        key: 'location',
        render: (_, row) => (
            <Flex vertical gap={2}>
                <Typography.Text className="text-[#42526D] text-sm">
                    {row.primaryCity}
                </Typography.Text>
                <Typography.Text className="text-[#A1A1AA] text-sm">
                    {row.primaryState}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Transactions',
        dataIndex: 'transactions',
        key: 'transactions',
    },
    {
        title: 'No of Invoices',
        dataIndex: 'invoiceCount',
        key: 'invoiceCount',
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filters: [
            { text: 'Active', value: 'Active' },
            { text: 'Inactive', value: 'Inactive' },
        ],
        filterMultiple: false,
        filteredValue: statusFilter ?? null,
        render: (status: CustomerRow['status']) => {
            const isActive = status?.toLowerCase() === 'active';
            return (
                <Tag
                    className={`rounded-full text-xs font-medium border-0 px-3 py-1 ${
                        isActive ? 'bg-[#ECFDF5] text-[#43B75D]' : 'bg-[#FFF7ED] text-[#F97316]'
                    }`}
                >
                    {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : ''}
                </Tag>
            );
        },
    },
    {
        title: 'Actions',
        key: 'actions',
        render: (_, row) => (
            <Flex align="center" gap={12}>
                <EditOutlined
                    className="text-[#A1A1AA] cursor-pointer hover:text-[#475569]"
                    onClick={() => onEdit(row)}
                />
                <DeleteOutlined
                    className="text-[#A1A1AA] cursor-pointer hover:text-red-500"
                    onClick={() => onDelete(row)}
                />
            </Flex>
        ),
    },
];

export default getCustomerColumns;
