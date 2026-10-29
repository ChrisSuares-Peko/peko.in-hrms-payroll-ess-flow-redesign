import type { FC } from 'react';
import React, { useEffect, useState } from 'react';

import { Button, Card, DatePicker, Flex, Input, Pagination, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import OndcStatusTag from './OndcStatusTag';
import OrderHistoryEmpty from './OrderHistoryEmpty';
import { useOndcOrderHistoryApi } from '../../hooks/useOndcOrderHistoryApi';
import { OndcOrderRow } from '../../types/ondcOrderHistory';
import { getDeliveryFulfillment } from '../../utils/fulfillmentStatus';
import { formatInr } from '../../utils/priceInr';

const { officeSupplies } = paths;
const { RangePicker } = DatePicker;

/** Office Supplies Order History table (Figma 2381-27160) — antd only. */
const HistoryTable: FC = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [fromDate, setFromDate] = useState<string | undefined>();
    const [toDate, setToDate] = useState<string | undefined>();

    const { orders, isLoading, count } = useOndcOrderHistoryApi({
        from: fromDate,
        to: toDate,
        search: searchText,
        page: currentPage,
        itemsPerPage: pageSize,
    });

    useEffect(() => {
        if (searchText) setCurrentPage(1);
    }, [searchText]);

    const isFiltered = Boolean(searchText || fromDate || toDate);

    const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
        setFromDate(dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined);
        setToDate(dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined);
        setCurrentPage(1);
    };

    const disabledDate = (current: dayjs.Dayjs) => Boolean(current && current > dayjs().endOf('day'));

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date: string) => (
                <Flex vertical gap={0}>
                    <Typography.Text>{dayjs(date).format('MMMM D, YYYY [at]')}</Typography.Text>
                    <Typography.Text>{dayjs(date).format('hh:mm A')}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Seller',
            dataIndex: 'seller',
            key: 'seller',
            render: (seller: string | null) => seller || '-',
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
        },
        {
            title: 'Order ID',
            dataIndex: 'orderId',
            key: 'orderId',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => formatInr(amount),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: OndcOrderRow) => (
                <OndcStatusTag
                    status={status}
                    deliveryStatusCode={getDeliveryFulfillment(record.fulfillments)?.state?.descriptor?.code}
                />
            ),
        },
        {
            title: 'Action',
            key: 'action',
            align: 'right' as const,
            render: (_: unknown, record: OndcOrderRow) => (
                <Button
                    size="small"
                    onClick={() =>
                        navigate(
                            `/${officeSupplies.index}/${officeSupplies.orderHistory}/${officeSupplies.orderDetails}/${record.id}`
                        )
                    }
                    className="!rounded-md !border-lightRed !text-lightRed"
                >
                    View
                </Button>
            ),
        },
    ];

    return (
        <Card className="!rounded-[30px] !border-[#dbdbdb]">
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} className="mb-5">
                <Typography.Text className="text-2xl font-medium text-[#171717]">
                    Order History
                </Typography.Text>
                <Flex gap={12} wrap="wrap">
                    <RangePicker
                        onChange={handleDateChange}
                        format="YYYY-MM-DD"
                        placeholder={['From date', 'To date']}
                        disabledDate={disabledDate}
                    />
                    <Input.Search
                        placeholder="Search"
                        allowClear
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 260 }}
                    />
                </Flex>
            </Flex>

            <Table
                scroll={{ x: 900 }}
                loading={isLoading}
                dataSource={orders.map(order => ({ ...order, key: order.id }))}
                columns={columns}
                pagination={false}
                // Replaces antd's generic "No data" so desktop and mobile show the same
                // empty state. antd already suppresses this while `loading` is true.
                locale={{ emptyText: <OrderHistoryEmpty filtered={isFiltered} /> }}
            />
            {/* A pager under an empty table reads as a broken page. */}
            {count > 0 && (
                <Pagination
                    className="mt-6 text-center sm:text-end"
                    total={count}
                    current={currentPage}
                    pageSize={pageSize}
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
                />
            )}
        </Card>
    );
};

export default HistoryTable;
