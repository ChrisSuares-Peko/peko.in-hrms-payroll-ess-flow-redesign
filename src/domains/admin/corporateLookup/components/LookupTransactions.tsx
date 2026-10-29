import { useState } from 'react';

import { Flex, Pagination, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useTransactions from '../../reports/hooks/useTransactions';

interface Props {
    corporateId: string | number;
}

const LookupTransactions = ({ corporateId }: Props) => {
    const [page, setPage] = useState(1);

    const { isLoading, tableData, count } = useTransactions({
        page,
        searchText: '',
        itemsPerPage: 10,
        sort: 'DESC',
        from: '2020-01-01',
        to: dayjs().format('YYYY-MM-DD'),
        id: corporateId,
    });

    const columns = [
        {
            title: 'Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (data: string) => (
                <Typography.Text>{data ? formattedDateTime(new Date(data)) : '-'}</Typography.Text>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
        {
            title: 'Category',
            dataIndex: 'serviceOperator',
            key: 'serviceOperator',
            render: (data: any) => (
                <Typography.Text>{data?.serviceCategory ?? '-'}</Typography.Text>
            ),
        },
        {
            title: 'Debit Amount',
            dataIndex: 'order',
            key: 'order',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data?.amountInINR ?? 0))}
                </Typography.Text>
            ),
        },
        {
            title: 'Cashback',
            dataIndex: 'corporateCashback',
            key: 'corporateCashback',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data ?? 0))}
                </Typography.Text>
            ),
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            render: (data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(Number(data ?? 0))}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    SUCCESS: 'success',
                    FAILED: 'error',
                    PENDING: 'warning',
                };
                return (
                    <Tag
                        color={colorMap[status?.toUpperCase()] || 'default'}
                        className="rounded-[12px] px-[10px] py-[2px]"
                    >
                        {status || '-'}
                    </Tag>
                );
            },
        },
    ];

    return (
        <Flex vertical gap={16}>
            <Table
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                scroll={{ x: 'max-content' }}
            />
            <Pagination
                current={page}
                size="default"
                className="text-end justify-end"
                onChange={setPage}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default LookupTransactions;
