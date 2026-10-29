import React from 'react';

import { Card, Badge, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface IconCardProps {
    icon: string;
    title: string;
    count: string;
}

const IconCard: React.FC<IconCardProps> = ({ icon, title, count }) => (
    <Card className="icon-card h-full rounded-2xl ">
        <Flex justify="center" className="mb-3">
            <Badge count={count} />
        </Flex>
        <Flex vertical align="center" justify="center" style={{ height: '100%' }}>
            <ReactSVG src={icon} />
        </Flex>

        <Flex vertical className="text-center mt-4">
            <Typography.Text>{title}</Typography.Text>
        </Flex>
    </Card>
);

export default IconCard;
