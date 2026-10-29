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
}
const DashboardCard = ({
    bgColor,
    icon,
    title,
    value,
    currency,
    reference,
}: PriceInfoCardProps) => {
    const { Text } = Typography;
    return (
        <Flex
            vertical
            ref={reference}
            className={`${bgColor} rounded-2xl py-4 xxl:py-5 xl:pl-6 pl-6 pr-4 flex-1 `}
            gap={16}
        >
            <Flex className="w-8 h-8 bg-white rounded-full" align="center" justify="center">
                <ReactSVG src={icon} data-testid="icon-svg" />
            </Flex>
            <Flex vertical gap={3} className="">
                <Text className="text-base font-semibold sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28">
                    <Tooltip title={`${currency} ${value}`}>
                        <Statistic
                            prefix={
                                currency && (
                                    <Text className="text-sm font-normal md:text-sm">
                                        {currency}
                                    </Text>
                                )
                            }
                            data-testid="amount"
                            value={value}
                            className="-mt-3 collector-dashboard overflow-hidden"
                        />
                    </Tooltip>
                </Text>
                <Text className="text-xs font-normal md:text-sm sm:min-w-24 whitespace-nowrap  overflow-hidden truncate">
                    <Tooltip title={title} className="md:hidden">
                        {title}
                    </Tooltip>
                    <Text className="hidden md:block xxl:text-sm xl:text-xs">{title}</Text>
                </Text>
            </Flex>
        </Flex>
    );
};

export default React.memo(DashboardCard);
