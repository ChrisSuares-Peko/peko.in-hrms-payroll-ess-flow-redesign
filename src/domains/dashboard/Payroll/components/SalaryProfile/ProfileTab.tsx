import React from 'react';

import { Col,  Row, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import SalaryInfoHeader from './SalaryInfoHeader';
import {
    getSalaryBreakdownColumns,
    salaryBreakdownData,
} from '../../utils/salaryProfileColumns/SalaryDetails';

const ProfileTab = () => (
    <Row>
        <Col md={24}>
            {/* <SalaryProfileHeader /> */}
            <SalaryInfoHeader />
        </Col>
        <Col md={24} xs={24}>
            <GenericTable
                rowKey={record => record.id}
                columns={getSalaryBreakdownColumns()}
                dataSource={salaryBreakdownData}
                pagination={false}
            />
        </Col>
        <Col md={24}>
          
            <Row justify="space-between" className="mt-3" >
                <Col md={4}>
                    <Typography.Text className="text-xl font-medium">Net Salary</Typography.Text>
                </Col>
                <Col className="justify-start">
                    <Typography.Text className="text-xl font-semibold" style={{ color: '#27AE60' }}>
                        ₹ 100,000
                    </Typography.Text>
                </Col>
            </Row>
        </Col>
    </Row>
);

export default ProfileTab;
