import React from 'react';

import { Button, Card, Col, Flex, Image, Row, Typography, theme } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import percentage from '@src/domains/dashboard/insurance/assets/svg/percentage.svg';

import { insuranceType } from '../types/type';

interface propType {
    insuranceList: insuranceType[];
}

function SearchResultCard({ insuranceList }: propType) {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    return insuranceList.map((item, index) => (
        <Col key={index} className="my-3" span={24}>
            <Card className="border-0 py-5 px-8" styles={{ body: { padding: 0 } }}>
                <Row>
                    <Col span={24} md={18}>
                        <Flex vertical>
                            <Image preview={false} height={60} width={80} src={item.logo} />
                            <Typography.Text className="text-gray-400">Plan name</Typography.Text>
                            <Typography.Title level={4} className="pt-2 pb-4">
                                {item.name}
                            </Typography.Title>
                            <Typography.Text
                                style={{ color: colorPrimary }}
                                className="flex gap-3 items-center pb-2"
                            >
                                <ReactSVG src={percentage} />
                                {item.claimRate} % Claims Settled
                            </Typography.Text>
                            <Flex gap={10} className="flex-col sm:flex-row">
                                <Typography.Text className="text-gray-400">
                                    Cover
                                    <span className="text-black ml-3">₹ {item.cover} Lakhs</span>
                                </Typography.Text>
                                <Typography.Text className="text-gray-400">
                                    Cashless Hospitals
                                    <span className="text-black ml-3">
                                        {item.cashlessHospitals}
                                    </span>
                                </Typography.Text>
                            </Flex>
                            <Flex wrap="wrap" gap={10} className="mt-2">
                                {item.benefits.map((value, i) => (
                                    <Typography.Text className="text-sm text-gray-400" key={i}>
                                        {value}
                                    </Typography.Text>
                                ))}
                            </Flex>
                        </Flex>
                    </Col>
                    <Col span={24} md={{ offset: 2, span: 4 }}>
                        <Flex
                            vertical
                            className="h-full md:justify-center sm:mt-3 md:mt-0 sm:items-center gap-5 md:gap-0 sm:flex-row md:flex-col"
                        >
                            <Typography.Text className="text-gray-400">Price</Typography.Text>
                            <Typography.Title level={4} className="md:pt-2 md:pb-4">
                                {item.price} <span className="text-base">/ {item.period}</span>
                            </Typography.Title>
                            <Typography.Text
                                className="text-normal sm:text-center"
                                style={{ color: colorPrimary }}
                            >
                                EMI starts @ ₹ {item.emiStart}
                            </Typography.Text>
                            <Link to="../details">
                                <Button
                                    className="px-6 md:mt-3 text-white rounded-sm w-full "
                                    style={{ backgroundColor: colorPrimary }}
                                    type="primary"
                                    size="middle"
                                >
                                    Buy Now
                                </Button>
                            </Link>
                        </Flex>
                    </Col>
                </Row>
            </Card>
        </Col>
    ));
}

export default SearchResultCard;
