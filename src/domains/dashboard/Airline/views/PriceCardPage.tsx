import React from 'react';

import { Col, Divider, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import AirlineDetailBodyMobile from '../components/adaptive/AirlineDetailBodyMobile';
import PriceCardMobile from '../components/adaptive/PriceCardMobile';
import PriceFooter from '../components/adaptive/PriceFooter';
import { AllFareQuote } from '../types/fareRules';
import { calculateDuration } from '../utils/formatDateCode';
import { retrieveFlightClass } from '../utils/getFlightClass';
// import { formattedDateOnly } from '../utils/dateTime';

type Props = {
    handleClick: () => void;
    openFareRules: () => void;
    fareQuotes: AllFareQuote;
};
const { Paragraph } = Typography;

const PriceCardPage = ({ handleClick, openFareRules, fareQuotes }: Props) => {
    const airlineData = useAppSelector(state => state.reducer.airline.selectedAirline);
    const duration = airlineData.journey.reduce(
        (acc, segment) => acc + calculateDuration(segment),
        0
    );
    return (
        <Row>
            <Col span={24}>
                <Paragraph className="text-xl font-medium leading-7">
                    Review your itinerary
                </Paragraph>
            </Col>
            <Paragraph className="text-xs text-gray-500 leading-7  hidden md:block">
                {formattedDateOnly(new Date(airlineData.depart.datetime))} . {duration} .{' '}
                {retrieveFlightClass(airlineData.flightClass)}
            </Paragraph>
            <AirlineDetailBodyMobile />
            <Divider className="border-t-2" />
            <PriceCardMobile openFareRules={openFareRules} fareQuotes={fareQuotes} />
            <PriceFooter
                price={fareQuotes?.combined?.Fare?.PublishedFare ?? 0}
                handleClick={handleClick}
            />
        </Row>
    );
};

export default PriceCardPage;
