import React from 'react';

import { Flex, Typography } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import { retrieveAirport, retrieveAirportName } from '../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../utils/dateTime';

interface FlightInfoProps {
    info: {
        datetime: Date | string;
        airport: string;
        terminal: string;
        title: string;
    };
}

const FlightInfoSM: React.FC<FlightInfoProps> = ({ info }) => {
    const { md } = useScreenSize();
    return (
        <Flex vertical gap={md ? 0 : 5} className="mt-[.25rem] md:mt-0">
            <Typography.Text className="text-gray-500 text-xs font-semibold">
                {info.title}
            </Typography.Text>
            <Typography.Text className="font-bold lg:text-lg xs:text-sm">
                {formattedTimeOnly(new Date(info.datetime))}
            </Typography.Text>
            <Typography.Text className="lg:text-base font-normal xs:text-[.6rem]">
                {formattedDateOnly(new Date(info.datetime))}{' '}
            </Typography.Text>
            <Typography.Text className="font-bold  text-sm">{info.airport} </Typography.Text>
            <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                {retrieveAirport(info.airport)}{' '}
            </Typography.Text>
            <Typography.Text className="text-gray-400 sm:block xs:text-[.7rem] md:text-sm">
                {retrieveAirportName(info.airport)}{' '}
            </Typography.Text>
            <Typography.Text className="text-gray-400 sm:block xs:text-xs md:text-sm">
                Terminal {info.terminal}
            </Typography.Text>
        </Flex>
    );
};

export default FlightInfoSM;
