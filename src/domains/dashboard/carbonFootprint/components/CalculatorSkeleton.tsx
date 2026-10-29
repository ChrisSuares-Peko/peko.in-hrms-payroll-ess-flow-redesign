import React from 'react';

import { Col, Flex, Row, Skeleton } from 'antd';

const CalculatorSkeleton = () => (
    <Flex justify="center">
        <Row className="md:w-8/12" gutter={[20, 20]}>
            <Col span={24} className="my-6 ml-14">
                <Skeleton active title={false} paragraph={{ rows: 1 }} />
            </Col>
            {Array.from({ length: 1 }).map((_, index) => (
                <Col xs={24} key={index}>
                    <Flex vertical gap={20} className="">
                        <Flex gap={20} align="center">
                            <Skeleton.Button active shape="circle" />
                            <Skeleton.Input active size="small" />
                        </Flex>
                        <Skeleton
                            active
                            title={false}
                            paragraph={{ rows: 1 }}
                            className="w-full ml-14"
                        />
                        <Flex gap={30} className="ml-14">
                            <Skeleton.Input active className="mt-1 " block />
                            <Skeleton.Input active className="mt-1 " block />
                        </Flex>
                    </Flex>
                </Col>
            ))}
            <Col xs={23}>
                <Skeleton.Button block size="large" className="mt-5 h-10 ml-7" />
            </Col>
        </Row>
    </Flex>
);

export default CalculatorSkeleton;
