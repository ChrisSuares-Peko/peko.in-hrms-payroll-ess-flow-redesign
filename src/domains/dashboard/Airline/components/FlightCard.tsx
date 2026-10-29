import React from 'react';

import { Card, Col, Divider, Flex, Image, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import FlightDurationBadge from './FlightDurationBadge';
import LayoverTooltip from './LayoverTooltip';
import { Flight } from '../types/Flight';
import { retrieveAirlineName, retrieveAirport, retrieveAirportName } from '../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../utils/dateTime';
import { calculateDuration, formatStopQuantityWithCities } from '../utils/formatDateCode';
import { findLastSegment, retrieveFlightClass } from '../utils/getFlightClass';

type Props = {
    isRefundable: boolean;
};
const FlightCard = ({ isRefundable }: Props) => {
    // @ts-ignore
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    ) as Flight;

    const formData = useAppSelector(state => state.reducer.airline.searchData);
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const journeys = [...selectedAirline.journey];
    if (selectedInbountAirline?.journey && selectedInbountAirline.journey.length !== 0) {
        journeys.push(...selectedInbountAirline.journey);
    }
    return (
        <Card
            bodyStyle={{ padding: 0 }}
            className="rounded-[28px] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
        >
            <Row className="justify-between p-6 pb-2 gap-4">
                <Col className="flex gap-4 items-center h-14">
                    <Image preview={false} width={80} src={selectedAirline.logo} />
                    <Typography.Text className="capitalize">
                        {capitalizeFirstLetter(retrieveAirlineName(selectedAirline.flightCode))}
                    </Typography.Text>
                </Col>
                <Col className="flex gap-4 items-center">
                    <Typography.Text>{retrieveFlightClass(formData.class)}</Typography.Text>
                    {isRefundable && (
                        <Flex className="bg-tagColor text-brandColor px-2 rounded-full">
                            Partially Refundable
                        </Flex>
                    )}
                </Col>
            </Row>
            <Divider className="border-t-1 rounded-full" />
            {journeys.map((item, index) => (
                <Row
                    className="mb-10 px-6 pt-3 w-full"
                    justify="space-between"
                    align="middle"
                    key={index}
                >
                    <>
                        <Col span={4} className="flex flex-col items-start ">
                            <Typography.Text className="font-bold md:text-xl xxl:text-2xl">
                                {item[0].Origin.Airport.AirportCode}
                            </Typography.Text>
                            <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                                {retrieveAirport(item[0].Origin.Airport.AirportCode)}
                            </Typography.Text>
                            <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-2">
                                {retrieveAirportName(item[0].Origin.Airport.AirportCode)}
                            </Typography.Text>
                            <Typography.Text className="text-gray-400 md:text-xs xxl:text-sm font-normal line-clamp-1">
                                Terminal {item[0].Origin.Airport.Terminal}
                            </Typography.Text>
                        </Col>
                        <Col span={5} className="flex flex-col items-center">
                            <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                                Departure
                            </Typography.Text>
                            <Typography.Text className="font-bold text-xl mt-1">
                                {formattedTimeOnly(new Date(item[0].Origin.DepTime))}
                            </Typography.Text>
                            <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                                {formattedDateOnly(new Date(item[0].Origin.DepTime))}
                            </Typography.Text>
                        </Col>
                        <Col span={5} className="flex flex-col items-center justify-center">
                            <>
                                <FlightDurationBadge duration={calculateDuration(item)} />
                                <LayoverTooltip segments={item}>
                                    <Typography.Text className="text-gray-500 text-base mt-2">
                                        {formatStopQuantityWithCities(item)}
                                    </Typography.Text>
                                </LayoverTooltip>
                            </>
                        </Col>
                        <Col span={5} className="flex flex-col items-center">
                            <Typography.Text className="text-gray-400 md:text-sm xxl:text-base font-normal">
                                Arrival
                            </Typography.Text>
                            <Typography.Text className="font-bold text-xl mt-1">
                                {formattedTimeOnly(
                                    new Date(findLastSegment(item).Destination.ArrTime)
                                )}
                            </Typography.Text>
                            <Typography.Text className="md:text-sm xxl:text-sm font-normal">
                                {formattedDateOnly(
                                    new Date(findLastSegment(item).Destination.ArrTime)
                                )}
                            </Typography.Text>
                        </Col>
                        <Col span={4} className="flex flex-col items-end">
                            <Typography.Text className="font-bold md:text-xl xxl:text-2xl">
                                {findLastSegment(item).Destination.Airport.AirportCode}
                            </Typography.Text>
                            <Typography.Text className="md:text-sm xxl:text-base font-normal line-clamp-1">
                                {retrieveAirport(
                                    findLastSegment(item).Destination.Airport.AirportCode
                                )}
                            </Typography.Text>
                            <Typography.Text className="md:text-sm xxl:text-base font-normal text-end line-clamp-2">
                                {retrieveAirportName(
                                    findLastSegment(item).Destination.Airport.AirportCode
                                )}
                            </Typography.Text>
                            <Typography.Text className="text-gray-400 md:text-xs xxl:text-sm font-normal line-clamp-1">
                                Terminal {findLastSegment(item).Destination.Airport.Terminal}
                            </Typography.Text>
                        </Col>
                    </>
                </Row>
            ))}
        </Card>
    );
};

export default FlightCard;
