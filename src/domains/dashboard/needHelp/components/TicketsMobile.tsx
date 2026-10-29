import React from 'react';

import { Col, Empty, Flex, Row, Skeleton, Typography } from 'antd';

import TableMobile from './TableMobile';
import { ticketListingTableData } from '../types/type';

const { Text } = Typography;

type TicketProps = {
    data: ticketListingTableData[];
    handleButtonClick: (record: ticketListingTableData) => void;
    isLoading: boolean;
};

const TicketsMobile: React.FC<TicketProps> = ({ data, handleButtonClick, isLoading }) => (
    <>
        <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
            <Col xs={7}>
                {' '}
                <Flex justify="start">
                    <Text>Date</Text>
                </Flex>
            </Col>
            <Col xs={7}>
                {' '}
                <Flex justify="center">
                    <Text>Module</Text>
                </Flex>
            </Col>
            <Col xs={7}>
                {' '}
                <Flex justify="center">
                    {' '}
                    <Text>Status</Text>
                </Flex>
            </Col>
        </Row>
        {isLoading ? (
            <Skeleton paragraph={{ rows: 5 }} className="mt-5" />
        ) : (
            <Flex vertical className="h-full">
                {data.length > 0 ? (
                    data.map(ticket => (
                        <TableMobile
                            handleButtonClick={handleButtonClick}
                            key={ticket.ticketId}
                            ticket={ticket}
                        />
                    ))
                ) : (
                    <Flex vertical justify="center" align="center" className="h-64">
                        <Empty description="No Tickets" />
                    </Flex>
                )}
            </Flex>
        )}
    </>
);

export default React.memo(TicketsMobile);
