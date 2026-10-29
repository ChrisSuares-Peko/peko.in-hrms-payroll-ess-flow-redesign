import React from 'react';

import { ArrowDownOutlined } from '@ant-design/icons';
import { Row, Col, Divider, Typography, Flex } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { retrieveAirport, retrieveAirportName } from '../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../utils/dateTime';
import { calculateDuration, formatDurationToHourMinute } from '../utils/formatDateCode';

type Props = {};

const AirlineDetailsCardAdaptive: React.FC<Props> = () => {
    const { selectedAirline: airlineData, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    const journeys = [...airlineData.journey];
    if (selectedInbountAirline?.journey && selectedInbountAirline.journey.length !== 0) {
        journeys.push(...selectedInbountAirline.journey);
    }
    return (
        <>
            {journeys.map((journey, index) => {
                const departureSegment = journey[0];
                const arrivalSegment = journey[journey.length - 1];
                const duration = calculateDuration(journey);
                return (
                    <React.Fragment key={index}>
                        <Row className="mb-3 border border-solid p-4" justify="space-between">
                            <Col span={9} className="flex flex-col items-start ">
                                <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                    {formattedTimeOnly(new Date(departureSegment.Origin.DepTime))}
                                </Typography.Text>
                                <Typography.Text className="text-gray-400 text-xs xs375:text-[.91rem] sm:text-base text-start">
                                    {formattedDateOnly(new Date(departureSegment.Origin.DepTime))}
                                </Typography.Text>
                                <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                    {departureSegment.Origin.Airport.AirportCode}
                                </Typography.Text>
                                <Typography.Text className="font-bold text-sm">
                                    {
                                        retrieveAirport(
                                            departureSegment.Origin.Airport.AirportCode
                                        ).split(',')[0]
                                    }
                                </Typography.Text>
                                <Typography.Text className="text-gray-400 text-[0.65rem] text-start">
                                    {retrieveAirportName(
                                        departureSegment.Origin.Airport.AirportCode
                                    )}{' '}
                                </Typography.Text>
                                <Typography.Text className="text-xs font-normal text-gray-400">
                                    Terminal {departureSegment.Origin.Airport.Terminal || 'N/A'}
                                </Typography.Text>
                            </Col>
                            <Col
                                span={6}
                                className="flex flex-col items-start xs375:items-center justify-center"
                            >
                                <Typography.Text className="text-gray-400 text-xs text-center">
                                    {formatDurationToHourMinute(duration)}
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
                                    {journey.length === 1
                                        ? 'Non stop'
                                        : `${journey.length - 1} Stop`}
                                </Typography.Text>
                            </Col>
                            <Col span={9} className="flex flex-col items-start xs375:items-end ">
                                <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                    {formattedTimeOnly(
                                        new Date(arrivalSegment.Destination.ArrTime)
                                    )}
                                </Typography.Text>
                                <Typography.Text className="text-gray-400 text-xs xs375:text-[.91rem] sm:text-base">
                                    {formattedDateOnly(
                                        new Date(arrivalSegment.Destination.ArrTime)
                                    )}
                                </Typography.Text>
                                <Typography.Text className="text-lg font-extrabold text-center mt-1">
                                    {arrivalSegment.Destination.Airport.AirportCode}
                                </Typography.Text>
                                <Typography.Text className="font-bold text-sm">
                                    {
                                        retrieveAirport(
                                            arrivalSegment.Destination.Airport.AirportCode
                                        ).split(',')[0]
                                    }
                                </Typography.Text>
                                <Typography.Text className="text-gray-400 text-[0.65rem] ">
                                    {retrieveAirportName(
                                        arrivalSegment.Destination.Airport.AirportCode
                                    )}{' '}
                                </Typography.Text>
                                <Typography.Text className="text-xs font-normal text-gray-400 text-right">
                                    Terminal {arrivalSegment.Destination.Airport.Terminal || 'N/A'}
                                </Typography.Text>
                            </Col>
                        </Row>
                        {index < airlineData.journey.length - 1 && (
                            <Divider
                                dashed
                                style={{
                                    borderColor: 'black',
                                    fontSize: '16px',
                                    position: 'relative',
                                    margin: '20px 0',
                                }}
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
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default AirlineDetailsCardAdaptive;
