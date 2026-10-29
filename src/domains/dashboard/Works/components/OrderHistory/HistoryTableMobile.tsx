import type { FC } from 'react';
import { useEffect, useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Flex, Pagination, Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';

import MoreTransactions from '@assets/svg/moretransactions.svg';
import { paths } from '@src/routes/paths';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useOrderHistoryApi } from '../../hooks/useOrderHistoryApi';

const { works } = paths;
interface HistoryTableMobileProps {
    searchText?: string | null;
    fromDate: string;
    toDate: string;
}

const HistoryTableMobile: FC<HistoryTableMobileProps> = ({ searchText, fromDate, toDate }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [fromDate, toDate, searchText]);

    const { orders, isLoading, count } = useOrderHistoryApi({
        from: fromDate,
        to: toDate,
        itemsPerPage: pageSize,
        page: currentPage,
        searchText,
        sort: 'DESC',
    });

    if (isLoading) {
        return (
            <Flex className="mt-20 justify-center w-full">
                <Spin />
            </Flex>
        );
    }

    return (
        <>
            {orders.length > 0 ? (
                orders.map((item, index) => {
                    const statusColors: Record<string, string> = {
                        pending: '#C89C00',
                        success: 'green',
                    };
                    const color = statusColors[item.paymentStatus.toLowerCase()] || 'red';
                    return (
                        <Card
                            size="small"
                            className="mt-4  bg-slate-50 border-none p-2"
                            key={index}
                        >
                            <Flex className="w-full" gap={5} vertical>
                                {/* <Flex className="w-full" justify="space-between" align="center">
                                <Typography.Text className="text-base font-medium text-gray-500">
                                    ₹ {parseFloat(item?.amount).toFixed(2)}
                                </Typography.Text>
                                <Flex
                                    className={`capitalize text-sm p-1 px-4 rounded-md font-medium border ${item.status.toLowerCase() === 'pending' ? 'text-yellow-400 border-yellow-400' : 'text-green-400 border-green-400'}`}
                                >
                                    {item.status === 'ONPROGRESS'
                                        ? 'in progress'
                                        : item.status.toLowerCase()}
                                </Flex>
                            </Flex> */}
                                {/* <Divider /> */}
                                <Flex justify="space-between" align="center">
                                    <Flex gap={5} vertical>
                                        <Typography.Text className="text-xs font-normal text-gray-500">
                                            Date: {formattedDateTime(new Date(item.date))}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal text-gray-500">
                                            Work Name: {item?.workName}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal text-gray-500">
                                            Plan Name: {item?.planName}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal text-gray-500">
                                            Order ID: {item?.transactionId}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal text-gray-500 capitalize">
                                            Payment Mode: {item?.paymentMode?.toLowerCase()}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal text-gray-500">
                                            Amount: ₹ {formatNumberWithLocalString(item?.amount)}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs font-normal text-gray-500 capitalize">
                                            Status:{' '}
                                            <Typography.Text
                                                style={{ color }}
                                                className="capitalize text-nowrap"
                                            >
                                                {item?.paymentStatus.toLowerCase()}
                                            </Typography.Text>
                                        </Typography.Text>
                                    </Flex>
                                    <Button type="default" className=" bg-white">
                                        <Link to={`${works.orderDetails}/${item.id}`}>
                                            <RightOutlined />
                                        </Link>
                                    </Button>
                                </Flex>
                            </Flex>
                        </Card>
                    );
                })
            ) : (
                <Flex vertical justify="center" align="center" className="h-full">
                    <Empty image={MoreTransactions} description="No data found" />
                </Flex>
            )}

            {orders.length > 0 && (
                <Pagination
                    className="sm:text-end text-center mt-10"
                    total={count}
                    current={currentPage}
                    defaultPageSize={pageSize}
                    onChange={(page, pageSize2) => {
                        setCurrentPage(page);
                        setPageSize(pageSize2);
                    }}
                />
            )}
        </>
    );
};

export default HistoryTableMobile;
