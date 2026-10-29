
import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Input, Row } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import { getPayslipColumns, payslipData } from '../../utils/salaryTable/payslipDetails';


const PayslipTab = () => (
        <Row>
         
            <Col span={24} className="my-5">
                <Input
                    placeholder="Search"
                    prefix={<SearchOutlined />}
                   
                    allowClear
                />
            </Col>
            <Col span={24}>
                <GenericTable
                    columns={getPayslipColumns()}
                    dataSource={payslipData}
                    pagination={false}
                />
            </Col>
        </Row>
    );

export default PayslipTab;
