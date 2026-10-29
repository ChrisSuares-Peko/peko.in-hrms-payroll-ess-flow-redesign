import React from 'react';

import { ShoppingOutlined } from '@ant-design/icons';
import { Flex, Image, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { retrieveAirlineName } from '../../utils/airlineData';
import { retrieveFlightClass } from '../../utils/getFlightClass';
import AirlineDetailsCardAdaptive from '../AirlineDetailsCardAdaptive';

const FlightCardMobile = () => {
    const bookingData = useAppSelector(state => state.reducer.airline.selectedAirline);
    function formatWeight(weight: string) {
        if (!weight) return 'NA';
        return weight.replace('Kilograms', ' Kg').replace('KG', ' Kg');
    }
    return (
        <>
            <Flex
                className="w-full border border-solid rounded-tl-xl rounded-tr-xl p-3 "
                align="center"
                gap={10}
            >
                <Image preview={false} width={40} src={bookingData?.logo} alt={bookingData?.logo} />
                <Typography.Text>{retrieveAirlineName(bookingData.flightCode)} </Typography.Text>

                <div className="flex-grow" />
                <Typography.Text className="capitalize font-medium  text-end md:text-xs  text-[0.65rem]">
                    {retrieveFlightClass(bookingData.flightClass)}
                </Typography.Text>
            </Flex>
            <AirlineDetailsCardAdaptive />
            <Row className="mt-6">
                <Typography.Paragraph className="pb-3">
                    <ShoppingOutlined className="mr-1" />
                    Cabin Baggage:
                    <Typography.Text className="mx-1 text-gray-500 text-xs font-normal leading-4">
                        {formatWeight(bookingData.journey[0][0]?.CabinBaggage)}
                    </Typography.Text>
                </Typography.Paragraph>
                <Typography.Paragraph>
                    <ShoppingOutlined className="mr-1" />
                    Check-In Baggage:
                    <Typography.Text className="mx-1 text-gray-500 text-xs font-normal leading-4">
                        {formatWeight(bookingData.journey[0][0]?.Baggage)}
                    </Typography.Text>
                </Typography.Paragraph>
            </Row>
            {/* <Divider className="border-t-2" /> */}
        </>
    );
};

export default FlightCardMobile;
