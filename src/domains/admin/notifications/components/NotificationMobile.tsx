import React from 'react';

import { Col, Empty, Flex, Row, Skeleton, Typography } from 'antd';

import TableMobile from './TableMobile';
import { NotificationData } from '../types/index';

type TicketProps = {
    data: NotificationData[];
    isLoading: boolean;
};

const NotificationsMobile: React.FC<TicketProps> = ({ data, isLoading }) => (
    <>
        <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
            <Col xs={7}>
                {' '}
                <Flex justify="start">
                    <Typography.Text>Date</Typography.Text>
                </Flex>
            </Col>
            <Col xs={7}>
                {' '}
                <Flex justify="center">
                    <Typography.Text>ID</Typography.Text>
                </Flex>
            </Col>
            <Col xs={7}>
                {' '}
                <Flex justify="center">
                    {' '}
                    <Typography.Text>Notification</Typography.Text>
                </Flex>
            </Col>
        </Row>
        {isLoading ? (
            <Skeleton paragraph={{ rows: 8 }} className="mt-5" />
        ) : (
            <Flex vertical className="h-full">
                {data.length > 0 ? (
                    data.map(ticket => <TableMobile key={ticket.id} data={ticket} />)
                ) : (
                    <Flex vertical justify="center" align="center" className="h-64">
                        <Empty description="No Notifications" />
                    </Flex>
                )}
            </Flex>
        )}
    </>
);

export default NotificationsMobile;
