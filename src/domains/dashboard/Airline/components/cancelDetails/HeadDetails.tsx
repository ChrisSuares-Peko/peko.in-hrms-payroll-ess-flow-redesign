import React from 'react';

import { Flex, Row, Typography } from 'antd';

interface HeadPartProps {
    title: string;
}

export default function HeadPart({ title }: HeadPartProps) {
    return (
        <Row justify="space-between">
            <Flex vertical gap={14}>
                <Typography.Text className="text-xl font-medium">{title}</Typography.Text>
            </Flex>
        </Row>
    );
}
