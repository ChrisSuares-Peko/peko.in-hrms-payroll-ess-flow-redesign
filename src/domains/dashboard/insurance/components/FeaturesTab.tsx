import React from 'react';

import { Col, Typography } from 'antd';

import redTick from '@src/domains/dashboard/insurance/assets/svg/redTick.svg';
import xCircle from '@src/domains/dashboard/insurance/assets/svg/x-circle.svg';

import TabDetailsSection from './TabDetailsSection';
import { insuranceCoverage, insuranceNotCovered } from '../utils/data';

const FeaturesTab = () => (
    <Col className="my-6 ">
        <Typography.Text className="text-lg font-medium">What Is Covered</Typography.Text>
        <TabDetailsSection icon={redTick} details={insuranceCoverage} />
        <Typography.Text className="text-lg font-medium">What Is Not Covered</Typography.Text>
        <TabDetailsSection icon={xCircle} details={insuranceNotCovered} />
    </Col>
);

export default FeaturesTab;
