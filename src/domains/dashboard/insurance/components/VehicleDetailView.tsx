import React from 'react';

import { Col, Typography } from 'antd';

const VehicleDetailView = () => (
    <>
        <Col span={18}>
            <Typography.Text className="text-lg font-medium">About</Typography.Text>
            <br />
            <Typography.Text>
                SBI General Insurance offers a wide range of general insurance products in retail
                and commercial space ranging from Motor, Health, Personal Accident, Travel and Home
                Insurance in the retail space and products like Aviation, Fire, Marine, Package,
                Construction & Engineering and Liability Insurance in the commercial space.
            </Typography.Text>
        </Col>
        <Col span={6} />
    </>
);

export default VehicleDetailView;
