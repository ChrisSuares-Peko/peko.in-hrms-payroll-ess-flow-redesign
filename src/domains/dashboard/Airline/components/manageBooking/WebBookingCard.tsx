// WebBookingCard.tsx

import React from 'react';

import { ArrowDownOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Image, Row, Typography } from 'antd';

import { formattedDateTime } from '@utils/dateFormat';

import { Journey } from '../../types/airlineList';
import { BookingList } from '../../types/manageBookings';
import { calculateDuration } from '../../utils/formatDateCode';
import { retrieveFlightClass } from '../../utils/getFlightClass';
import FlightDurationBadge from '../FlightDurationBadge';
import FlightInfo from '../FlightInfoTypography';

interface WebBookingProps {
    booking: BookingList;
    onDownloadTicket: () => void;
    onModifyCancel: () => void;
    onRetry: () => void;
    isLoading: boolean;
}

const WebBookingCard: React.FC<WebBookingProps> = ({
    booking,
    onDownloadTicket,
    onModifyCancel,
    onRetry,
    isLoading,
}) => {
    const showDownloadAndManageBooking =
        booking.status === 'Successful' ||
        booking.status === 'CANCELLED_REQUEST_FOR_REFUND' ||
        booking.status === 'CANCELLED_AND_REFUNDED';
    // || booking.status === 'MODIFIED';

    const { journey, inbountJourney } = booking;
    const groupedJourney = [...splitSegments(journey), ...splitSegments(inbountJourney)];

    // incase of international round trips, all the segments are returned in a single array,
    // this function will split the segments
    function splitSegments(journeys: Journey[]) {
        if (!journeys) return [];
        const tempGrouped: Journey[][] = [];
        for (let i = 1; i <= 2; i += 1) {
            const seg = journeys.filter(j => j.TripIndicator === i);
            if (seg.length === 0) break;
            tempGrouped.push(seg);
        }
        return tempGrouped;
    }

    return (
        <Col className="mb-5" span={24}>
            <Card className="border-2 p-2" size="small">
                <Row>
                    <Col
                        span={24}
                        xl={3}
                        className="xs:flex xs:flex-col md:flex md:flex-col items-center w-full justify-center bg-tagColor"
                    >
                        <Image
                            preview={false}
                            className="w-full max-w-[7.5rem] h-auto object-contain"
                            src={booking?.logo}
                            alt={`${booking?.flightClass} logo`}
                        />
                        <Typography.Text className="text-red-400  font-medium text-center text-xs pb-4">
                            {retrieveFlightClass(booking?.flightClass)}
                        </Typography.Text>
                    </Col>

                    <Col span={24} xl={17} className="py-5 px-6 ">
                        {groupedJourney.map((journeys, journeyIndex: number) => {
                            if (!journeys) return null;

                            const firstFlight = journeys[0];
                            const lastFlight = journeys[journeys.length - 1];

                            const duration = calculateDuration(journeys);
                            return (
                                <div key={journeyIndex}>
                                    <Row className="mb-4">
                                        <Col
                                            sm={24}
                                            lg={8}
                                            className="flex flex-col items-center text-center pt-4"
                                        >
                                            <Typography.Text className="text-gray-500 text-base font-semibold">
                                                Departure
                                            </Typography.Text>
                                            <FlightInfo
                                                info={{
                                                    datetime: firstFlight.Origin.DepTime,
                                                    airport: firstFlight.Origin.Airport.AirportCode,
                                                    terminal: firstFlight.Origin.Airport.Terminal,
                                                }}
                                            />
                                        </Col>
                                        <Col
                                            sm={24}
                                            lg={8}
                                            className="flex flex-col items-center justify-center"
                                        >
                                            <FlightDurationBadge duration={duration} />
                                            <Typography.Text className="text-gray-500 text-base mt-2">
                                                {Number(journeys.length) === 1
                                                    ? 'Non stop'
                                                    : `${journey.length - 1} stop`}
                                            </Typography.Text>
                                        </Col>
                                        <Col
                                            sm={24}
                                            lg={8}
                                            className="flex flex-col items-center text-center pt-4"
                                        >
                                            <Typography.Text className="text-gray-500 text-base font-semibold">
                                                Arrival
                                            </Typography.Text>
                                            <FlightInfo
                                                info={{
                                                    datetime: lastFlight.Destination.ArrTime,
                                                    airport:
                                                        lastFlight.Destination.Airport.AirportCode,
                                                    terminal:
                                                        lastFlight.Destination.Airport.Terminal,
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                    {journeyIndex === 0 && groupedJourney[1] && (
                                        <Divider
                                            className="my-4"
                                            dashed
                                            style={{ borderColor: 'black', position: 'relative' }}
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

                        <Row className="mt-2 w-full" justify="center">
                            <Col className="flex">
                                <Typography.Text className="text-base font-light px-3">
                                    Airline PNR:
                                    <Typography.Text className="font-medium">{` ${booking?.pnr} ${booking?.inbountPnr ? `, ${booking?.inbountPnr}` : ''}`}</Typography.Text>
                                </Typography.Text>
                                <Typography.Text className="text-base font-light px-3">
                                    Confirmation Number:
                                    <Typography.Text className="font-medium">{` ${booking?.bookingId}  ${booking?.inbountBookingId ? `, ${booking?.inbountBookingId}` : ''}`}</Typography.Text>
                                </Typography.Text>
                                <Typography.Text className="text-base font-light px-3">
                                    Booking Date:
                                    <Typography.Text className="font-medium">{` ${booking?.bookingDate && formattedDateTime(new Date(booking.bookingDate))}`}</Typography.Text>
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>

                    <Col
                        span={24}
                        xl={4}
                        className="flex items-center justify-center md: mb-4 xl:flex-col mx-auto gap-4"
                    >
                        {booking.status === 'Failed' && (
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
                                danger
                                className="w-40 flex justify-center"
                                style={{ borderRadius: '0.125rem' }}
                                onClick={onDownloadTicket}
                                type="primary"
                            >
                                Download Booking
                            </Button>
                        )}
                        {showDownloadAndManageBooking && (
                            <Button
                                danger
                                className="w-40 flex justify-center"
                                loading={false}
                                style={{ borderRadius: '0.125rem' }}
                                onClick={onModifyCancel}
                            >
                                View/Manage Booking
                            </Button>
                        )}
                        {/* {booking.status === 'OK_TO_TICKET' && (
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
                        )} */}
                    </Col>
                </Row>
            </Card>
        </Col>
    );
};

export default WebBookingCard;
