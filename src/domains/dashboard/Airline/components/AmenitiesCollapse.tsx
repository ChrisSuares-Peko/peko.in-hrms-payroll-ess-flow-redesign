import React from 'react';

import { RightOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Col, Collapse, Row, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

type Props = {};

const AmenitiesCollapse = (props: Props) => {
    const bookingData = useAppSelector(state => state.reducer.airline.selectedAirline);

    const { Paragraph, Text } = Typography;
    function formatWeight(weight: string) {
        if (!weight) return 'NA';
        return weight.replace('Kilograms', ' Kg').replace('KG', ' Kg');
    }
    const items = [
        {
            key: '1',
            label: (
                <h1 className="font-bold p-2 m-0">
                    {bookingData.onPoint} → {bookingData.offPoint}: Standard fare
                </h1>
            ),
            children: (
                <Row className="gap-4">
                    <Col md={24} xl={10}>
                        <Paragraph className="pb-3">
                            <ShoppingOutlined className="mx-2" />
                            Cabin Baggage:
                            <Text className="mr-2 text-gray-500 text-xs font-normal leading-4">
                                {' '}
                                {formatWeight(bookingData.journey[0][0].Baggage)}
                            </Text>
                        </Paragraph>
                        <Paragraph className="pb-3">
                            <ShoppingOutlined className="mx-2" />
                            Check-In Baggage:
                            <Text className="mr-2 text-gray-500 text-xs font-normal leading-4">
                                {' '}
                                {formatWeight(bookingData.journey[0][0].CabinBaggage)}
                            </Text>
                        </Paragraph>
                    </Col>
                </Row>
            ),
        },
    ];

    return (
        <Row className="mt-10">
            <style>
                {`
                .amenities-collapse .ant-collapse-header {
                    align-items: center !important;
                }
                `}
            </style>
            <Collapse
                size="large"
                expandIconPosition="end"
                className="amenities-collapse w-full border-none"
                style={{ borderRadius: 14 }}
                expandIcon={({ isActive }) => <RightOutlined rotate={isActive ? 90 : 0} />}
                items={items}
            />
        </Row>
    );
};

export default AmenitiesCollapse;
