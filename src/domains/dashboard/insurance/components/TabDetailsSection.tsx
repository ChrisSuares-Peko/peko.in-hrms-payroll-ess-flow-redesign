import React from 'react';

import { Col, Divider, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import { FeaturesDetailsProps } from '../types/type';

const TabDetailsSection = ({ icon, details, needRedLine, width }: FeaturesDetailsProps) => (
    <Row gutter={[20, 20]} className="md:px-5 py-5">
        {details.map((item, index) => (
            <Col span={24} md={width ?? 12} key={index}>
                <Flex gap={10}>
                    <Flex vertical align="center">
                        <ReactSVG src={icon} />
                        {needRedLine && (
                            <Divider type="vertical" className="h-full border-bgOrange2" />
                        )}
                    </Flex>
                    <Content>
                        <Typography.Text className="text-base font-medium">
                            {item.title}
                        </Typography.Text>
                        <br />
                        <Typography.Text className="text-sm font-light">
                            {item.description}
                        </Typography.Text>
                    </Content>
                </Flex>
            </Col>
        ))}
    </Row>
);
export default TabDetailsSection;
