import React from 'react';

import { Flex, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

interface RecentTransactionCardProps {
    title: string;
    time: string;
    date: string;
    value: number;
}

const { Text } = Typography;

const RecentTransactionCard = ({ title, time, date, value }: RecentTransactionCardProps) => (
    <Flex
        justify="space-between"
        className="w-full px-4 py-3 pr-4 border border-solid rounded-md md:pr-0 md:border-none md:px-0 md:py-0"
    >
        <Flex vertical className="gap-2 ">
            <Text className="font-normal"> {title}</Text>
            <Flex gap={10}>
                <Text className="text-xs text-gray-500">{time}</Text>
                <Text className="text-xs text-gray-500">{date}</Text>
            </Flex>
        </Flex>
        <Text className="text-sm font-normal text-right md:text-base md:font-medium">
            {`₹ ${formatNumberWithLocalString(value)}`}
        </Text>
    </Flex>
);

export default React.memo(RecentTransactionCard);
