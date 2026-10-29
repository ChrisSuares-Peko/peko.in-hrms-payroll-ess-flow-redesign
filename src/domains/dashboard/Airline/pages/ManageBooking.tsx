import { useState } from 'react';

import { Col, Flex, Pagination, Row, Tabs, TabsProps, Typography, Skeleton } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { updateActiveTab } from '@src/slices/activeTabSlice';

import ManageBookingSVG from '../assets/icons/ManageBookings.svg';
import HeadManageBooking from '../components/HeadManageBooking';
import BookingsBody from '../components/manageBooking/BookingsBody';
import { useManageBookingListAPI } from '../hooks/useManageBookingList';

const emptyMessage = {
    '1': 'No upcoming tickets found',
    '2': 'No modification requests found',
    '3': 'No past tickets found',
};
const availabilityMap: Record<'1' | '2' | '3', string> = {
    '1': 'upcoming',
    '2': 'modification_requested',
    '3': 'expired',
};
const ManageBooking = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const location = useLocation();
    const { airLineManageBookingActiveTab = '1' } = useAppSelector(
        state => state.reducer.activeTab
    );
    const defaultActiveKey =
        location?.state?.initialActiveTab || (airLineManageBookingActiveTab as '1' | '2' | '3');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [reload, setReload] = useState(false);
    const { data, pageData, isLoading, getBookingsListHandler } = useManageBookingListAPI(
        currentPage,
        availabilityMap[defaultActiveKey as '1' | '2' | '3'],
        reload
    );
    const onChange = (key: string) => {
        if (location?.state?.initialActiveTab) {
            navigate(location.pathname, { replace: true, state: null });
        }
        dispatch(updateActiveTab({ key: 'airLineManageBookingActiveTab', value: key }));
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Upcoming Ticket',
        },
        // {
        //     key: '2',
        //     label: 'Modification Requests',
        // },
        {
            key: '3',
            label: 'Past and Cancelled',
        },
    ];
    return (
        <Row>
            <Col span={24}>
                <Flex vertical gap={40}>
                    <HeadManageBooking />
                    <Tabs defaultActiveKey={defaultActiveKey} items={items} onChange={onChange} />
                    {isLoading ? (
                        <Skeleton paragraph={{ rows: 20 }} />
                    ) : (
                        <>
                            {data?.length === 0 ? (
                                <Flex
                                    className="w-full h-full mt-36"
                                    justify="center"
                                    align="center"
                                    vertical
                                >
                                    <ReactSVG src={ManageBookingSVG} />
                                    <Typography.Text className="text-textGrey mt-4 text-center">
                                        {emptyMessage[defaultActiveKey as '1' | '2' | '3'] || ''}
                                    </Typography.Text>
                                </Flex>
                            ) : (
                                data && (
                                    <>
                                        <BookingsBody
                                            bookings={data}
                                            currentPage={currentPage}
                                            getBookingsListHandler={getBookingsListHandler}
                                            setReload={setReload}
                                            availability={defaultActiveKey}
                                        />
                                        <Flex className="w-full sm:justify-end justify-center">
                                            <Pagination
                                                className="sm:text-end text-center mt-10"
                                                showSizeChanger={false}
                                                defaultCurrent={1}
                                                defaultPageSize={10}
                                                current={currentPage}
                                                size="default"
                                                total={pageData.count}
                                                onChange={(pageCount, pageSize) => {
                                                    setCurrentPage(pageCount);
                                                }}
                                            />
                                        </Flex>
                                    </>
                                )
                            )}
                        </>
                    )}
                </Flex>
            </Col>
        </Row>
    );
};

export default ManageBooking;
