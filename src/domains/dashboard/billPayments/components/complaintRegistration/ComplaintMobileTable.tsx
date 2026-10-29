import React from 'react';

import { Col, Empty, Flex, Row, Skeleton, Typography } from 'antd';

import MoreTransactions from '@assets/svg/moretransactions.svg';

import ComplaintMobileRow from './ComplaintMobileRow';

interface ComplaintMobileTableProps {
    complaints: any[];
    isLoading: boolean;
}

const ComplaintMobileTable: React.FC<ComplaintMobileTableProps> = ({ complaints, isLoading }) => (
    <Flex vertical className="mt-6 w-full">
        <Row align="middle" className="px-3 py-5 rounded-md bg-bgLightGray">
            <Col xs={7}>
                <Typography.Text>Date</Typography.Text>
            </Col>
            <Col xs={9}>
                <Typography.Text>Type</Typography.Text>
            </Col>
            <Col xs={7}>
                <Typography.Text>Status</Typography.Text>
            </Col>
        </Row>
        {isLoading ? (
            <Skeleton paragraph={{ rows: 6 }} className="mt-5" />
        ) : (
            <Flex vertical className="h-full">
                {complaints.length > 0 ? (
                    complaints.map(complaint => (
                        <ComplaintMobileRow key={complaint.id} complaint={complaint} />
                    ))
                ) : (
                    <Flex vertical justify="center" align="center" className="h-full py-6">
                        <Empty image={MoreTransactions} description="No data found" />
                    </Flex>
                )}
            </Flex>
        )}
    </Flex>
);

export default ComplaintMobileTable;
