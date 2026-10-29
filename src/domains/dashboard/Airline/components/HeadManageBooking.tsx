import React from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Flex, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

export default function HeadPart() {
    return (
        <Row justify="space-between">
            <Flex vertical gap={14}>
                <Typography.Text className="text-xl font-medium">
                    Manage Your Bookings
                </Typography.Text>
            </Flex>
            <Link to={`/${paths.needHelp.index}`}>
                <Typography.Text>
                    <QuestionCircleOutlined className="px-1" />
                    Support
                </Typography.Text>
            </Link>
        </Row>
    );
}
