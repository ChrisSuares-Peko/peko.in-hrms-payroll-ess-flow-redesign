import React from 'react';

import { Col, Divider, Flex, Radio, Row, Tag, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import dropdown from '@src/domains/dashboard/Airline/assets/icons/dropdown.svg';

type Props = {
    handlePrevClick: () => void;
};

function LuggageCardsPage({ handlePrevClick }: Props) {
    return (
        <Row>
            <Col span={4} flex="none">
                <Flex onClick={handlePrevClick}>
                    <ReactSVG src={dropdown} width={20} className="rotate-90 m-auto" />
                </Flex>
            </Col>
            <Col span={20} className="flex justify-center">
                <Typography.Text className="font-semibold text-lg">Luggage</Typography.Text>
            </Col>
            <Divider className="border-t-0 mb-0" />
            <Tag className="bg-green-50 border-green-300 px-3 py-2 w-full">
                Baggage is 20% Cheaper When Pre-Booked
            </Tag>
            <Divider className="border-t-2" />
            <Row className="mb-5" gutter={[20, 20]}>
                <Col span={18}>
                    <Row className="border p-3">
                        <Flex>
                            <Radio />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Additional 5 KG
                            </Typography.Text>
                        </Flex>
                        <Typography.Paragraph className="font-medium text-lg leading-7 capitalize mx-8">
                            INR 2,250
                        </Typography.Paragraph>
                    </Row>
                </Col>
                <Col span={18}>
                    <Row className="border p-3">
                        <Flex>
                            <Radio />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Additional 10 KG
                            </Typography.Text>
                        </Flex>
                        <Typography.Paragraph className="font-medium text-lg leading-7 capitalize mx-8">
                            INR 4,250
                        </Typography.Paragraph>
                    </Row>
                </Col>
                <Col span={18}>
                    <Row className="border p-3">
                        <Flex>
                            <Radio />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Additional 15 KG
                            </Typography.Text>
                        </Flex>
                        <Typography.Paragraph className="font-medium text-lg leading-7 capitalize mx-8">
                            INR 6,250
                        </Typography.Paragraph>
                    </Row>
                </Col>

                <Col span={18}>
                    <Flex className="border border-primaryOrange p-3 justify-center items-center h-full">
                        <Typography.Text className="text-primaryOrange font-medium text-base leading-7 capitalize mx-2">
                            +10 More Options
                        </Typography.Text>
                    </Flex>
                </Col>
            </Row>
        </Row>
    );
}

export default LuggageCardsPage;
