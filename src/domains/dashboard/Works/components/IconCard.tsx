import React from 'react';

import { Badge, Flex, Typography, Image, Col } from 'antd';

interface IconCardProps {
    icon: string;
    title: string;
    count: string;
}

const IconCard: React.FC<IconCardProps> = ({ icon, title, count }) => (
    <Col xs={24} md={12} lg={8}>
        <Flex vertical className=" border rounded-xl p-4 h-full">
            <Flex justify="center" className="mb-3">
                <Badge count={count} />
            </Flex>
            <Flex vertical align="center" justify="center" style={{ height: '100%' }}>
                <Image preview={false} src={icon} />
            </Flex>
            <Flex vertical className="text-center mt-4">
                <Typography.Text className="text-base font-normal">{title}</Typography.Text>
            </Flex>
        </Flex>
    </Col>
);

export default IconCard;
