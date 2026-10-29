import React from 'react';

import { Badge, Flex, Select, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly } from '@utils/dateFormat';

import { DemoRequestsData } from '../../types/types';

type OptionsMap = { [key: string]: string[] };

const optionsMap: OptionsMap = {
    'Customer Contacted': [
        'Customer Contacted',
        'Product Demo Done',
        'Payment Received',
        'Setup Completed',
    ],
    'Product Demo Done': ['Product Demo Done', 'Payment Received', 'Setup Completed'],
    'Payment Received': ['Payment Received', 'Setup Completed'],
};

const PaytmBposColumns = (
    updateBposStatus: (value: { id: number; status: string }) => void
): ColumnsType<DemoRequestsData> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: data => <Typography.Text>{formattedDateOnly(new Date(data))}</Typography.Text>,
    },
    {
        title: 'Store name',
        dataIndex: 'storeName',
        key: 'storeName',
        render: (_, record) => <Typography.Text>{record.storeName}</Typography.Text>,
    },
    {
        title: 'Contact Person & Email',
        dataIndex: 'contactPerson',
        key: 'contactPerson',
        render: (contactPerson, record) => (
            <Flex vertical justify="center">
                <Typography.Text className="  text-gray-900 text-base font-medium">
                    {contactPerson}
                </Typography.Text>
                <Typography.Text className="text-slate-500 text-sm font-normal">
                    {record.email}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'City',
        dataIndex: 'city',
        key: 'city',
        render: city => city || 'N/A',
    },
    {
        title: 'Mobile Number',
        dataIndex: 'mobileNumber',
        key: 'mobileNumber',
    },
    {
        title: 'Preferred Language',
        dataIndex: 'preferredLanguage',
        key: 'preferredLanguage',
        render: preferredLanguage => preferredLanguage || 'N/A',
    },
    {
        title: 'Business Category',
        dataIndex: 'businessCategory',
        key: 'businessCategory',
        render: (_, record) => (
            <Typography.Text>
                {record.businessCategory ? record.businessCategory : 'N/A'}
            </Typography.Text>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        align: 'center',
        render: (status: string, record) =>
            status === 'Setup Completed' ? (
                <Badge
                    status="success"
                    text={status}
                    className="py-2 px-3 rounded-2xl"
                    style={{ backgroundColor: '#ECFDF3', color: '#027A48' }}
                />
            ) : (
                <Select
                    value={status}
                    onChange={async e => {
                        updateBposStatus({ id: record.id, status: e });
                    }}
                >
                    {optionsMap[status].map((option: string) => (
                        <Select.Option key={option} value={option}>
                            {option}
                        </Select.Option>
                    ))}
                </Select>
            ),
    },
];

export default PaytmBposColumns;
