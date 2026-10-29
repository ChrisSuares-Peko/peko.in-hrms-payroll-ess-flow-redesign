import { Card, Col, Flex, Image, Row, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppSelector } from '@src/hooks/store';

import FlightDurationBadge from './FlightDurationBadge';
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

const SegmentRow = ({ segment }: { segment: Journey }) => (
    <Row align="middle" gutter={[12, 8]} className="py-3">
        <Col xs={24} md={5}>
            <Flex vertical align="center" justify="center" gap={4}>
                <Image
                    preview={false}
                    width={40}
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
        </Col>

        <Col xs={12} md={6}>
            <Flex vertical>
                <Text className="text-base font-bold">
                    {formattedTimeOnly(new Date(segment.Origin.DepTime))}
                </Text>
                <Text className="text-xs text-gray-500">
                    {segment.Origin.Airport.AirportCode} ·{' '}
                    {retrieveAirportName(segment.Origin.Airport.AirportCode)}
                </Text>
                <Text className="text-xs text-gray-400 line-clamp-1">
                    {dayjs(segment.Origin.DepTime).format('DD MMM')} · Terminal{' '}
                    {segment.Origin.Airport.Terminal || 'N/A'}
                </Text>
            </Flex>
        </Col>

        <Col xs={24} md={5} className="flex justify-center">
            <FlightDurationBadge duration={segment.Duration} />
        </Col>

        <Col xs={12} md={8}>
            <Flex vertical align="end">
                <Text className="text-base font-bold">
                    {formattedTimeOnly(new Date(segment.Destination.ArrTime))}
                </Text>
                <Text className="text-xs text-gray-500">
                    {segment.Destination.Airport.AirportCode} ·{' '}
                    {retrieveAirportName(segment.Destination.Airport.AirportCode)}
                </Text>
                <Text className="text-xs text-gray-400 line-clamp-1 text-right">
                    {dayjs(segment.Destination.ArrTime).format('DD MMM')} · Terminal{' '}
                    {segment.Destination.Airport.Terminal || 'N/A'}
                </Text>
            </Flex>
        </Col>

        <Col span={24}>
            <Flex gap={16} className="text-xs text-gray-500" wrap="wrap">
                {segment.CabinClass && (
                    <Text className="capitalize">
                        {findCabilClass(segment.CabinClass as 1 | 2 | 3 | 4 | 5 | 6)}
                    </Text>
                )}
                {segment.Baggage && <Text>Check-In {formatWeight(segment.Baggage)}</Text>}
                {segment.CabinBaggage && <Text>Cabin {formatWeight(segment.CabinBaggage)}</Text>}
            </Flex>
        </Col>
    </Row>
);

const JourneyBlock = ({ segments }: { segments: Journey[] }) => {
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const stopCount = segments.length - 1;

    return (
        <Card size="small" className="rounded-2xl mb-4" styles={{ body: { padding: 16 } }}>
            <Flex
                justify="space-between"
                align="center"
                className="pb-3 border-0 border-b border-solid border-gray-100"
                wrap="wrap"
                gap={8}
            >
                <Text className="text-base font-semibold">
                    {retrieveAirport(firstSegment.Origin.Airport.AirportCode)} →{' '}
                    {retrieveAirport(lastSegment.Destination.Airport.AirportCode)}
                </Text>
                <Text className="text-xs text-gray-500">
                    {dayjs(firstSegment.Origin.DepTime).format('ddd, DD MMM')} ·{' '}
                    {stopCount === 0 ? 'Non stop' : `${stopCount} stop`} ·{' '}
                    {formatDurationToHourMinute(calculateDuration(segments))}
                </Text>
            </Flex>

            {segments.map((seg, i) => (
                <div key={i}>
                    <SegmentRow segment={seg} />
                    <LayoverDivider nextSegment={segments[i + 1]} prevSegment={seg} />
                </div>
            ))}
        </Card>
    );
};

const CompactItineraryCard = () => {
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
        <Card
            bodyStyle={{ padding: 16 }}
            className="rounded-[28px] shadow-[0_4px_20px_8px_rgba(0,0,0,0.02)]"
        >
            {journeys.map((segments, i) => (
                <JourneyBlock key={i} segments={segments} />
            ))}
        </Card>
    );
};

export default CompactItineraryCard;
