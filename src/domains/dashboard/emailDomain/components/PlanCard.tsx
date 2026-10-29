import React from 'react';

import { Button, Col, Flex, Image, Row, Typography } from 'antd';

const { Text, Paragraph } = Typography;

type Props = {
    planId: number;
    features: { label: string; value: string }[];
    planName: string;
    monthlyPrice: string | number;
    yearlyPrice: string | number;
    selectedType: string;
    image_url: string;
    descriptions: { label: string; value: string }[];
    handlePurchase: () => void;
};
const PlanCard = ({
    planId,
    features,
    planName,
    image_url,
    selectedType,
    monthlyPrice,
    yearlyPrice,
    descriptions,
    handlePurchase,
}: Props) => (
    <Col xs={24} sm={12} md={10} lg={12} xl={6} className="pt-3" style={{ minWidth: '300px' }}>
        <Flex className="h-full flex-col rounded-2xl border transition duration-150 transform hover:scale-105">
            <Flex className="flex-col flex-grow gap-4 px-8 py-6">
                <Flex className="flex-col flex-grow gap-4">
                    <Text className="text-lg font-medium md:text-xl">{planName}</Text>

                    <Flex align="baseline" className="mt-2">
                        <Text className="text-[26px] font-medium">
                            INR {selectedType === 'Monthly' ? monthlyPrice : yearlyPrice}
                        </Text>
                        <Text className="text-sm font-normal ml-2" style={{ fontSize: '0.8rem' }}>
                            /user/{selectedType.toLowerCase()}
                        </Text>
                    </Flex>
                    <Flex>
                        <Button
                            onClick={handlePurchase}
                            className="mt-4 w-full"
                            type="primary"
                            danger
                        >
                            Purchase
                        </Button>
                    </Flex>
                    <Flex vertical align="flex-start" className="mt-4">
                        {features.map((feat, index) => (
                            <Flex
                                key={index}
                                className="w-full mt-3"
                                style={{ alignItems: 'center' }}
                            >
                                <Text
                                    className="text-sm lg:text-base"
                                    style={{ minWidth: '100px' }}
                                >
                                    {feat.label}
                                </Text>

                                <Text
                                    className="text-sm lg:text-base font-semibold ml-2"
                                    style={{ flexGrow: 1 }}
                                >
                                    {feat.value}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>

                {image_url && (
                    <Flex vertical className="mt-4 flex-wrap gap-3" justify="center">
                        <Text className="text-sm lg:text-base">Apps</Text>
                        <Image
                            preview={false}
                            src={image_url || ''}
                            alt="Plan Image"
                            style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
                        />
                    </Flex>
                )}

                <Flex vertical justify="space-between" className="h-full mt-4">
                    <Paragraph className="font-normal leading-5 overflow-hidden">
                        {descriptions.map((description, index) => (
                            <Row key={index} className="overflow-hidden text-ellipsis">
                                <Col>
                                    <Text>
                                        <Text strong>{description.label}:</Text>{' '}
                                        <Text className="text-normal">{description.value}</Text>
                                    </Text>
                                </Col>
                            </Row>
                        ))}
                    </Paragraph>
                </Flex>
            </Flex>
        </Flex>
    </Col>
);
export default React.memo(PlanCard);
