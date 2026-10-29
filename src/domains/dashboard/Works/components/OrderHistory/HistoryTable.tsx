import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { Pagination, Typography } from 'antd';
import { Link } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';
import { OrderTableItem } from '../../type/orderHistory';

const { works } = paths;
interface HistoryTableProps {
    searchText?: string | null;
    fromDate: string;
    toDate: string;
}

const HistoryTable: FC<HistoryTableProps> = ({ searchText, fromDate, toDate }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [sort, setSort] = useState<'ASC' | 'DESC'>('DESC');

    useEffect(() => {
        setCurrentPage(1);
    }, [fromDate, toDate, searchText]);

    const { orders, isLoading, count } = useOrderHistoryApi({
        from: fromDate,
        to: toDate,
        itemsPerPage: pageSize,
        page: currentPage,
        searchText,
        sort,
    });
    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string, record: OrderTableItem) => formattedDateTime(new Date(date)),
            // sorter: (a: OrderTableItem, b: OrderTableItem) =>
            //     sort === 'DESC' ? setSort('ASC') : setSort('DESC')
        },
        {
            title: 'Work Name',
            dataIndex: 'workName',
            key: 'workName',
        },
        {
            title: 'Plan Name',
            dataIndex: 'planName',
            key: 'planName',
        },
        {
            title: 'Order ID',
            dataIndex: 'transactionId',
            key: 'transactionId',
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
            render: (paymentMode: string) => (
                <Typography.Text className="text-sm capitalize">
                    {paymentMode?.toLowerCase()}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) =>
                amount && (
                    <Typography.Text className="text-sm">
                        ₹ {formatNumberWithLocalString(amount)}
                    </Typography.Text>
                ),
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (paymentStatus: string) => {
                const statusColors: Record<string, string> = {
                    pending: '#C89C00',
                    success: 'green',
                };
                const color = statusColors[paymentStatus.toLowerCase()] || 'red';

                return (
                    <Typography.Text style={{ color }} className="capitalize text-nowrap">
                        {paymentStatus.toLowerCase()}
                    </Typography.Text>
                );
            },
        },
        // {
        //     title: 'Status',
        //     dataIndex: 'status',
        //     key: 'status',
        //     render: (status: string) => {
        //         let statusStyle = {
        //             color: '#C89C00',
        //             fontWeight: '500',
        //         };
        //         if (status?.toLowerCase() === 'pending') {
        //             statusStyle = {
        //                 color: '#C89C00',
        //                 fontWeight: '500',
        //             };
        //         }
        //         if (status?.toLowerCase() === 'completed') {
        //             statusStyle = {
        //                 color: '#26A411',
        //                 fontWeight: '500',
        //             };
        //         }
        //         if (status?.toLowerCase() === 'onprogress') {
        //             statusStyle = {
        //                 color: '#54AEE1',
        //                 fontWeight: '500',
        //             };
        //         }
        //         return (
        //             <Typography.Text style={statusStyle} className="capitalize">
        //                 {status?.toLowerCase() === 'onprogress'
        //                     ? 'in progress'
        //                     : status?.toLowerCase()}
        //             </Typography.Text>
        //         );
        //     },
        // },
        {
            title: 'View',
            key: 'view',
            render: (text: string, record: OrderTableItem) => (
                <Link
                    to={
                        record.id
                            ? `${paths.dashboard.works}/${works.orderHistory}/${works.orderDetails}/${record.id}`
                            : ''
                    }
                    style={{ color: record.id ? '#FF3A3A' : '#808080' }}
                    className={` ${!record.id && 'cursor-not-allowed'}`}
                >
                    View Details
                </Link>
            ),
        },
    ];
    return (
        <>
            <GenericTable
                rowKey={record => record.id}
                loading={isLoading}
                dataSource={orders}
                columns={columns}
                pagination={false}
            />

            <Pagination
                className="sm:text-end text-center mt-10 "
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

export default HistoryTable;
