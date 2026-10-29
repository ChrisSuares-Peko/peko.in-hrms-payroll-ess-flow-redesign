import React from 'react';

import { Col, Flex, Row, Tabs, TabsProps, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import useHideWidgetOnDrawer from '@components/molecular/freshChat/hooks/useHideWidgetOnDrawer';

import PlanCard from '../components/StorageSettings/PlanCard';

const Settings = () => {
    useHideWidgetOnDrawer(true);
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Storage Settings',
            children: <PlanCard />,
        },
        {
            key: '2',
            label: 'General Settings',
            children: <Flex>General Settings</Flex>,
            disabled: true,
        },
    ];
    return (
        <Content>
            <Typography.Text className="text-xl font-medium ">Settings</Typography.Text>
            <Row>
                <Col xs={24} className="mt-5">
                    <Tabs defaultActiveKey="1" items={items} />
                </Col>
            </Row>
        </Content>
    );
};

export default Settings;
