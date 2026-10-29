import { Button, Card, Col, Divider, Image, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { Journey } from '../../types/airlineList';
import { retrieveAirport } from '../../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../../utils/dateTime';

const FlightCard = () => {
    const navigate = useNavigate();

    const orderDetails = useAppSelector(state => state.reducer.airline.orderDetails);

    const { journey } = orderDetails;
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const isDomesticRoundTrip = !!orderDetails.inbountPNR;
    const groupedJourney = [];
    for (let i = 1; i <= 2; i += 1) {
        let segments = journey.filter(j => j.TripIndicator === i);
        if (segments.length === 0) break;
        segments = segments.sort((a, b) => {
            if (a.SegmentIndicator && b.SegmentIndicator) {
                return a.SegmentIndicator - b.SegmentIndicator;
            }
            return 0;
        });
        groupedJourney.push(segments);
    }

    const airlineDetails = journey[0]?.Airline;

    function isUpcoming(item: Journey[]) {
        const date = item[0].Origin.DepTime;
        const dateObj = new Date(date);
        return new Date() < dateObj;
    }

    function isOrderCancelable(index: number) {
        if (index === 0) {
            return orderDetails.bookingStatus === 'Successful';
        }
        return orderDetails.inbountBookingStatus === 'Successful';
    }

    return (
        <Card bodyStyle={{ padding: 0 }} className="rounded-md">
            <Row className="justify-between p-6 pb-2 gap-4">
                <Col className="flex gap-4 items-center">
                    <Image
                        preview={false}
                        height={45}
                        src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${airlineDetails?.AirlineCode}.gif?alt=media`}
                    />
                    <Typography.Text className="capitalize">
                        {capitalizeFirstLetter(airlineDetails?.AirlineName)}
                    </Typography.Text>
                </Col>
                {/* <Col className="flex gap-4 items-center">
                    <Flex className="bg-tagColor text-brandColor px-2 rounded-full">
                        Partially Refundable
                    </Flex>
                </Col> */}
            </Row>
            <Divider className="border-t-1 rounded-full" />
            {groupedJourney.map((item: any, index: any) => {
                const firstFlight = item[0];
                const lastFlight = item[item.length - 1];
                return (
                    <Row
                        className="mb-10 px-2 xs375:px-6 pt-6 w-full "
                        justify="space-between"
                        align="middle"
                    >
                        <Col flex="auto">
                            <Row justify="space-between" align="middle">
                                <Col span={12} md={4} className="flex flex-col items-start ">
                                    <Typography.Text className="font-bold md:text-xl xxl:text-2xl">
                                        {firstFlight.Origin.Airport.AirportCode}
                                    </Typography.Text>
                                    <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                                        {retrieveAirport(firstFlight.Origin.Airport.AirportCode)}
                                    </Typography.Text>
                                </Col>
                                <Col
                                    span={12}
                                    md={5}
                                    className="flex flex-col items-end  md:items-center"
                                >
                                    <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                                        Departure
                                    </Typography.Text>
                                    <Typography.Text className="font-bold text-xl mt-1">
                                        {formattedTimeOnly(new Date(firstFlight.Origin.DepTime))}
                                    </Typography.Text>
                                    <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                                        {formattedDateOnly(new Date(firstFlight.Origin.DepTime))}
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-400 sm:block xs:text-[.7rem] md:text-sm">
                                        {firstFlight.Origin.Airport.AirportName}
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                        Terminal {firstFlight.Origin.Airport.Terminal}
                                    </Typography.Text>
                                </Col>
                                <Col
                                    span={24}
                                    md={5}
                                    className="flex flex-col items-center justify-center"
                                >
                                    <Typography.Text className="text-gray-500 md:text-sm lg:text-base font-normal mt-2">
                                        {item.length === 1 ? 'Non stop' : `${item.length - 1} stop`}
                                    </Typography.Text>
                                </Col>
                                <Col
                                    span={12}
                                    md={5}
                                    className="flex flex-col items-start  md:items-center"
                                >
                                    <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                                        Arrival
                                    </Typography.Text>
                                    <Typography.Text className="font-bold text-xl mt-1">
                                        {formattedTimeOnly(
                                            new Date(lastFlight.Destination.ArrTime)
                                        )}
                                    </Typography.Text>
                                    <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                                        {formattedDateOnly(
                                            new Date(lastFlight.Destination.ArrTime)
                                        )}
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-400 sm:block xs:text-[.7rem] md:text-sm">
                                        {lastFlight.Destination.Airport.AirportName}
                                    </Typography.Text>
                                    <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                                        Terminal {lastFlight.Destination.Airport.Terminal}
                                    </Typography.Text>
                                </Col>
                                <Col span={12} md={4} className="flex flex-col items-end">
                                    <Typography.Text className="font-bold md:text-xl xxl:text-2xl">
                                        {lastFlight.Destination.Airport.AirportCode}
                                    </Typography.Text>
                                    <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                                        {retrieveAirport(
                                            lastFlight.Destination.Airport.AirportCode
                                        )}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>
                        {isDomesticRoundTrip && (
                            <Col xs={24} md={4} className="flex flex-col items-end mt-2">
                                {isUpcoming(item) && (
                                    <Button
                                        danger
                                        disabled={!isOrderCancelable(index)}
                                        onClick={() =>
                                            navigate(
                                                `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}/${paths.airline.bookingDetails}/${paths.airline.cancelDetails}`,
                                                {
                                                    state: {
                                                        bookingId:
                                                            index === 0
                                                                ? orderDetails.BookingId
                                                                : orderDetails.inbountBookingId,
                                                    },
                                                }
                                            )
                                        }
                                    >
                                        Cancel Booking
                                    </Button>
                                )}
                            </Col>
                        )}
                    </Row>
                );
            })}
            <Row className="my-6 w-full sm:justify-center">
                <Col className="flex flex-col sm:flex-row ">
                    <Typography.Text className="text-base font-light px-3">
                        Airline PNR:{' '}
                        <Typography.Text className="font-medium">
                            {orderDetails.PNR}
                        </Typography.Text>
                    </Typography.Text>
                    <Typography.Text className="text-base font-light px-3">
                        Confirmation Number:{' '}
                        <Typography.Text className="font-medium">
                            {` ${orderDetails.BookingId}`}
                        </Typography.Text>
                    </Typography.Text>
                </Col>
            </Row>
        </Card>
    );
};

export default FlightCard;
