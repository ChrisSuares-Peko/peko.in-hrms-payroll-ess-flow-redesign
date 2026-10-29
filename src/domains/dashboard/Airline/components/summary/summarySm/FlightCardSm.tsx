import React, { useState } from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Card, Col, Divider, Flex, Row, Typography } from 'antd';

import { formattedDateOnly } from '@utils/dateFormat';

import DynamicImageCardSm from './DynamicImageCardSm';
import { SelectedAirline } from '../../../types/slices';
import { retrieveAirport } from '../../../utils/airlineData';
import { formattedTimeOnly } from '../../../utils/dateTime';
import { calculateDuration, formatDurationToHourMinute } from '../../../utils/formatDateCode';
import { findLastSegment } from '../../../utils/getFlightClass';
import FlightInfoDrawer from '../../FlightInfoDrawer';

const FlightCardSm = ({
    selectedAirline,
    selectedInbountAirline,
}: {
    selectedAirline: SelectedAirline;
    selectedInbountAirline: SelectedAirline;
}) => {
    const [openDrawer, setOpenDrawer] = useState(false);

    let { journey } = selectedAirline;
    if (selectedInbountAirline && selectedInbountAirline.journey) {
        journey = [...journey, ...selectedInbountAirline.journey];
    }
    return (
        <Card
            styles={{ body: { padding: 0 } }}
            className="rounded-md shadow-[0px_4px_8px_rgba(0,0,0,0.15)]"
        >
            {journey.map((item: any, index: any) => (
                <React.Fragment
                    key={`${item?.[0]?.Airline?.AirlineCode || 'SEG'}-${item?.[0]?.Airline?.FlightNumber || 'FL'}-${item?.[0]?.Origin?.DepTime || index}`}
                >
                    <Row className="flex flex-col border-0 h-18 px-2 py-1  w-full  bg-[#FFF7F6] border-b">
                        <DynamicImageCardSm item={item[0]} />
                    </Row>
                    <Row
                        className="mb-3 px-4 pt-3 w-full border-b pb-4"
                        justify="space-between"
                        align="middle"
                    >
                        <Col span={9} className="flex flex-col items-start">
                            {/* <Text className="text-[1.1rem] font-[500] whitespace-nowrap mt-2 ">
                                {wordsFormattedDateOnly(new Date(item[0].Origin.DepTime))}
                            </Text> */}
                            <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                {formattedTimeOnly(new Date(item[0].Origin.DepTime))}
                            </Typography.Text>
                            <Typography.Text className="text-gray-400 text-xs xs375:text-[.91rem] sm:text-base  text-start">
                                {formattedDateOnly(new Date(item[0].Origin.DepTime))}
                            </Typography.Text>
                            <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                {item[0].Origin.Airport.AirportCode}
                            </Typography.Text>
                            <Typography.Text className="font-bold text-sm">
                                {retrieveAirport(item[0].Origin.Airport.AirportCode)}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal text-gray-400">
                                Terminal {item[0].Origin.Airport.Terminal || 'N/A'}
                            </Typography.Text>
                        </Col>

                        <Col span={6} className="flex flex-col items-center justify-center">
                            <Typography.Text className="text-gray-400 text-xs text-center">
                                {formatDurationToHourMinute(calculateDuration(item))}
                            </Typography.Text>
                            <Flex className="w-[2.9rem]" justify="center">
                                <Divider
                                    className="m-1"
                                    dashed
                                    style={{
                                        borderColor: 'red',
                                    }}
                                />
                            </Flex>
                            <Typography.Text className="text-gray-400 text-xs">
                                {item.length === 1 ? 'Non stop' : `${item.length - 1} stop`}
                            </Typography.Text>
                        </Col>
                        <Col span={9} className="flex flex-col items-end ">
                            <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                {formattedTimeOnly(
                                    new Date(findLastSegment(item).Destination.ArrTime)
                                )}
                            </Typography.Text>
                            <Typography.Text className="text-gray-400 text-xs xs375:text-[.91rem] sm:text-base  text-start">
                                {formattedDateOnly(
                                    new Date(findLastSegment(item).Destination.ArrTime)
                                )}
                            </Typography.Text>
                            <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                {findLastSegment(item).Destination.Airport.AirportCode}
                            </Typography.Text>
                            <Typography.Text className="font-bold text-sm">
                                {retrieveAirport(
                                    findLastSegment(item).Destination.Airport.AirportCode
                                )}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal text-gray-400">
                                Terminal{' '}
                                {findLastSegment(item).Destination.Airport.Terminal || 'N/A'}
                            </Typography.Text>
                        </Col>
                    </Row>
                </React.Fragment>
            ))}

            <Flex className="w-full px-4 my-5 justify-center">
                <Typography.Text
                    onClick={() => setOpenDrawer(true)}
                    className="text-red-500 cursor-pointer font-medium flex justify-center items-center  me-1"
                >
                    Flight Details <RightOutlined className="ms-1" />
                </Typography.Text>
            </Flex>
            <FlightInfoDrawer
                handleClose={() => setOpenDrawer(false)}
                selectedInbountAirline={selectedInbountAirline}
                flightDetails={selectedAirline}
                isDrawerOpen={openDrawer}
            />
        </Card>
    );
};

export default FlightCardSm;
