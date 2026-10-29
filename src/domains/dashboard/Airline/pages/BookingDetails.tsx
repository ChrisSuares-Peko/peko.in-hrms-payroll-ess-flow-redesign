import { useEffect } from 'react';

import { Col, Flex, Row, Skeleton } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import DetailsBody from '../components/bookingDetails/DetailsBody';
import HeadCancelBooking from '../components/bookingDetails/HeadCancelBooking';
// import ModificationDetails from '../components/BookingDetails/ModificationDetails';
// import PassengerInfo from '../components/BookingDetails/PassengerInfo';
import PassengerInfo from '../components/bookingDetails/PassengerInfo';
import useBookingDetails from '../hooks/useBookingDetails';

const BookingDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const orderDetails = useAppSelector(state => state.reducer.airline.orderDetails);
    const { bookingStatus } = orderDetails || {};
    const { id, refresh } = location.state || {};

    const { getBookingDetails, isLoading } = useBookingDetails();

    useEffect(() => {
        const fetchBookingDetails = async () => {
            const res = await getBookingDetails(id, refresh);
            if (!res)
                navigate(
                    `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}`
                );
        };
        fetchBookingDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate, refresh]);

    const showBookingDetails = isLoading;
    const showDetailsBody = bookingStatus !== 'MODIFIED';

    return (
        <Row>
            <Col span={24}>
                <Flex vertical gap={40}>
                    <HeadCancelBooking />
                    {showBookingDetails ? (
                        <Skeleton paragraph={{ rows: 20 }} />
                    ) : (
                        <Flex vertical gap={40}>
                            {showDetailsBody && <DetailsBody />}
                            {/* {flightModifiedBookings &&
                                flightModifiedBookings.map((v: any, i: number) => (
                                    <ModificationDetails indexKey={i} key={i} />
                                ))} */}
                            <PassengerInfo />
                        </Flex>
                    )}
                </Flex>
            </Col>
        </Row>
    );
};

export default BookingDetails;
