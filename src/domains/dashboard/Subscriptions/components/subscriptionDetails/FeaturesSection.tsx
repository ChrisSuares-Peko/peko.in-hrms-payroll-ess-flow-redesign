import React from 'react';

import { Col, Typography, ConfigProvider, List, Row, Empty } from 'antd';

import '@domains/dashboard/Subscriptions/assets/styles/styles.css';

interface feature {
    feature?: string;
}

const { Text, Title } = Typography;

function FeaturesSection({ feature }: feature) {
    const data = feature?.split('\n').filter(item => item.trim() !== '') || [];

    const themeConfig = {
        components: {
            Table: {
                rowHoverBg: 'inherit',
            },
        },
    };

    return (
        <ConfigProvider theme={themeConfig}>
            <Col span={24}>
                <Title level={5} className="mt-6">
                    Features
                </Title>
                {data?.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span>No Data</span>}
                    />
                ) : (
                    <List
                        className="mt-4"
                        dataSource={data}
                        renderItem={(item, index) => (
                            <Row
                                className={`py-4 px-6 
                        ${
                            index % 2 === 0 ? 'bg-listBg' : 'bg-white'
                        } ${index === data!.length - 1 ? '' : 'border-none'}`}
                            >
                                <Col span={24}>
                                    <Text className="text-gray-600 text-base">{item}</Text>
                                </Col>
                            </Row>
                        )}
                    />
                )}
            </Col>
        </ConfigProvider>
    );
}

export default FeaturesSection;
