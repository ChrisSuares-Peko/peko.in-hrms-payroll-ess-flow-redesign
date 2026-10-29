import React from 'react';

import { Typography } from 'antd';

import { retrieveAirport, retrieveAirportName } from '../utils/airlineData';
import { formattedDateOnly, formattedTimeOnly } from '../utils/dateTime';

interface FlightInfoProps {
    info: {
        datetime: Date | string;
        airport: string;
        terminal: string;
    };
}

const FlightInfo: React.FC<FlightInfoProps> = ({ info }) => (
    <>
        <Typography.Text className="font-bold text-lg">
            {formattedTimeOnly(new Date(info.datetime))}
        </Typography.Text>
        <Typography.Text className="text-base font-normal">
            {formattedDateOnly(new Date(info.datetime))}{' '}
        </Typography.Text>
        <Typography.Text className="font-semibold">{info.airport} </Typography.Text>
        <Typography.Text className="text-gray-400">
            {retrieveAirport(info.airport)}{' '}
        </Typography.Text>
        <Typography.Text className="text-gray-400">
            {retrieveAirportName(info.airport)}{' '}
        </Typography.Text>
        <Typography.Text className="text-gray-400">Terminal {info.terminal}</Typography.Text>
    </>
);

export default FlightInfo;
