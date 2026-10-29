import type { FC } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Badge, Card, Col, Divider, Flex, Image, Row, Typography } from 'antd';
import moment from 'moment';

import FlightDurationBadge from './FlightDurationBadge';
import { retrieveAirlineName, retrieveAirport } from '../../../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../../../utils/dateTime';
import { convertTimeFormat } from '../../../utils/formatDateCode';

interface FlightCardDetailsProps {
    journey: any;
}
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
const FlightCardDetails: FC<FlightCardDetailsProps> = ({ journey }) => (
    <>
        {journey &&
            journey.map((item: any, i: number) => (
                <Flex key={i} vertical>
                    <Flex className="mb-5" gap={5} vertical>
                        <Typography.Text className="text-2xl font-medium">
                            {retrieveAirport(item.flight.segmentReference.onPoint)}{' '}
                            <ArrowRightOutlined className="text-xl font-light" />{' '}
                            {retrieveAirport(item.flight.segmentReference.offPoint)}
                        </Typography.Text>
                        <Typography.Text className="text-sm">
                            {moment(item.flightSegments[0].departureDateTime).format('ddd, DD MMM')}
                            <Badge dot color="#111" className="mx-1" />
                            {item.flight.stopQuantity} Stop
                            {item.flight.flightInfo.duration && (
                                <>
                                    <Badge dot color="#111" className="mx-1" />
                                    {convertTimeFormat(item.flight.flightInfo.duration)}
                                </>
                            )}
                            {/* {flightDetails.lcc && (
                                    <>
                                        <Badge dot color="#111" className="mx-1" />
                                        LCC
                                    </>
                                )} */}
                        </Typography.Text>
                    </Flex>
                    <Card className="my-6" size="small">
                        {item?.flightSegments?.map((ele: any, index: number) => (
                            <Col key={index} className="mb-5" span={24}>
                                <Card className="border-0 rounded-3xl ">
                                    <Row justify="space-between">
                                        <Col
                                            xs={24}
                                            lg={4}
                                            className="border-0 rounded-2xl flex flex-col items-center justify-center bg-red_50 p-1"
                                        >
                                            <Image
                                                preview={false}
                                                width={120}
                                                alt={ele.operatingAirline}
                                                src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${ele.operatingAirline}.gif?alt=media`}
                                            />
                                            <Typography.Text className="capitalize text-center mt-2 font-medium">
                                                {capitalizeFirstLetter(
                                                    retrieveAirlineName(ele?.operatingAirline)
                                                )}
                                            </Typography.Text>
                                            <Typography.Text className="capitalize text-center md:text-xs">
                                                {ele?.operatingAirline}-{ele?.flightNumber}
                                            </Typography.Text>
                                        </Col>
                                        <Col xs={10} lg={4} className="w-full h-full">
                                            <Flex
                                                className="w-full h-full  mt-2"
                                                justify="center"
                                                align="start"
                                                vertical
                                            >
                                                <Typography.Text className="text-gray-400 text-sm font-normal">
                                                    {formattedDateOnly(
                                                        new Date(ele.departureDateTime)
                                                    )}
                                                </Typography.Text>
                                                <Typography.Text className="font-bold text-xl mt-2">
                                                    {formattedTimeOnly(
                                                        new Date(ele.departureDateTime)
                                                    )}
                                                </Typography.Text>
                                                <Typography.Text className="text-gray-400 text-xs mt-2 font-normal">
                                                    {ele.departureAirportCode}
                                                    {' - '}
                                                    {retrieveAirport(ele.departureAirportCode)}
                                                </Typography.Text>
                                            </Flex>
                                        </Col>
                                        <Col
                                            xs={4}
                                            lg={6}
                                            className="flex flex-col items-center justify-center"
                                        >
                                            <FlightDurationBadge duration={ele.duration} />
                                        </Col>
                                        <Col xs={10} lg={4} className="w-full h-full mt-2">
                                            <Flex
                                                className="w-full h-full  mt-2"
                                                vertical
                                                justify="center"
                                                align="end"
                                            >
                                                <Typography.Text className="text-gray-400 text-sm font-normal">
                                                    {formattedDateOnly(
                                                        new Date(ele.arrivalDateTime)
                                                    )}
                                                </Typography.Text>
                                                <Typography.Text className="font-bold text-xl mt-2">
                                                    {formattedTimeOnly(
                                                        new Date(ele.arrivalDateTime)
                                                    )}
                                                </Typography.Text>
                                                <Typography.Text className="text-gray-400 text-xs mt-2 font-normal text-end">
                                                    {ele.arrivalAirportCode} {' - '}
                                                    {retrieveAirport(ele.arrivalAirportCode)}
                                                </Typography.Text>
                                            </Flex>
                                        </Col>
                                        <Col xs={24} lg={3} className="w-full h-full">
                                            <Flex
                                                vertical
                                                justify="center"
                                                align="center"
                                                className="w-full h-full mt-2"
                                            >
                                                <Typography.Text className="text-gray-400 text-sm font-normal">
                                                    Cabin Class
                                                </Typography.Text>
                                                <Typography.Text className="font-medium text-xl mt-2">
                                                    {ele.cabinClass}
                                                </Typography.Text>
                                            </Flex>
                                        </Col>
                                    </Row>
                                </Card>
                                <Divider dashed />
                            </Col>
                        ))}
                    </Card>
                </Flex>
            ))}
    </>
);

export default FlightCardDetails;
