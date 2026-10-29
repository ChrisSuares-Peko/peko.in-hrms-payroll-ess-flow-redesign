import React from 'react';

import { Flex, Image, Typography } from 'antd';

import { retrieveAirlineName } from '../../utils/airlineData';

interface DynamicImageCardProps {
    flightSegments: any;
    horizontal?: boolean;
}

export default function DynamicImageCard({
    flightSegments,
    horizontal = false,
}: DynamicImageCardProps) {
    function capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    const operatingAirlines = flightSegments.map((segment: any) => segment.Airline.AirlineCode);
    const uniqueOperatingAirlines = [...new Set(operatingAirlines)];

    const flightNumbers = flightSegments.map(
        (segment: any) => `${segment.Airline.AirlineCode}-${segment.Airline.FlightNumber}`
    );
    const uniqueFlightNumbers = [...new Set(flightNumbers)].join(' | ');

    if (horizontal) {
        return uniqueOperatingAirlines.length > 1 ? (
            <Flex align="center" gap={8}>
                <Flex align="center" gap={2}>
                    {uniqueOperatingAirlines.map((v, i) => (
                        <Image
                            key={i}
                            preview={false}
                            width={24}
                            height={24}
                            alt="logo"
                            className="object-contain rounded-sm"
                            src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${v}.gif?alt=media`}
                        />
                    ))}
                </Flex>
                <Typography.Text className="text-sm font-semibold text-gray-800">
                    Multiple Airlines
                </Typography.Text>
            </Flex>
        ) : (
            <Flex align="center" gap={8}>
                <Image
                    preview={false}
                    width={28}
                    height={28}
                    alt="logo"
                    className="object-contain rounded-sm"
                    src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${uniqueOperatingAirlines[0]}.gif?alt=media`}
                />
                <Typography.Text className="capitalize text-sm font-semibold text-gray-800">
                    {capitalizeFirstLetter(
                        retrieveAirlineName(uniqueOperatingAirlines[0] as string)
                    )}
                </Typography.Text>
            </Flex>
        );
    }

    return uniqueOperatingAirlines.length > 1 ? (
        <Flex vertical align="center" justify="center">
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
            <Typography.Text className="capitalize text-center text-[.65rem]">
                {uniqueFlightNumbers}
            </Typography.Text>
        </Flex>
    ) : (
        <Flex vertical align="center" justify="center">
            <Image
                preview={false}
                width={80}
                alt="logo"
                src={`https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fairline_logos%2F${uniqueOperatingAirlines[0]}.gif?alt=media`}
            />
            <Typography.Text className="capitalize text-center mt-2 font-medium">
                {capitalizeFirstLetter(retrieveAirlineName(uniqueOperatingAirlines[0] as string))}
            </Typography.Text>
            <Typography.Text className="capitalize text-center text-[.65rem] hidden md:block">
                {uniqueFlightNumbers}
            </Typography.Text>
        </Flex>
    );
}
