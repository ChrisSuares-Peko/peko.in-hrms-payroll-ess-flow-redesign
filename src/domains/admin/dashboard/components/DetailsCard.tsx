import React from 'react';

import { Card, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import { formatNumberWithLocalString } from '@utils/priceFormat';

interface DetailsCardProps {
    icon: string;
    title: string;
    amount: number | undefined | string;
    isAmount?: boolean;
}
const DetailsCard = ({ icon, title, amount, isAmount = false }: DetailsCardProps) => (
    <Card className="w-full h-full border-0 shadow-none bg-bgIconCard rounded-xl ">
        <Flex justify="start" gap={20} align="center" className="h-full">
            <Flex className="w-10 h-10 bg-white rounded-full" align="center" justify="center">
                <ReactSVG src={icon} />
            </Flex>
            <Flex vertical gap={5}>
                <Typography.Text className="text-sm ">{title}</Typography.Text>
                <Typography.Text className="text-lg font-semibold">
                    {isAmount ? `₹ ${formatNumberWithLocalString(Number(amount))}` : amount}
                </Typography.Text>
            </Flex>
        </Flex>
    </Card>
);

export default DetailsCard;
