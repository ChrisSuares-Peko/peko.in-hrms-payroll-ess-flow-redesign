import React from 'react';

import { Alert, Col, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import SalaryCompTable from './SalaryCompTable';
import DeductionCompTable from '../DeductionComponents/DeductionCompTable';

const SalaryComp: React.FC = () => (
    <Content>
        <Row>
            <Col span={24} className="mb-5 mt-5">
                <Alert
                    type="info"
                    showIcon
                    message="Let's set up your salary components here."
                    description="Earnings such as Basic Salary, HRA, and allowances contribute to gross salary, while deductions such as canteen, transport, or insurance charges reduce take-home pay without affecting CTC. Do not add statutory components such as EPF, ESI, Professional Tax or LWF here. These are managed separately from the employee's profile based on their salary and applicable compliance rules."
                />
            </Col>
            <Col xs={24} className="mb-8">
                <SalaryCompTable />
            </Col>
            <Col xs={24}>
                <DeductionCompTable />
            </Col>
        </Row>
    </Content>
);

export default SalaryComp;
