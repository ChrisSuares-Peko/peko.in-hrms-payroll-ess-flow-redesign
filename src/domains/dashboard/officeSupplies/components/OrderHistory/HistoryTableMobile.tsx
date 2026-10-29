import React, { useState } from 'react';

import { RightOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, Card, DatePicker, Divider, Flex, Input, Pagination, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import OndcStatusTag from './OndcStatusTag';
import OrderHistoryEmpty from './OrderHistoryEmpty';
import { useOndcOrderHistoryApi } from '../../hooks/useOndcOrderHistoryApi';
import { getDeliveryFulfillment } from '../../utils/fulfillmentStatus';
import { formatInr } from '../../utils/priceInr';

const { officeSupplies } = paths;

const HistoryTableMobile = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [fromDate, setFromDate] = useState<string | undefined>();
    const [toDate, setToDate] = useState<string | undefined>();

    const disabledDate = (current: dayjs.Dayjs) => Boolean(current && current > dayjs().endOf('day'));

    const handleFromChange = (date: dayjs.Dayjs | null) => {
        setFromDate(date ? date.format('YYYY-MM-DD') : undefined);
        setCurrentPage(1);
    };
    const handleToChange = (date: dayjs.Dayjs | null) => {
        setToDate(date ? date.format('YYYY-MM-DD') : undefined);
        setCurrentPage(1);
    };

    const { orders, isLoading, count } = useOndcOrderHistoryApi({
        from: fromDate,
        to: toDate,
        search: searchText,
        page: currentPage,
        itemsPerPage: pageSize,
    });

    // `isLoading` matters here: without it the in-flight state and the genuinely-empty
    // state render identically, so a slow fetch looks like "you have no orders".
    const isEmpty = !isLoading && orders.length === 0;
    const isFiltered = Boolean(searchText || fromDate || toDate);

    return (
        <>
            <Flex vertical className="my-1">
                <Typography.Paragraph className="text-xl font-medium">
                    Order History
                </Typography.Paragraph>
                <Flex justify="space-between" className="mt-5">
                    <DatePicker onChange={handleFromChange} format="YYYY-MM-DD" disabledDate={disabledDate} />
                    <SwapRightOutlined />
                    <DatePicker onChange={handleToChange} format="YYYY-MM-DD" disabledDate={disabledDate} />
                </Flex>

                <Input.Search
                    placeholder="Search"
                    allowClear
                    className="mt-5 w-full"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                />
            </Flex>

            {isLoading && (
                <Flex justify="center" className="py-16">
                    <Spin />
                </Flex>
            )}

            {isEmpty && <OrderHistoryEmpty filtered={isFiltered} />}

            {orders.map(item => (
                <Card size="small" className="mt-4 border-none bg-slate-50" key={item.id}>
                    <Flex className="w-full" gap={5} vertical>
                        <Flex className="w-full" justify="space-between" align="center">
                            <Typography.Text className="text-base font-medium text-gray-500">
                                {formatInr(item.amount)}
                            </Typography.Text>
                            <OndcStatusTag
                                status={item.status}
                                deliveryStatusCode={getDeliveryFulfillment(item.fulfillments)?.state?.descriptor?.code}
                            />
                        </Flex>
                        <Divider className="!my-2" />
                        {/* Full-width details: a side button column squeezed the 32-char
                            Order ID under the button on 320px phones. */}
                        <Flex gap={5} vertical>
                            <Typography.Text className="text-xs font-normal text-gray-500">
                                Seller: {item.seller || '-'}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal text-gray-500">
                                Order ID: {item.orderId}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal text-gray-500">
                                Ordered On: {dayjs(item.date).format('MMMM D, YYYY [at] hh:mm A')}
                            </Typography.Text>
                            <Flex justify="space-between" align="center" gap={8}>
                                <Typography.Text className="line-clamp-1 min-w-0 flex-1 text-xs">
                                    {item.items || '-'}
                                </Typography.Text>
                                <Button
                                    type="default"
                                    size="small"
                                    aria-label="View order details"
                                    className="shrink-0 rounded-md bg-white"
                                    onClick={() =>
                                        navigate(
                                            `/${officeSupplies.index}/${officeSupplies.orderHistory}/${officeSupplies.orderDetails}/${item.id}`
                                        )
                                    }
                                >
                                    <RightOutlined />
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                </Card>
            ))}

            {/* A pager under an empty list reads as a broken page — hide it when there is
                nothing to page through. */}
            {count > 0 && (
                <Pagination
                    className="sm:text-end text-center mt-10"
                    total={count}
                    current={currentPage}
                    pageSize={pageSize}
                    onChange={(page, size) => {
                        setCurrentPage(page);
                        setPageSize(size);
                    }}
                />
            )}
        </>
    );
};

export default HistoryTableMobile;
