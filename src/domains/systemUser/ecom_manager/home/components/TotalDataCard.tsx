import React from 'react';

import { Card, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface TotalData {
    title: string;
    value?: string;
    icon: string;
}
const TotalDataCard = ({ title, value = '0', icon }: TotalData) => (
    <Card bordered={false} className="border border-solid">
        <Flex gap={30} justify="center" align="center" className="my-5">
            <Flex className="w-20 h-20 rounded-full bg-bgIconCard" align="center" justify="center">
                <ReactSVG src={icon} />
            </Flex>
            <Flex vertical gap={10} align="center">
                <Typography.Text className="text-lg">{title}</Typography.Text>
                <Typography.Text className="text-4xl font-medium">{value}</Typography.Text>
            </Flex>
        </Flex>
    </Card>
);

export default TotalDataCard;
