import React from 'react';

import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tag, Space, Button } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

const columns = [
    {
        title: 'Date Added',
        dataIndex: 'dateAdded',
        key: 'dateAdded',
    },
    {
        title: 'Component Name',
        dataIndex: 'componentName',
        key: 'componentName',
    },
    {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
    },
    {
        title: 'Calculation Type',
        dataIndex: 'calculationType',
        key: 'calculationType',
    },
    {
        title: 'Amount/Percentage',
        dataIndex: 'amount',
        key: 'amount',
    },
    {
        title: 'Calculation Basis',
        dataIndex: 'calculationBasis',
        key: 'calculationBasis',
    },
    {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        render: (status: any) => (
            <Tag
                style={{
                    backgroundColor: status === 'Active' ? '#e6f9f0' : '#ffebeb',
                    color: status === 'Active' ? '#28a745' : '#ff4d4f',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                }}
            >
                {status}
            </Tag>
        ),
    },
    {
        title: 'Action',
        key: 'action',
        render: (text: any, record: any) => (
            <Space size="middle">
                <Button icon={<EditOutlined />} style={{ color: 'green' }} />
                <Button icon={<DeleteOutlined />} danger />
            </Space>
        ),
    },
];

const data = [
    {
        key: '1',
        dateAdded: '08-04-2023',
        componentName: 'Basic Salary',
        category: 'Salary',
        calculationType: 'Fixed',
        amount: '₹ 80,000',
        calculationBasis: 'Monthly',
        status: 'Active',
    },
    {
        key: '2',
        dateAdded: '08-04-2023',
        componentName: 'Dearness Pay',
        category: 'Bonus',
        calculationType: 'Fixed',
        amount: '₹ 3,000',
        calculationBasis: 'Monthly',
        status: 'Active',
    },
];

const SalaryComponents = () => <GenericTable columns={columns} dataSource={data} />;

export default SalaryComponents;
