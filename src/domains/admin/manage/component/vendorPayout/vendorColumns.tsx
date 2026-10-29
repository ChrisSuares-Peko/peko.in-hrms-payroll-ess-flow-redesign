import { EditOutlined } from '@ant-design/icons';
import { Flex, Tooltip, Typography } from 'antd';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { CorporateRecord } from '../../types/vendorPayout';

export const vendorColumns = (
    handleEdit: (record: CorporateRecord) => void,
    accessPermission: any
) => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Company Name',
        sorter: true,
        dataIndex: 'companyName',
        key: 'companyName',
        render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
    },
    {
        title: 'Contact Person Name',
        dataIndex: 'contactPersonName',
        key: 'contactPersonName',
        render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
    },
    {
        title: 'Corporate ID',
        sorter: true,
        dataIndex: ['credential', 'username'],
        render: (_: any, data: any) => (
            <Typography.Text>{data?.credential.username || '-'}</Typography.Text>
        ),
    },
    {
        title: 'Email ID',
        dataIndex: 'offEmail',
        sorter: true,
        key: 'offEmail',
        render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
    },
    {
        title: 'Status',
        sorter: true,
        dataIndex: 'status',
        key: 'status',
        render: (data: any) => (
            <Typography.Text>
                {data.toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) || '-'}
            </Typography.Text>
        ),
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'action',
        render: (_: any, record: CorporateRecord) => (
            <Flex justify="space-between">
                <Tooltip
                    placement="top"
                    title={
                        !accessPermission?.update
                            ? 'Sorry, you do not have permission to perform this action'
                            : ''
                    }
                >
                    <span>
                        {!accessPermission?.update ? (
                            <EditOutlined
                                style={{ color: 'gray', cursor: 'not-allowed' }}
                                disabled
                            />
                        ) : (
                            <EditOutlined onClick={() => handleEdit(record)} />
                        )}
                    </span>
                </Tooltip>
            </Flex>
        ),
    },
];
