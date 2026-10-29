import type { FC } from 'react';
import { useState } from 'react';

import { Pagination, Table, Typography } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';

import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';
import { OrderTableItem } from '../../types';

interface HistoryTableProps {
    searchText?: string | null;
    fromDate: string;
    toDate: string;
}

const HistoryTable: FC<HistoryTableProps> = ({ searchText, fromDate, toDate }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    const { orders, isLoading, count } = useOrderHistoryApi({
        itemsPerPage: pageSize,
        page: currentPage,
        search: searchText,
        sort: 'DESC',
        fromDate,
        toDate,
    });

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string, record: OrderTableItem) => formattedDateTime(new Date(date)),
        },
        {
            title: 'Plan',
            dataIndex: 'plan',
            key: 'plan',
        },
        {
            title: 'Order ID',
            dataIndex: 'transactionId',
            key: 'transactionId',
        },
        {
            title: 'Billing Cycle',
            dataIndex: 'billingCycle',
            key: 'billingCycle',
            render: (data: string) => (
                <Typography.Text className="capitalize">{data}</Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string, record: OrderTableItem) =>
                `₹ ${parseFloat(amount).toFixed(2)}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const getStatusStyle = (statusValue: string) => {
                    switch (statusValue.toLowerCase()) {
                        case 'pending':
                            return { color: '#C89C00', fontWeight: 'bold' };
                        case 'onprogress':
                            return { color: '#0000A0', fontWeight: 'bold' };
                        default:
                            return { color: 'green', fontWeight: 'bold' };
                    }
                };

                const getStatusText = (statusValue: string) => {
                    switch (statusValue.toLowerCase()) {
                        case 'onprogress':
                            return 'In Progress';
                        case 'complete':
                            return 'Completed';
                        case 'pending':
                            return 'Pending';
                        default:
                            return statusValue;
                    }
                };

                const statusText = getStatusText(status);
                const statusStyle = getStatusStyle(status);

                return (
                    <Typography.Text className="capitalize" style={statusStyle}>
                        {statusText}
                    </Typography.Text>
                );
            },
        },
        // {
        //     title: 'Action',
        //     key: 'action',
        //     render: (record: OrderTableItem) => {
        //         const { status } = record;
        //         return (
        //             <Typography.Text
        //                 className="cursor-pointer text-bgOrange2 hover:underline"
        //                 onClick={() => handleDownload(status)}
        //             >
        //                 Download Docs
        //             </Typography.Text>
        //         );
        //     },
        // },
    ];

    return (
        <>
            <Table
                scroll={{ x: 756 }}
                loading={isLoading}
                dataSource={orders}
                columns={columns}
                pagination={false}
            />

            <Pagination
                className="mt-10 text-center sm:text-end"
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
