import { useState } from 'react';

import { Col, Flex, Image, Pagination, Skeleton, Spin, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import noBookings from '@domains/dashboard/Hotels/Assets/noBookings.png';
import useScreenSize from '@src/hooks/useScreenSize';

import Manage from './Manage';
import { Booking, bookingData } from '../../types/managebookingTypes';

interface bookingProps {
    currentPage: number;
    setCurrentPage: Function;
    isLoading: boolean;
    data: Booking[];
    bookings: bookingData | undefined;
    refetch?: any;
}

const ManageBooking = ({
    isLoading,
    data,
    bookings,
    currentPage,
    setCurrentPage,
    refetch,
}: bookingProps) => {
    const count = bookings?.count;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };
    // const filteredItems = data.filter(item => item.status === 'SUCCESS');
    const screens = useScreenSize();
    const [downloadTicketLoading, setDownloadedTicketLoading] = useState(false);
    return (
        <>
            {data.length === 0 && !isLoading ? (
                <Flex vertical justify="center" align="center" style={{ height: '60vh' }}>
                    <Image height={200} width={250} src={noBookings} preview={false} />
                    <Typography.Text className="text-gray-400 mt-2 mr-1">
                        {' '}
                        No Bookings Found
                    </Typography.Text>
                </Flex>
            ) : (
                <Content>
                    {isLoading ? (
                        <Col span={24} className="mt-5">
                            <Skeleton active avatar />
                        </Col>
                    ) : (
                        <Spin className="w-full" spinning={downloadTicketLoading}>
                            {data.map(item => (
                                <Manage
                                    orderId={item.id}
                                    txnId={item.corporateTxnId}
                                    details={item.orderResponse}
                                    baseAmt={item.baseAmount}
                                    refetch={refetch}
                                    txnDate={item.transactionDate}
                                    setDownloadedTicketLoading={setDownloadedTicketLoading}
                                    downloadTicketLoading={downloadTicketLoading}
                                />
                            ))}
                            <Pagination
                                className="md:text-end text-center mt-5"
                                size={screens.sm ? 'default' : 'small'}
                                current={currentPage}
                                defaultCurrent={1}
                                total={count}
                                showSizeChanger={false}
                                onChange={handlePageChange}
                            />
                        </Spin>
                    )}
                </Content>
            )}
        </>
    );
};

export default ManageBooking;
