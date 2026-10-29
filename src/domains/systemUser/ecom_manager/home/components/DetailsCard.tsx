import React from 'react';

import { Card, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface DetailsCardProps {
    bgColor: string;
    icon: string;
    title: string;
    amount: number;
}
const DetailsCard = ({ bgColor, icon, title, amount }: DetailsCardProps) => (
    <Card bordered={false} className={`${bgColor} rounded-xl border-1 w-100`}>
        <Flex vertical gap={15}>
            <Flex className="w-10 h-10 bg-white rounded-full" align="center" justify="center">
                <ReactSVG src={icon} />
            </Flex>
            <Typography.Text className="text-sm ">{title}</Typography.Text>
            <Typography.Title level={4}>{amount}</Typography.Title>
        </Flex>
    </Card>
);

export default DetailsCard;
