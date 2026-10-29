import React from 'react';

import { Button, Col, Flex, Image, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';

import LandingPageImg from '@domains/dashboard/WhatsappForBusiness/assets/images/image.png';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

interface Props {
    isPurchased?: boolean;
    scrollToPricing: () => void;
}

const Information = ({ isPurchased, scrollToPricing }: Props) => (
    <Content className="xl:px-14">
        <Row className="mt-6">
            <Col xl={12}>
                <Flex vertical gap={30}>
                    <Text className="text-3xl font-semibold">
                        Grow Your Business On <br /> WhatsApp
                    </Text>
                    {isPurchased ? (
                        <Text className="text-base text-textGreyColor">
                            You are currently on the Yearly Pro Plan for WhatsApp Business.
                        </Text>
                    ) : (
                        <Text className="text-base text-textGreyColor">
                            Create meaningful interactions on WhatsApp with your customers with
                            user-friendly automation capabilities and provide customers with
                            always-on support.
                        </Text>
                    )}
                    {isPurchased ? (
                        <Flex gap={30} className="flex-wrap justify-center sm:justify-start">
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                className="h-10 px-6"
                                size="large"
                                href="https://www.wa.peko.one"
                                target="_blank"
                            >
                                Go to WhatsApp Dashboard
                            </Button>

                            <Link to={paths.whatsappForBusiness.MyProjects}>
                                <Button key="back" className="h-10 px-6" size="large" danger>
                                    My Projects
                                </Button>
                            </Link>
                        </Flex>
                    ) : (
                        <Flex gap={30} className="flex-wrap justify-center sm:justify-start">
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                className="h-10 px-6"
                                size="large"
                                onClick={scrollToPricing}
                            >
                                Purchase a WhatsApp Plan
                            </Button>
                        </Flex>
                    )}
                </Flex>
            </Col>
            <Col xl={12} className="justify-center hidden xl:flex">
                <Image src={LandingPageImg} preview={false} height="18rem" />
            </Col>
        </Row>
    </Content>
);

export default Information;
