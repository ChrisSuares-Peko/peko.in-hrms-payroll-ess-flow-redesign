import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Input, Row } from 'antd';

type Props = {};

const Header = (props: Props) => (
    <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} md={12}>
            <Input
                placeholder="Search Orders"
                suffix={<SearchOutlined />}
                allowClear
                type="text"
                maxLength={100}
                className="customInput"
            />
        </Col>
        <Col className="w-full sm:w-fit">
            <DatePicker.RangePicker />
        </Col>
        <Col className="w-full sm:w-fit">
            <Button type="primary" className="w-full" danger>
                Add Order
            </Button>
        </Col>
    </Row>
);

export default Header;
