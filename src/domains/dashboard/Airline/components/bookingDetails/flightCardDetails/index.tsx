import type { FC } from 'react';

import { ArrowRightOutlined } from '@ant-design/icons';
import { Badge, Flex, Typography } from 'antd';
import moment from 'moment';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import FlightCardDetailsAdaptive from './Adaptive';
import FlightCardDetailsWeb from './Web';
import { retrieveAirport } from '../../../utils/airlineData';
import { calculateDuration, formatDurationToHourMinute } from '../../../utils/formatDateCode';
// import { retrieveFlightClass } from '../../../utils/getFlightClass';
// import FlightCardDetailsWeb from './Web';
// import { convertTimeFormat } from '../../../utils/formatDateCode';

interface FlightCardDetailsProps {}
const FlightCardDetails: FC<FlightCardDetailsProps> = () => {
    const { journey } = useAppSelector(state => state.reducer.airline.orderDetails);
    const { md } = useScreenSize();

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

    return (
        <>
            {groupedJourney &&
                groupedJourney.map((item, i: number) => {
                    const firstSegment = item[0];
                    const lastSegment = item[item.length - 1];
                    return (
                        <Flex key={i} vertical>
                            <Flex className="w-full p-0 mb-5" gap={5} vertical>
                                <Typography.Text className="text-base sm:text-lg md:text-2xl font-medium">
                                    {retrieveAirport(firstSegment.Origin.Airport.AirportCode)}{' '}
                                    <ArrowRightOutlined className="text-xl font-light" />{' '}
                                    {retrieveAirport(lastSegment.Destination.Airport.AirportCode)}
                                </Typography.Text>
                                <Typography.Text className="text-sm">
                                    {moment(firstSegment.Origin.DepTime).format('ddd, DD MMM')}
                                    <Badge dot color="#111" className="mx-1" />
                                    {/* {item.length === 1 ? 'Non stop' : `${item.length - 1} Stop`} */}
                                    {/* {item.flight.stopQuantity === 0
                                    ? 'Non stop'
                                    : `${item.flight.stopQuantity} Stop`} */}
                                    {formatDurationToHourMinute(calculateDuration(item))}
                                    {/* <Badge dot color="#111" className="mx-1" />
                                    <Typography.Text className="text-sm ml-1">
                                        {retrieveFlightClass(firstSegment.CabinClass)}
                                    </Typography.Text> */}
                                </Typography.Text>
                            </Flex>

                            {md ? (
                                <FlightCardDetailsWeb item={item} />
                            ) : (
                                <FlightCardDetailsAdaptive item={item} />
                            )}
                        </Flex>
                    );
                })}
        </>
    );
};

export default FlightCardDetails;
