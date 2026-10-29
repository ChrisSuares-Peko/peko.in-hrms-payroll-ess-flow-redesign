import React from 'react';

import { Flex, Image, Typography } from 'antd';

import { retrieveAirlineName } from '../../utils/airlineData';

interface DynamicImageCardProps {
    flightSegments: any;
}

export default function DynamicImageCardSmall({ flightSegments }: DynamicImageCardProps) {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const operatingAirlines = flightSegments.map((segment: any) => segment.Airline.AirlineCode);
    const uniqueOperatingAirlines = [...new Set(operatingAirlines)];

    const flightNumbers = flightSegments.map(
        (segment: any) => `${segment.Airline.AirlineCode}-${segment.Airline.FlightNumber}`
    );
    const uniqueFlightNumbers = [...new Set(flightNumbers)].join(' | ');
    return uniqueOperatingAirlines.length > 1 ? (
        <Flex align="center" justify="center">
            {uniqueOperatingAirlines.map((v, i) => (
                <Image
                    key={i}
                    preview={false}
                    width={60}
                    alt="logo"
                    src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${v}.gif?alt=media`}
                />
            ))}
            {/* <Typography.Text className="text-center mt-1 text-sm font-normal text-[#6B6B6B]">
                Multiple Airlines
            </Typography.Text> */}
            <Typography.Text className="capitalize text-[.65rem]">
                {uniqueFlightNumbers}
            </Typography.Text>
        </Flex>
    ) : (
        <Flex justify="start" align="center" gap={10}>
            <Flex className="mt-1">
                <Image
                    preview={false}
                    height={28}
                    alt="logo"
                    src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${uniqueOperatingAirlines[0]}.gif?alt=media`}
                />
            </Flex>
            <Flex vertical>
                <Typography.Text className="capitalize font-medium text-sm">
                    {capitalizeFirstLetter(
                        retrieveAirlineName(uniqueOperatingAirlines[0] as string)
                    )}
                </Typography.Text>
                <Typography.Text className="capitalize text-[.65rem] text-gray-500 ">
                    {uniqueFlightNumbers}
                </Typography.Text>
            </Flex>
        </Flex>
    );
}
