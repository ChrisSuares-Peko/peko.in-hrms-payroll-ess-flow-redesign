import React, { useState } from 'react';

import { Card, Flex } from 'antd';

// import { CloseBtn } from '@src/domains/dashboard/Airline/components/BookingDetails/CloseBtn';

import FlightCard from './FlightCard';
import FlightCardDetails from './FlightCardDetails';

type props = {
    journey: any;
    ticketDocument: any;
    bookingReferenceId: any;
};
const ExistingBooking = ({ bookingReferenceId, journey, ticketDocument }: props) => {
    const [isFlightDetailsVisible] = useState(false);
    return (
        <Flex className="w-full" vertical>
            <Card
                className="border-2"
                size="small"
                style={{
                    borderRadius: '10px',
                    borderBottom: '10px solid #FFF1F0',
                    borderLeft: '1px solid  #FFF1F0',
                    borderRight: '1px solid  #FFF1F0',
                    borderTop: '1px solid  #FFF1F0',
                    background: `linear-gradient(to bottom, #FAFAFA 25%, white 25%)`,
                }}
            >
                <FlightCard
                    journey={journey}
                    ticketDocument={ticketDocument}
                    bookingReferenceId={bookingReferenceId}
                />
            </Card>
            {/* <CloseBtn
                isFlightDetailsVisible={isFlightDetailsVisible}
                setIsFlightDetailsVisible={setIsFlightDetailsVisible}
            /> */}

            {isFlightDetailsVisible && (
                <Flex className="w-full mt-5" vertical>
                    <Card
                        style={{
                            borderRadius: '10px',
                            borderBottom: '10px solid #FFF1F0',
                            borderLeft: '1px solid #FFF1F0',
                            borderRight: '1px solid #FFF1F0',
                            borderTop: '1px solid #FFF1F0',
                            background: `linear-gradient(to bottom, #FAFAFA 25%, white 25%)`,
                        }}
                    >
                        <FlightCardDetails journey={journey} />
                    </Card>
                    {/* <CloseBtn
                        isFlightDetailsVisible={isFlightDetailsVisible}
                        setIsFlightDetailsVisible={setIsFlightDetailsVisible}
                    /> */}
                </Flex>
            )}
        </Flex>
    );
};

export default ExistingBooking;
