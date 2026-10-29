import { useState } from 'react';

import { Flex, Pagination, Table, Typography } from 'antd';
import dayjs from 'dayjs';

import { formattedDateOnly } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useSubscriptionListing from '../../reports/hooks/useSubscriptionListing';

interface Props {
    corporateId: string | number;
}

const statusColors = (status: string) => {
    if (status === 'ACTIVE')
        return <Typography.Text className="font-normal text-textGreen">{status}</Typography.Text>;
    if (status === 'UPGRADED')
        return <Typography.Text className="font-normal text-blue-500">{status}</Typography.Text>;
    if (status === 'DUE')
        return <Typography.Text className="font-normal text-orange-300">{status}</Typography.Text>;
    return <Typography.Text className="font-normal text-textRed">{status}</Typography.Text>;
};

const LookupSubscriptions = ({ corporateId }: Props) => {
    const [page, setPage] = useState(1);

    const { isLoading, tableData, count } = useSubscriptionListing({
        page,
        searchText: '',
        itemsPerPage: 10,
        sort: '',
        sortField: 'subscriptionEndDate',
        from: '2020-01-01',
        to: dayjs().format('YYYY-MM-DD'),
        id: corporateId,
    });

    const columns = [
        {
            title: 'Start Date',
            dataIndex: 'subscriptionStartDate',
            key: 'subscriptionStartDate',
            render: (data: string) => (
                <Typography.Text>{data ? formattedDateOnly(new Date(data)) : '-'}</Typography.Text>
            ),
        },
        {
            title: 'End Date',
            dataIndex: 'subscriptionEndDate',
            key: 'subscriptionEndDate',
            render: (data: string) => (
                <Typography.Text>{data ? formattedDateOnly(new Date(data)) : '-'}</Typography.Text>
            ),
        },
        {
            title: 'Package',
            dataIndex: 'packageName',
            key: 'packageName',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
        {
            title: 'Actual Price',
            dataIndex: 'subscriptionPrice',
            key: 'subscriptionPrice',
            render: (data: string) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data)}</Typography.Text>
            ),
        },
        {
            title: 'Paid Amount',
            dataIndex: 'subscriptionAmountPaid',
            key: 'subscriptionAmountPaid',
            render: (data: any) => (
                <Typography.Text>₹ {formatNumberWithLocalString(data)}</Typography.Text>
            ),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: (data: string) => <Typography.Text>{data ?? '-'}</Typography.Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (data: string) => statusColors(data),
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

export default LookupSubscriptions;
