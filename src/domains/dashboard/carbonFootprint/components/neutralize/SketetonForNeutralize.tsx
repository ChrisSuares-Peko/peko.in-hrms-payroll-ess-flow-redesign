import React from 'react';

import { Card, Col, Flex, Row, Skeleton, Typography } from 'antd';

const { Text } = Typography;

type Props = {};

const SketetonForNeutralize = (props: Props) => (
    <Row gutter={[60, 20]}>
        <Col xs={24} md={10} lg={12} xl={10} xxl={10}>
            <Card className="md:border md:border-solid rounded-2xl h-full my-3 w-full">
                <Skeleton.Button
                    shape="square"
                    style={{ height: '13rem', borderRadius: '1rem' }}
                    active
                    block
                    size="large"
                />
                <Skeleton paragraph={{ rows: 5 }} active className="mt-10" />
            </Card>
        </Col>
        <Col xs={24} md={14} lg={12}>
            <Flex vertical gap={10} className="mt-6">
                <Skeleton paragraph={{ rows: 1 }} active />
                <Flex align="center" gap={40} className="mt-1">
                    <Flex vertical gap={10}>
                        <Skeleton title paragraph={{ rows: 0 }} active />
                        <Skeleton.Input active />
                        <Text className="text-textWhitesmoke font-medium text-xs me-4 ">
                            <Skeleton title paragraph={{ rows: 0 }} active className="mt-2" />
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
            <Flex wrap="wrap" gap="middle" className="justify-between">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton.Button
                        key={index}
                        shape="square"
                        style={{ height: '8rem', width: '8rem' }}
                        className="w-full"
                        active
                        size="large"
                    />
                ))}
            </Flex>
            <Flex align="center" gap={15} className="mt-5">
                <Skeleton.Input active />
                <Skeleton.Button active size="large" />
            </Flex>
        </Col>
    </Row>
);

export default SketetonForNeutralize;
