import type { FC } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';

import { Flex, Pagination, Table, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { SortDirection } from '@customtypes/general';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import OrdersMobile from './OrdersMobile';
import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';
import { OrderTableItem } from '../../types/orderHistory';

const { logistics } = paths;
interface HistoryTableProps {
    searchText?: string | null;
}

const HistoryTable: FC<HistoryTableProps> = ({ searchText }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const [sort] = useState<SortDirection>(SortDirection.DESC);
    const { xs } = useScreenSize();

    useEffect(() => {
        setCurrentPage(1);
    }, [searchText]);

    const { orders, isLoading, count } = useOrderHistoryApi({
        itemsPerPage: pageSize,
        page: currentPage,
        search: searchText,
        sort,
    });
    const columns = useMemo(
        () => [
            {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                render: (date: string) => new Date(date).toLocaleString(),
            },
            {
                title: 'Service Type',
                dataIndex: 'serviceType',
                key: 'serviceType',
                render: (serviceType: string, record: OrderTableItem) =>
                    record.serviceType ? `${record.serviceType}` : 'N/A',
            },
            {
                title: 'Order ID',
                dataIndex: 'transactionId',
                key: 'transactionId',
            },
            {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount: string) => (
                    <Typography.Text>₹ {parseFloat(amount).toFixed(2)}</Typography.Text>
                ),
            },
            {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => {
                    const statusStyle =
                        status === 'FAILURE' ? { color: '#FF0000' } : { color: 'green' };
                    return <Flex style={statusStyle}>{status}</Flex>;
                },
            },
            {
                title: 'View',
                key: 'view',
                render: (providerId: string, record: OrderTableItem) =>
                    record.status !== 'FAILURE' ? (
                        <Link
                            to={`/${logistics.index}/${logistics.track}?trackingNo=${record.providerId}`}
                            style={{ color: '#FF3A3A' }}
                        >
                            Track your order
                        </Link>
                    ) : (
                        '--'
                    ),
            },
        ],
        []
    );

    return (
        <>
            {xs ? (
                <OrdersMobile isLoading={isLoading} data={orders} />
            ) : (
                <Table
                    scroll={{ x: 756 }}
                    loading={isLoading}
                    dataSource={orders}
                    columns={columns}
                    pagination={false}
                />
            )}

            <Pagination
                className="mt-3 text-center sm:mt-10 sm:text-end"
                total={count}
                current={currentPage}
                defaultPageSize={pageSize}
                onChange={(page, pageSize2) => {
                    setCurrentPage(page);
                    setPageSize(pageSize2);
                }}
            />
        </>
    );
};

export default memo(HistoryTable);
