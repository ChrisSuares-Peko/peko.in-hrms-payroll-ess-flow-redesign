import React from 'react';

import { Card, Col, Flex, Typography } from 'antd';

interface PassengerProps {
    passenger: any;
    index: number;
    customerInfo?: {
        emailAddress?: string;
        phone?: string;
    };
}

const GuestCard = ({ passenger, index, customerInfo }: PassengerProps) => {
    // The guest form only collects mobile/email once, as the booking contact
    // (Receiver Details), against the lead passenger. Fall back to that
    // contact info for the lead guest so it isn't shown as N/A here.
    const mobileNumber =
        passenger.Phoneno || (passenger.LeadPassenger && customerInfo?.phone) || 'N/A';
    const email =
        passenger.Email || (passenger.LeadPassenger && customerInfo?.emailAddress) || 'N/A';

    return (
        <Col key={index} xs={24} sm={24} md={12}>
            <Card bordered style={{ background: '#F0F0F0' }}>
                <Flex>
                    <Typography.Text>{`Guest ${index + 1}`}</Typography.Text>
                </Flex>
                <Flex justify="space-between" className="mt-2">
                    <Flex vertical gap={7}>
                        <Typography.Text className="text-textGreyColor xs:text-xs md:text-sm">
                            FullName{' '}
                        </Typography.Text>
                        <Typography.Text strong className="line-clamp-1 xs:text-xs md:text-sm">
                            {passenger.FirstName} {passenger.LastName}
                        </Typography.Text>
                        <Typography.Text className="text-textGreyColor xs:text-xs md:text-sm mt-2">
                            Mobile Number{' '}
                        </Typography.Text>
                        <Typography.Text strong className="xs:text-xs md:text-sm">
                            {mobileNumber}
                        </Typography.Text>
                    </Flex>
                    <Flex vertical gap={5}>
                        <Typography.Text className="text-textGreyColor xs:text-xs md:text-sm">
                            Date of Birth{' '}
                        </Typography.Text>
                        <Typography.Text strong className="xs:line-clamp-1 xs:text-xs md:text-sm">
                            {passenger.dob || 'N/A'}
                        </Typography.Text>
                        <Typography.Text className="text-textGreyColor xs:text-xs mt-2 md:text-sm">
                            Email ID{' '}
                        </Typography.Text>
                        <Typography.Text strong className="line-clamp-1 xs:text-xs md:text-sm">
                            {email}
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Card>
        </Col>
    );
};

export default GuestCard;
