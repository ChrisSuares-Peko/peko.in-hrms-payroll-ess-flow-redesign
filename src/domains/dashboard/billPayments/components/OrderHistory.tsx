import React, { useState } from 'react';

import { Badge, Flex, Pagination, Table, Typography } from 'antd';

import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import HistoryHeader from './History/HistoryHeader';
import useFilter from '../hooks/useFilter';
import useOrderHistoryApi from '../hooks/useGetHistory';

const OrderHistory = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    // Handling cases where last month has fewer days
    if (lastMonth.getDate() !== today.getDate()) {
        lastMonth.setDate(0);
    }
    const initialValues = {
        page: 1,
        itemsPerPage: 10,
        filter: '',
        // module: 'all',
        searchText: '',
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
    };
    const [filters, setFilters] = useState(initialValues);
    const statusStyles = {
        SUCCESS: {
            text: '#16a34a',
            background: '#d1fae5',
        },
        FAILURE: {
            text: '#d97b7b',
            background: '#ffc2c2',
        },
    };

    function findColorByStatus(status: string) {
        let value = statusStyles.SUCCESS;
        if (status === 'SUCCESS' || status === 'FAILURE') {
            value = statusStyles[status];
        }
        return value;
    }

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, count, history } = useOrderHistoryApi(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (createdAt: any) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Order ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (id: any) => <Typography.Text> {id}</Typography.Text>,
        },
        {
            title: 'B-Connect Transaction ID',
            dataIndex: 'bbpsSupportHistory', // Access bbpsSupportHistory
            key: 'txnRefId',
            render: (bbpsSupportHistory: any) => (
                <Typography.Text>
                    {bbpsSupportHistory?.requestBody?.txnRefId || 'N/A'}
                </Typography.Text>
            ),
        },

        // {
        //     title: 'Offers',
        //     dataIndex: 'offersText',
        //     key: 'offersText',
        //     width: 250,
        //     render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        // },
        // {
        //     title: "Mobile Number",
        //     dataIndex: "mobileNumber",
        //     key: "mobileNumber",
        //     render: (data: any) => <Typography.Text>{data || "-"}</Typography.Text>,
        // },
        {
            title: 'Bill Category',
            dataIndex: 'category',
            key: 'category',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },
        {
            title: 'Operator',
            dataIndex: 'Operator',
            key: 'Operator',
            render: (data: any) => <Typography.Text>{data || '-'}</Typography.Text>,
        },

        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (data: any) => (
                <Typography.Text>
                    {`₹ ${formatNumberWithLocalString(Number(data))}` || '-'}
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: any) => (
                <Flex>
                    {/* <Typography.Text
                                                       className="px-5 py-1 text-sm rounded-xl text-nowrap"
                                                       style={{
                                                           color: findColorByStatus(status).text,
                                                           background: findColorByStatus(status).background,
                                                        //    borderColor: findColorByStatus(status).border,
                                                       }}
                                                   >
                                                       {status}
                                                   </Typography.Text> */}
                    <Badge
                        status={status === 'SUCCESS' || status === 'REFUNDED' ? 'success' : 'error'}
                        text={status.charAt(0) + status.slice(1).toLowerCase()}
                        className="px-2 rounded-2xl"
                        style={{
                            color: findColorByStatus(status).text,
                            backgroundColor: findColorByStatus(status).background,
                            padding: '2px 7px',
                            border: '1px ',
                            borderRadius: '15px',
                        }}
                    />
                </Flex>
            ),
        },
    ];
    return (
        <Flex vertical className="mt-2">
            <HistoryHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            <Table
                scroll={{ x: 756 }}
                rowKey={record => record.id}
                // className="w-full mt-4"
                bordered={false}
                columns={columns}
                dataSource={history}
                pagination={false}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                onChange={handlePageChange}
                size="default"
                className="pt-7 text-center md:text-end"
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default OrderHistory;
