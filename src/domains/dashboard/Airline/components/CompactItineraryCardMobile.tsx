import { Fragment } from 'react';

import { Card, Col, Flex, Image, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import DurationBadgeSm from './bookingDetails/flightCardDetails/DurationBadgeSm';
import LayoverDivider from './LayoverDivider';
import { Journey } from '../types/airlineList';
import { retrieveAirlineName, retrieveAirport, retrieveAirportName } from '../utils/airlineData';
import { formattedTimeOnly } from '../utils/dateTime';
import {
    calculateDuration,
    findCabilClass,
    formatDurationToHourMinute,
} from '../utils/formatDateCode';

const { Text } = Typography;

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

function formatWeight(weight: string) {
    if (!weight) return '';
    return weight.replace('Kilograms', ' kg').replace('KG', ' kg');
}

const SegmentBlock = ({ segment }: { segment: Journey }) => (
    <div className="py-2">
        <Flex vertical align="center" justify="center" gap={2} className="mb-3">
            <Image
                preview={false}
                width={36}
                alt={segment.Airline.AirlineCode}
                src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${segment.Airline.AirlineCode}.gif?alt=media`}
            />
            <Text className="text-xs font-semibold capitalize text-center">
                {capitalizeFirstLetter(retrieveAirlineName(segment.Airline.AirlineCode))}
            </Text>
            <Text className="text-[0.65rem] text-gray-400 text-center">
                {segment.Airline.AirlineCode}-{segment.Airline.FlightNumber}
            </Text>
        </Flex>

        <Row align="middle">
            <Col span={8} className="min-w-0">
                <Flex vertical className="min-w-0">
                    <Text className="text-base font-bold leading-tight">
                        {formattedTimeOnly(new Date(segment.Origin.DepTime))}
                    </Text>
                    <Text className="text-[0.65rem] text-gray-600 w-full truncate block">
                        {segment.Origin.Airport.AirportCode} ·{' '}
                        {retrieveAirportName(segment.Origin.Airport.AirportCode)}
                    </Text>
                    <Text className="text-[0.65rem] text-gray-400 w-full truncate block">
                        {dayjs(segment.Origin.DepTime).format('DD MMM')} · Terminal{' '}
                        {segment.Origin.Airport.Terminal || 'N/A'}
                    </Text>
                </Flex>
            </Col>
            <Col span={8} className="flex justify-center items-center">
                <DurationBadgeSm duration={segment.Duration} />
            </Col>
            <Col span={8} className="min-w-0">
                <Flex vertical align="end" className="min-w-0 w-full">
                    <Text className="text-base font-bold leading-tight">
                        {formattedTimeOnly(new Date(segment.Destination.ArrTime))}
                    </Text>
                    <Text className="text-[0.65rem] text-gray-600 w-full truncate block text-right">
                        {segment.Destination.Airport.AirportCode} ·{' '}
                        {retrieveAirportName(segment.Destination.Airport.AirportCode)}
                    </Text>
                    <Text className="text-[0.65rem] text-gray-400 w-full truncate block text-right">
                        {dayjs(segment.Destination.ArrTime).format('DD MMM')} · Terminal{' '}
                        {segment.Destination.Airport.Terminal || 'N/A'}
                    </Text>
                </Flex>
            </Col>
        </Row>

        <Flex gap={12} wrap="wrap" className="text-[0.65rem] text-gray-500 mt-3">
            {segment.CabinClass && (
                <Text className="capitalize">
                    {findCabilClass(segment.CabinClass as 1 | 2 | 3 | 4 | 5 | 6)}
                </Text>
            )}
            {segment.Baggage && <Text>Check-In {formatWeight(segment.Baggage)}</Text>}
            {segment.CabinBaggage && <Text>Cabin {formatWeight(segment.CabinBaggage)}</Text>}
        </Flex>
    </div>
);

const JourneyBlock = ({ segments }: { segments: Journey[] }) => {
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const stopCount = segments.length - 1;

    return (
        <Card size="small" className="rounded-2xl mb-3" styles={{ body: { padding: 12 } }}>
            <Flex vertical className="bg-gray-50 px-3 py-2 rounded-lg mb-2" gap={2}>
                <Text className="text-sm font-semibold">
                    {retrieveAirport(firstSegment.Origin.Airport.AirportCode)} →{' '}
                    {retrieveAirport(lastSegment.Destination.Airport.AirportCode)}
                </Text>
                <Text className="text-[0.65rem] text-gray-500">
                    {dayjs(firstSegment.Origin.DepTime).format('ddd, DD MMM')} ·{' '}
                    {stopCount === 0 ? 'Non stop' : `${stopCount} stop`} ·{' '}
                    {formatDurationToHourMinute(calculateDuration(segments))}
                </Text>
            </Flex>

            {segments.map((seg, i) => (
                <Fragment key={i}>
                    <SegmentBlock segment={seg} />
                    <LayoverDivider nextSegment={segments[i + 1]} prevSegment={seg} />
                </Fragment>
            ))}
        </Card>
    );
};

const CompactItineraryCardMobile = () => {
    // @ts-ignore
    const { selectedAirline, selectedInbountAirline } = useAppSelector(
        state => state.reducer.airline
    );

    if (!selectedAirline?.journey?.length) return null;

    const journeys = [...selectedAirline.journey] as Journey[][];
    if (selectedInbountAirline?.journey?.length) {
        journeys.push(...(selectedInbountAirline.journey as Journey[][]));
    }

    return (
        <div className="w-full">
            {journeys.map((segments, i) => (
                <JourneyBlock key={i} segments={segments} />
            ))}
        </div>
    );
};

export default CompactItineraryCardMobile;
