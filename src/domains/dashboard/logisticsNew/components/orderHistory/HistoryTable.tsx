import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { Button, Grid, Pagination, Table, Typography } from 'antd';
import { debounce } from 'lodash';
import { Link } from 'react-router-dom';

import { SortDirection } from '@customtypes/general';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { snakeCaseToSentenceCase } from '@utils/wordFormat';

import OrdersMobile from './OrdersMobile';
import { useOrderHistoryApi } from '../../hooks/track/useOrderHistoryApi';
import { OrderTableItem } from '../../types/orderHistory';

const { logistics } = paths;
interface HistoryTableProps {
    handlePageChange?: (page: number, pageSize: number) => void;
    filters: {
        searchText: string;
        page: number;
        itemsPerPage: number;
        from: string;
        to: string;
    };
}

const HistoryTable: FC<HistoryTableProps> = ({ handlePageChange, filters }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [debouncedSearchText, setDebouncedSearchText] = useState<string>(
        filters.searchText || ''
    );
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();

    const debouncedSearch = debounce((searchQuery: string) => {
        setDebouncedSearchText(searchQuery || '');
    }, 500);

    useEffect(() => {
        if (filters.searchText && filters.searchText.trim() !== '') {
            setCurrentPage(1);
        }
        debouncedSearch(filters.searchText || '');
        return () => {
            debouncedSearch.cancel();
        };
    }, [filters.searchText, debouncedSearch]);

    const { orders, isLoading, count } = useOrderHistoryApi({
        itemsPerPage: filters.itemsPerPage,
        page: filters.page,
        search: debouncedSearchText,
        sort: SortDirection.DESC,
        from: filters.from,
        to: filters.to,
    });

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => formattedDateTime(new Date(date)),
        },
        {
            title: 'Tracking Number',
            dataIndex: 'trackingNumber',
            render: (text: string) => text || '-',
            key: 'TrackingNumber',
        },
        {
            title: 'Order ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: string) => (
                <Typography.Text>₹{parseFloat(amount).toFixed(2)}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (text: string) => {
                let displayText;
                if (text === 'PENDING') {
                    displayText = 'In Progress';
                } else if (text === 'failed') {
                    displayText = 'Failed';
                } else {
                    displayText = snakeCaseToSentenceCase(text);
                }
                return (
                    <span className={`${text === 'SUCCESS' ? 'text-textGreen' : 'text-bgOrange2'}`}>
                        {displayText}
                    </span>
                );
            },
        },
        {
            title: 'View',
            key: 'view',
            render: (providerId: string, record: OrderTableItem) =>
                record.paymentStatus === 'FAILURE' ? (
                    <Button type="link" disabled className="p-0">
                        Track your order
                    </Button>
                ) : (
                    <Link
                        to={`/${logistics.index}/${logistics.orderHistory}/${logistics.trackOrderDetails}?trackingNo=${record.corporateTxnId}`}
                        style={{ color: '#FF3A3A' }}
                    >
                        Track your Order
                    </Link>
                ),
        },
    ];

    return (
        <>
            {screens.xs ? (
                <OrdersMobile isLoading={isLoading} data={orders} />
            ) : (
                <Table
                    scroll={{ x: 756 }}
                    loading={isLoading}
                    dataSource={orders.map(item => ({ ...item, key: item.corporateTxnId }))}
                    columns={columns}
                    pagination={false}
                />
            )}
            {orders.length > 0 && (
                <Pagination
                    className="mt-3 text-center sm:mt-10 sm:text-end"
                    total={count}
                    current={filters.page || currentPage}
                    onChange={handlePageChange}
                />
            )}
        </>
    );
};

export default HistoryTable;
