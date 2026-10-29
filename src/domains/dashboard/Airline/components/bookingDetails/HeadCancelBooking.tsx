import React from 'react';

import { Button, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';


const isUpcoming = (departure: string) => {
    const departureDate = new Date(departure);
    const now = new Date();
    return !(departureDate < now);
};
export default function HeadPart() {
    const { sm } = useScreenSize();
    const navigate = useNavigate();
    const orderDetails = useAppSelector(state => state.reducer.airline.orderDetails);
    const { bookingStatus } = orderDetails || {};

    const isDomesticRoundTrip = !!orderDetails.inbountPNR;
    
    // const modificationStatus =
    //     flightModifiedBookings?.[flightModifiedBookings.length - 1]?.modificationStatus || '';
    // const showModifyBooking = !['MODIFICATION_REQUESTED', 'MODIFICATION_QUOTE_RECEIVED', 'MODIFICATION_PAYMENT_COMPLETED'].includes(modificationStatus);

    return (
        <Row justify="space-between" gutter={[0, 15]} align="bottom">
            <Flex vertical gap={14}>
                <Typography.Text className="text-xl font-medium">
                    Modify/Cancel Booking
                </Typography.Text>
            </Flex>
            {orderDetails && (
                <>
                    {bookingStatus === 'Successful' &&
                        isUpcoming(orderDetails?.journey[0]?.Origin?.DepTime) &&
                        !isDomesticRoundTrip && (
                            <Flex gap={10}>
                                {/* {flightModifiedBookings.length === 0 && (
                                    <Button
                                        type="primary"
                                        danger
                                        onClick={() =>
                                            navigate(
                                                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}/${paths.airline.modify}`
                                            )
                                        }
                                    >
                                        Modify Booking
                                    </Button>
                                )} */}
                                <Button
                                    danger
                                    onClick={() =>
                                        navigate(
                                            `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}/${paths.airline.cancelDetails}`,
                                            {
                                                state: {
                                                    bookingId: orderDetails.BookingId,
                                                },
                                            }
                                        )
                                    }
                                    size={sm ? 'middle' : 'small'}
                                >
                                    Cancel Booking
                                </Button>
                            </Flex>
                        )}

                    {bookingStatus === 'CANCELLED_REQUEST_FOR_REFUND' && (
                        <Typography.Text className="text-red-400">
                            Cancelled and refund requested
                        </Typography.Text>
                    )}
                    {bookingStatus === 'CANCELLED_AND_REFUNDED' && (
                        <Typography.Text className="text-red-400">
                            Cancelled and refunded
                        </Typography.Text>
                    )}
                    {/* {bookingStatus === 'BOOKING_FAILED' && (
                        <Typography.Text className="text-red-400">Booking failed</Typography.Text>
                    )} */}
                    {/* {bookingStatus === 'OK_TO_TICKET' && (
                        <>
                            <Typography.Text className="text-red-400 md:text-center">
                                We are verifying the status of your booking.
                                <br />
                                It may take up to 30 mins.
                            </Typography.Text>
                            <Button
                                danger
                                type="primary"
                                className="w-40 flex justify-center xs:mt-2 md:mt-0"
                                style={{ borderRadius: '0.125rem' }}
                                onClick={() => handleRetry(Number(orderDetails.id))}
                            >
                                Check Status
                            </Button>
                        </>
                    )} */}
                </>
            )}
        </Row>
    );
}
