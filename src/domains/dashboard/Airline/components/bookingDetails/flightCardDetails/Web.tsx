import type { FC } from 'react';

import { Card, Col, Flex, Image, Row, Typography } from 'antd';

import { Journey } from '../../../types/airlineList';
import { retrieveAirlineName, retrieveAirport } from '../../../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../../../utils/dateTime';
import { findCabilClass } from '../../../utils/formatDateCode';
import FlightDurationBadge from '../../FlightDurationBadge';
import LayoverDivider from '../../LayoverDivider';

const { Text } = Typography;
interface FlightCardDetailsProps {
    item: Journey[];
}
function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}
const FlightCardDetailsWeb: FC<FlightCardDetailsProps> = ({ item }) => {
    function formatWeight(weight: string) {
        if (!weight) return 'NA';
        return weight.replace('Kilograms', ' kg').replace('KG', ' kg');
    }
    return (
        <Card className="my-6" size="small">
            {item.map((ele, index: number) => {
                const nextSegment = item?.[index + 1];
                return (
                    <Col key={index} className="mb-5" span={24}>
                        <Card
                            className="border-0 rounded-3xl "
                            styles={{
                                body: { padding: 15 },
                            }}
                        >
                            <Row justify="space-between" className="">
                                <Col
                                    span={24}
                                    md={4}
                                    className="border-0 rounded-2xl flex flex-col items-center justify-center bg-red_50 p-1"
                                >
                                    <Image
                                        preview={false}
                                        width={120}
                                        alt={ele.Airline.AirlineCode}
                                        src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${ele.Airline.AirlineCode}.gif?alt=media`}
                                    />
                                    <Text className="capitalize text-center mt-2 font-medium">
                                        {capitalizeFirstLetter(
                                            retrieveAirlineName(ele.Airline.AirlineCode)
                                        )}
                                    </Text>
                                    <Text className="capitalize text-center md:text-xs">
                                        {ele.Airline.AirlineCode}-{ele.Airline.FlightNumber}
                                    </Text>
                                </Col>

                                <Col span={6} md={4} className="w-full">
                                    <Flex
                                        className="w-full h-full"
                                        justify="center"
                                        align="start"
                                        vertical
                                    >
                                        <Text className="text-gray-400 text-sm font-normal">
                                            {formattedDateOnly(new Date(ele.Origin.DepTime))}
                                        </Text>
                                        <Text className="font-bold text-xl mt-2">
                                            {formattedTimeOnly(new Date(ele.Origin.DepTime))}
                                        </Text>
                                        <Text className="text-gray-400 text-xs mt-2 font-normal">
                                            {ele.Origin.Airport.AirportCode}
                                            {' - '}
                                            {retrieveAirport(ele.Origin.Airport.AirportCode)}
                                        </Text>
                                        <Typography.Text className="md:text-sm xxl:text-sm mt-2 font-normal text-gray-400">
                                            {ele.Origin.Airport.AirportName}
                                        </Typography.Text>
                                        <Typography.Text className="md:text-sm xxl:text-sm font-normal text-gray-400">
                                            Terminal {ele.Origin.Airport.Terminal}
                                        </Typography.Text>
                                    </Flex>
                                </Col>

                                <Col
                                    span={12}
                                    md={6}
                                    className="flex flex-col items-center justify-center"
                                >
                                    <FlightDurationBadge duration={ele.Duration} />
                                </Col>

                                <Col span={6} md={4} className="flex flex-col justify-center">
                                    <Flex vertical justify="center" align="end">
                                        <Text className="text-gray-400 text-right text-sm font-normal">
                                            {formattedDateOnly(new Date(ele.Destination.ArrTime))}
                                        </Text>
                                        <Text className="font-bold text-xl mt-2">
                                            {formattedTimeOnly(new Date(ele.Destination.ArrTime))}
                                        </Text>
                                        <Text className="text-gray-400 text-xs mt-2 font-normal text-end">
                                            {ele.Destination.Airport.AirportCode} {' - '}
                                            {retrieveAirport(ele.Destination.Airport.AirportCode)}
                                        </Text>
                                        <Typography.Text className="md:text-sm xxl:text-sm mt-2 font-normal text-gray-400 text-end">
                                            {ele.Destination.Airport.AirportName}
                                        </Typography.Text>
                                        <Typography.Text className="md:text-sm xxl:text-sm font-normal text-gray-400">
                                            Terminal {ele.Destination.Airport.Terminal}
                                        </Typography.Text>
                                    </Flex>
                                </Col>
                            </Row>
                            <Flex align="end" justify="space-between">
                                <Flex align="end" gap={10}>
                                    {ele.Baggage && (
                                        <Flex gap={5}>
                                            <Text className="text-gray-400 text-xs font-normal">
                                                Cabin Baggage
                                            </Text>
                                            <Text className="font-medium text-xs  capitalize">
                                                {formatWeight(ele.CabinBaggage)}
                                            </Text>
                                        </Flex>
                                    )}
                                    {ele.CabinBaggage && (
                                        <Flex gap={5}>
                                            <Text className="text-gray-400 text-xs font-normal whitespace-nowrap">
                                                Check-In Baggage
                                            </Text>
                                            <Text className="font-medium text-xs  capitalize">
                                                {formatWeight(ele.Baggage)}
                                            </Text>
                                        </Flex>
                                    )}
                                </Flex>
                                <Flex align="end" gap={10} className="mt-5">
                                    <Flex gap={5}>
                                        <Text className="text-gray-400 text-xs font-normal">
                                            Cabin Class
                                        </Text>

                                        <Text className="capitalize text-xs font-medium">
                                            {findCabilClass(
                                                ele.CabinClass as 1 | 2 | 3 | 4 | 5 | 6
                                            )}
                                        </Text>
                                    </Flex>
                                    <Flex align="end" justify="end" gap={5}>
                                        <Text className="text-gray-400 text-xs font-normal">
                                            Marketed by
                                        </Text>
                                        <Flex vertical align="center" gap={5}>
                                            <Image
                                                preview={false}
                                                height={25}
                                                width={50}
                                                className="object-contain"
                                                alt={ele.Airline.AirlineCode}
                                                src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${ele.Airline.AirlineCode}.gif?alt=media`}
                                            />
                                            <Text className="capitalize text-xs font-medium">
                                                {capitalizeFirstLetter(
                                                    retrieveAirlineName(ele.Airline.AirlineCode)
                                                )}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Card>
                        <LayoverDivider nextSegment={nextSegment} prevSegment={ele} />
                    </Col>
                );
            })}
        </Card>
    );
};

export default FlightCardDetailsWeb;
