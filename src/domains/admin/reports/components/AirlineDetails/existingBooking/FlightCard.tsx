import { Card, Col, Divider, Image, Row, Typography } from 'antd';

import { retrieveAirlineName, retrieveAirport } from '../../../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../../../utils/dateTime';

type props = {
    journey: any;
    ticketDocument: any;
    bookingReferenceId: any;
};
const FlightCard = ({ bookingReferenceId, journey, ticketDocument }: props) => {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    return (
        <Card bodyStyle={{ padding: 0 }} className="rounded-md">
            <Row className="justify-between p-6 pb-2 gap-4">
                <Col className="flex gap-4 items-center">
                    <Image
                        preview={false}
                        height={45}
                        src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${ticketDocument[0]?.airlineLocators[0]?.airline}.gif?alt=media`}
                    />
                    <Typography.Text className="capitalize">
                        {capitalizeFirstLetter(
                            retrieveAirlineName(ticketDocument[0]?.airlineLocators[0]?.airline)
                        )}
                    </Typography.Text>
                </Col>
                {/* <Col className="flex gap-4 items-center">
                    <Flex className="bg-tagColor text-brandColor px-2 rounded-full">
                        Partially Refundable
                    </Flex>
                </Col> */}
            </Row>
            <Divider className="border-t-1 rounded-full" />
            {journey.map((item: any, index: any) => (
                <Row className="mb-10 px-6 pt-6 w-full " justify="space-between" align="middle">
                    <Col span={12} md={4} className="flex flex-col items-start ">
                        <Typography.Text className="font-bold md:text-xl xxl:text-2xl">
                            {item.flight.segmentReference.onPoint}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                            {retrieveAirport(item.flight.segmentReference.onPoint)}
                        </Typography.Text>
                    </Col>
                    <Col span={12} md={5} className="flex flex-col items-end  md:items-center">
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                            Departure
                        </Typography.Text>
                        <Typography.Text className="font-bold text-xl mt-1">
                            {formattedTimeOnly(
                                new Date(
                                    item?.flightSegments[index]?.departureDateTime ??
                                        item?.flightSegments[0]?.departureDateTime
                                )
                            )}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                            {formattedDateOnly(
                                new Date(
                                    item?.flightSegments[index]?.departureDateTime ??
                                        item?.flightSegments[0]?.departureDateTime
                                )
                            )}
                        </Typography.Text>
                    </Col>
                    <Col span={24} md={5} className="flex flex-col items-center justify-center">
                        <Typography.Text className="text-gray-500 text-base mt-2">
                            {item.flight.stopQuantity > 0
                                ? `${item.flight.stopQuantity} Stop`
                                : `Non stop`}
                        </Typography.Text>
                    </Col>
                    <Col span={12} md={5} className="flex flex-col items-start  md:items-center">
                        <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                            Arrival
                        </Typography.Text>
                        <Typography.Text className="font-bold text-xl mt-1">
                            {formattedTimeOnly(
                                new Date(
                                    // eslint-disable-next-line no-unsafe-optional-chaining
                                    item?.flightSegments[item?.flightSegments.length - 1]
                                        ?.arrivalDateTime ??
                                        item?.flightSegments[0]?.arrivalDateTime
                                )
                            )}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                            {formattedDateOnly(
                                new Date(
                                    // eslint-disable-next-line no-unsafe-optional-chaining
                                    item?.flightSegments[item?.flightSegments.length - 1]
                                        ?.arrivalDateTime ??
                                        item?.flightSegments[0]?.arrivalDateTime
                                )
                            )}
                        </Typography.Text>
                    </Col>
                    <Col span={12} md={4} className="flex flex-col items-end">
                        <Typography.Text className="font-bold md:text-xl xxl:text-2xl">
                            {item.flight.segmentReference.offPoint}
                        </Typography.Text>
                        <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                            {retrieveAirport(item.flight.segmentReference.offPoint)}
                        </Typography.Text>
                    </Col>
                </Row>
            ))}
            {/* <Row className="my-6 w-full" justify="center">
                <Col className="flex">
                    <Typography.Text className="text-base font-light px-3">
                        Airline Booking Code:
                        <Typography.Text className="font-medium">
                            {ticketDocument[0]?.airlineLocators[0]?.airlineLocator}
                        </Typography.Text>
                    </Typography.Text>
                    <Typography.Text className="text-base font-light px-3">
                        Confirmation number:
                        <Typography.Text className="font-medium">
                            {bookingReferenceId}
                        </Typography.Text>
                    </Typography.Text>
                </Col>
            </Row> */}
        </Card>
    );
};

export default FlightCard;
