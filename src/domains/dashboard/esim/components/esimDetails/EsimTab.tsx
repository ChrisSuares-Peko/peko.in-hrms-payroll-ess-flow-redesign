import React from 'react';

import { Col, Flex, Row, Tabs, Typography } from 'antd';

import { androidInstallation, iosInstallation } from '../../utils/InstallationSteps';

const EsimTab = () => (
    <Tabs
        defaultActiveKey="1"
        items={[
            {
                key: '1',
                label: 'Android Devices',
                children: (
                    <Row className="">
                        <Col xs={24} md={17}>
                            <Flex vertical gap={10} className="mt-2">
                                {androidInstallation?.map((item, i) => (
                                    <Typography.Text className="text-sm font-medium">
                                        {`${i + 1}. ${item.title}:`}
                                        <Typography.Text className="text-sm font-normal ms-1">
                                            {item.content}
                                        </Typography.Text>
                                    </Typography.Text>
                                ))}

                                <Typography.Text className="text-sm font-medium my-4">
                                    Please note that the specific steps may vary slightly depending
                                    on the Android device model and the network carrier.
                                </Typography.Text>
                            </Flex>
                        </Col>
                    </Row>
                ),
            },
            {
                key: '2',
                label: 'iOS Devices',
                children: (
                    <Row>
                        <Col xs={24} md={17}>
                            <Flex vertical gap={10} className="mt-2">
                                {iosInstallation.map((item, i) => (
                                    <Typography.Text className="text-sm font-medium">
                                        {`${i + 1}. ${item.title}`}
                                        {i !== 0 && ':'}
                                        <Typography.Text className="text-sm font-normal ms-1">
                                            {i !== 0 && item.content}
                                        </Typography.Text>
                                    </Typography.Text>
                                ))}

                                <Typography.Text className="text-sm font-medium my-4">
                                    If you encounter any issues during the installation, you can
                                    reach out to your eSIM provider{`'`}s customer support for
                                    assistance.
                                </Typography.Text>
                            </Flex>
                        </Col>
                    </Row>
                ),
            },
        ]}
    />
);

export default EsimTab;
