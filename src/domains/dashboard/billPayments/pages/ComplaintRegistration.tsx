import React from 'react';

import { Col, Flex, Row, Tabs } from 'antd';
import { TabsProps } from 'antd/lib';
import { ReactSVG } from 'react-svg';

import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';
import useScreenSize from '@src/hooks/useScreenSize';

import ComplaintRegistrationTable from '../components/complaintRegistration/ComplaintRegistrationTable';
import OrderHistory from '../components/OrderHistory';
import OrderHistoryMobileView from '../components/OrderHistoryMobileView';

const ComplaintRegistration = () => {
    const { xs } = useScreenSize();

    const items: TabsProps['items'] = [
        {
            key: '1',
            label: 'Order History',
            children: xs ? <OrderHistoryMobileView /> : <OrderHistory />,
        },
        {
            key: '2',
            label: 'Complaint Tracking',
            children: <ComplaintRegistrationTable />,
        },
    ];

    return (
        <Row>
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Flex justify="flex-end" align="center" style={{ width: '100%' }}>
                    <ReactSVG
                        src={BharathConnect}
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width: 85px; height: 40px;');
                        }}
                    />
                </Flex>
            </Col>
            <Col span={24}>
                <Tabs
                    defaultActiveKey="1"
                    items={items}
                    // onChange={handleTabChange}
                />
            </Col>
        </Row>
    );
};

export default ComplaintRegistration;
