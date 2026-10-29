import React from 'react';

import { Col, Row, Typography } from 'antd';

import redTick2 from '@src/domains/dashboard/insurance/assets/svg/redTick2.svg';

import TabDetailsSection from './TabDetailsSection';
import { claimProcessArray } from '../utils/data';

const ClaimProcessTab = () => (
    <Row className="my-4" gutter={20}>
        <Col md={12}>
            <Typography.Text className="text-lg font-medium">
                Cashless Claim Process
            </Typography.Text>
            <TabDetailsSection details={claimProcessArray} icon={redTick2} needRedLine width={24} />
        </Col>
        <Col md={12}>
            <Typography.Text className="text-lg font-medium">
                Reimbursement Claim Process
            </Typography.Text>
            <TabDetailsSection details={claimProcessArray} icon={redTick2} needRedLine width={24} />
        </Col>
    </Row>
);

export default ClaimProcessTab;
