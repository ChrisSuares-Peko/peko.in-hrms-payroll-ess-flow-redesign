import React from 'react';

import { Card, Col, Flex, Image, Typography, theme } from 'antd';

import defaultImage from '../../assets/images/defaultImage.png';

interface About {
    name?: string;
    productImage?: string;
    description?: string;
}

const { Text, Title } = Typography;

function AboutSection({ name, productImage, description }: About) {
    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <>
            <Col xs={24} md={8}>
                <Card bordered className="h-full rounded-xl flex justify-center items-center">
                    <Flex vertical gap={6} align="center">
                        <Flex
                            className="w-40 sm:w-28 rounded-2xl sm:rounded-3xl"
                            align="center"
                            justify="center"
                        >
                            <Image
                                preview={false}
                                fallback={defaultImage}
                                className="w-24"
                                src={productImage}
                            />
                        </Flex>
                    </Flex>
                </Card>
            </Col>
            <Col xs={24} md={16}>
                <Flex vertical gap={15}>
                    <Title className="text-xl" style={{ color: colorPrimary }} level={3}>
                        {name}
                    </Title>
                    <Title level={5}>About Product</Title>
                    <Text style={{ lineHeight: '2rem', fontSize: '0.875rem' }}>{description}</Text>
                    {/* <Text disabled style={{ fontSize: '0.875rem' }}>
                        Includes: Contact support via chat or phone at no extra cost throughout your
                        subscription
                    </Text> */}
                </Flex>
            </Col>
        </>
    );
}

export default AboutSection;
