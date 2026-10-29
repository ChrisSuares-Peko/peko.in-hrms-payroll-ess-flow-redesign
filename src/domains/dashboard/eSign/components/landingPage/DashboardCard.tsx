import React from 'react';

import { Flex, Statistic, Tooltip, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface PriceInfoCardProps {
    bgColor: string;
    icon: any;
    title: string;
    value: string | number;
    currency: string;
    reference?: React.MutableRefObject<null>;
    className: any;
}
const DashboardCard = ({
    bgColor,
    icon,
    title,
    value,
    currency,
    reference,
    className, // Destructure the className prop
}: PriceInfoCardProps) => {
    const { Text } = Typography;
    return (
        <Flex
            vertical
            ref={reference}
            className={`${bgColor} ${className} rounded-2xl py-4 xxl:py-5 xl:pl-6 pl-8 pr-4 flex-1`}
            gap={16}
        >
            <Flex className="w-8 h-8 bg-white rounded-full" align="center" justify="center">
                <ReactSVG src={icon} data-testid="icon-svg" />
            </Flex>
            <Flex vertical gap={3}>
                <Text className="text-base font-semibold sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28">
                    <Flex className={currency !== '' ? 'gap-1' : ''}>
                        <Text className="text-xs font-normal md:text-sm">{currency}</Text>
                        <Statistic
                            data-testid="amount"
                            value={value}
                            className="-mt-3 collector-dashboard"
                        />
                    </Flex>
                </Text>
                <Text className="text-xs font-normal md:text-sm sm:min-w-24 ">
                    <Tooltip title={title} className="sm:hidden">
                        {title}
                    </Tooltip>
                    <Text className="hidden sm:block">{title}</Text>
                </Text>
            </Flex>
        </Flex>
    );
};

export default DashboardCard;
