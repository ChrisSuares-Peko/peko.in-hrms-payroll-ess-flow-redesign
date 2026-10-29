import React from 'react';

import { ShoppingOutlined } from '@ant-design/icons';
import { Col, Flex, Row, Radio, Typography, Collapse } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { AncillaryMeal, AncillarySearch } from '../types/ancilaryType';

type Props = {
    handleSelection: (anc: AncillaryMeal, ancilaryType: string) => void;
    passengerKey: string;
};

const BaggagesAddOn = ({ handleSelection, passengerKey }: Props) => {
    const ancillariesData: AncillarySearch = useAppSelector(
        state => state.reducer.airline.ancillariesSearch
    ) as AncillarySearch;

    const { baggages, flightSegments } = ancillariesData.data[0];
    const flightSegmentsData = flightSegments.map((item, index) => ({
        key: index,
        label: `${item.departureAirportCode} -> ${item.arrivalAirportCode}`,
        children: (
            <Col span={24} className="mt-2">
                <Flex>
                    <ShoppingOutlined className="text-2xl w-8 h-8" />
                    <Typography.Text className="text-neutral-700 font-medium text-lg leading-7 capitalize mx-2">
                        Add extra luggage
                    </Typography.Text>
                </Flex>
                <Typography.Paragraph className="mx-10 text-neutral-400 font-normal text-base leading-7 capitalize">
                    Baggage is 20% cheaper when pre-booked.
                </Typography.Paragraph>
                <Row className="mt-4" gutter={[20, 20]}>
                    <Radio.Group
                        key={index}
                        onChange={e => handleSelection(e.target.value, 'baggage')}
                    >
                        {baggages.map(
                            baggage =>
                                baggage.segmentPassengerMapping.segmentKeys[0] ===
                                    item.segmentKey && (
                                    <Col className="m-1">
                                        <Row className="border p-3">
                                            <Flex>
                                                <Radio
                                                    value={baggage}
                                                    key={
                                                        baggage.segmentPassengerMapping
                                                            .passengerKeys +
                                                        baggage.ancillary.ancillaryOfferId
                                                    }
                                                />
                                                <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                                    {baggage.ancillary.ancillaryDescription}
                                                </Typography.Text>
                                            </Flex>
                                            <Typography.Paragraph className="font-medium text-lg leading-7 capitalize mx-8">
                                                ₹ {baggage.fare[0].buyingAmount}
                                            </Typography.Paragraph>
                                        </Row>
                                    </Col>
                                )
                        )}
                    </Radio.Group>
                </Row>
            </Col>
        ),
    }));

    return <Collapse expandIconPosition="end" ghost items={flightSegmentsData} />;
};

export default BaggagesAddOn;
