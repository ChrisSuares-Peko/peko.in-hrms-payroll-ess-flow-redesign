import React from 'react';

import { Col, Flex, Typography } from 'antd';

type Props = {
    label?: string;
    value?: string;
    valueColor?: string;
};

const TextCard = ({ label, value, valueColor }: Props) => (
    <Col span={12} sm={8} md={6} lg={4}>
        <Flex vertical gap={10}>
            {label && <Typography.Text className="text-gray-400">{label}</Typography.Text>}
            <Typography.Text className={valueColor && `text-[${valueColor}]`}>
                {value}
            </Typography.Text>
        </Flex>
    </Col>
);

export default TextCard;
