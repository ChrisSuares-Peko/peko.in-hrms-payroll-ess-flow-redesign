import React from 'react';

import { Col, Divider, Flex, Row, Tag, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import dropdown from '@src/domains/dashboard/Airline/assets/icons/dropdown.svg';
import food from '@src/domains/dashboard/Airline/assets/icons/food.svg';

type Props = { handlePrevClick: () => void };

function MealsCardsPage({ handlePrevClick }: Props) {
    return (
        <Row>
            <Col span={4} flex="none">
                <Flex onClick={handlePrevClick}>
                    <ReactSVG src={dropdown} width={20} className="rotate-90 m-auto" />
                </Flex>
            </Col>
            <Col span={20} className="flex justify-center">
                <Typography.Text className="font-semibold text-lg">Meals</Typography.Text>
            </Col>
            <Divider className="border-t-0 mb-0" />
            <Tag className="bg-green-50 border-green-300 px-3 py-2 w-full">
                Meals are Usually Cheaper When Pre-Booked
            </Tag>
            <Divider className="border-t-2" />
            <Col span={24}>
                <Row className="mb-5" gutter={[20, 20]}>
                    <Col span={18}>
                        <Flex className="border p-3">
                            <ReactSVG src={food} />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Add a meal
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col span={18}>
                        <Flex className="border p-3">
                            <ReactSVG src={food} />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Bland Meal
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col span={18}>
                        <Flex className="border p-3">
                            <ReactSVG src={food} />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Diabetic meal
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col span={18}>
                        <Flex className="border p-3">
                            <ReactSVG src={food} />
                            <Typography.Text className="text-neutral-400 font-medium text-base leading-7 capitalize mx-2">
                                Diabetic meal
                            </Typography.Text>
                        </Flex>
                    </Col>
                    <Col span={18}>
                        <Flex className="border border-primaryOrange p-3 justify-center">
                            <Typography.Text className="text-primaryOrange font-medium text-base leading-7 capitalize mx-2">
                                +10 More Options
                            </Typography.Text>
                        </Flex>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
}

export default MealsCardsPage;
