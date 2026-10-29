import React from 'react';

import { ArrowDownOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Typography, Divider, Image, Tag } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';

import { BookingList } from '../../types/manageBookings';
import { calculateDuration, findCabilClass } from '../../utils/formatDateCode';
import FlightDurationBadgeMobile from '../FlightDurationBadgeMobile';
import FlightInfoSM from '../FlightInfoTypographySM';

interface MobileBookingProps {
    booking: BookingList;
    onDownloadTicket: () => void;
    onModifyCancel: () => void;
    onRetry: () => void;
    isLoading: boolean;
}

const MobileBookingCard: React.FC<MobileBookingProps> = ({
    booking,
    onDownloadTicket,
    onModifyCancel,
    onRetry,
    isLoading,
}) => {
    const showDownloadAndManageBooking = booking.status === 'Successful';
    // ||
    // booking.status === 'CANCELLED_REQUEST_FOR_REFUND' ||
    // booking.status === 'CANCELLED_AND_REFUNDED' ||
    // booking.status === 'MODIFIED';
    const { journey, inbountJourney } = booking;
    const groupedJourney = [journey, inbountJourney];
    return (
        <Card className="mb-4 border-2 px-0 py-5 w-full" styles={{ body: { padding: '.9375rem' } }}>
            <Row className="w-full" align="middle">
                <Col span={12} className="">
                    <Image
                        preview={false}
                        className="w-full max-w-[5rem] h-auto object-contain"
                        src={booking.logo}
                        alt={`${booking.flightClass} logo`}
                    />
                </Col>
                <Col span={12} className="flex justify-end">
                    <Tag color="red" className="text-xs border-none">
                        {findCabilClass(booking.flightClass as 1 | 4 | 6 | 2 | 5 | 3)} Class
                    </Tag>
                </Col>
            </Row>

            <Row>
                <Col xs={24} className="mb-2">
                    <Typography.Text className="font-medium text-xs">
                        Airline PNR: {booking?.pnr}
                    </Typography.Text>
                </Col>
                <Col xs={24} className="mb-2">
                    <Typography.Text className="font-medium text-xs">
                        Confirmation Number: {booking.bookingId}
                    </Typography.Text>
                </Col>
                <Col xs={24} className="mb-2">
                    <Typography.Text className="font-medium text-xs">
                        Booking Date:{' '}
                        {`${booking?.bookingDate && formattedDateTime(new Date(booking.bookingDate))}`}
                    </Typography.Text>
                </Col>
            </Row>

            {groupedJourney.map((journeys, journeyIndex) => {
                if (!journeys) return null;

                const firstFlight = journeys[0];
                const lastFlight = journeys[journeys.length - 1];

                const duration = calculateDuration(journeys);
                return (
                    <div key={journeyIndex}>
                        <Row className="mb-4" gutter={[8, 8]} justify="space-evenly">
                            <Col span={8}>
                                <FlightInfoSM
                                    info={{
                                        datetime: firstFlight.Origin.DepTime,
                                        airport: firstFlight.Origin.Airport.AirportCode,
                                        terminal: firstFlight.Origin.Airport.Terminal,
                                        title: 'Departure',
                                    }}
                                />
                            </Col>

                            <Col span={5} className="text-center mt-2">
                                <FlightDurationBadgeMobile duration={duration} />
                                <Typography.Text className="text-gray-500 text-xs mt-2">
                                    {Number(journey.length) === 1
                                        ? 'Non stop'
                                        : `${journey.length - 1} stop`}
                                </Typography.Text>
                            </Col>
                            <Col span={1}>
                                <Divider />
                            </Col>

                            <Col span={8} offset={2}>
                                <FlightInfoSM
                                    info={{
                                        datetime: lastFlight.Destination.ArrTime,
                                        airport: lastFlight.Destination.Airport.AirportCode,
                                        terminal: lastFlight.Destination.Airport.Terminal,
                                        title: 'Arrival',
                                    }}
                                />
                            </Col>
                        </Row>
                        {journeyIndex === 0 && groupedJourney[1] && (
                            <Divider
                                dashed
                                orientation="center"
                                plain
                                className="my-4"
                                style={{ borderColor: 'black' }}
                            >
                                <ArrowDownOutlined
                                    style={{
                                        color: 'white',
                                        fontSize: '16px',
                                        backgroundColor: 'red',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        border: '1px solid white',
                                    }}
                                />
                            </Divider>
                        )}
                    </div>
                );
            })}

            <Row justify="center" className="mt-4">
                {booking.status === 'BOOKING_FAILED' && (
                    <Typography.Text className="text-red-400 text-center">
                        Booking Failed
                    </Typography.Text>
                )}
                {booking.status === 'CANCELLED_REQUEST_FOR_REFUND' && (
                    <Typography.Text className="text-red-400 text-center">
                        Booking cancelled
                    </Typography.Text>
                )}
                {booking.status === 'CANCELLED_AND_REFUNDED' && (
                    <Typography.Text className="text-red-400 text-center">
                        Booking cancelled
                    </Typography.Text>
                )}
                {booking.status === 'Successful' && (
                    <Button
                        type="primary"
                        danger
                        className="w-full mb-2"
                        onClick={onDownloadTicket}
                    >
                        Download Booking
                    </Button>
                )}
                {showDownloadAndManageBooking && (
                    <Button type="default" danger className="w-full" onClick={onModifyCancel}>
                        View/Manage booking
                    </Button>
                )}
                {booking.status === 'OK_TO_TICKET' && (
                    <>
                        <Typography.Text className="text-red-400 text-center">
                            Booking is pending retry after some time
                        </Typography.Text>
                        <Button
                            danger
                            type="primary"
                            className="w-40 flex justify-center"
                            style={{ borderRadius: '0.125rem' }}
                            onClick={onRetry}
                            loading={isLoading}
                        >
                            Retry
                        </Button>
                    </>
                )}
            </Row>
            {/* <Row justify="space-between" className="mt-2">
            <Typography.Text type="secondary">Cancellation Policy</Typography.Text>
            <Typography.Text type="secondary">Support</Typography.Text>
        </Row> */}
        </Card>
    );
};

export default MobileBookingCard;
