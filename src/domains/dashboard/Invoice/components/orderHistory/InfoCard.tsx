import React from 'react';

import { Flex, Statistic, Tooltip, Typography } from 'antd';
import CountUp from 'react-countup';
import { ReactSVG } from 'react-svg';

interface InfoCardProps {
    icon: string;
    title: string;
    value: number | undefined | string;
    isCurrency: boolean;
    borderColor: string;
}

const { Text } = Typography;

const formatter = (value: number, isCurrency: boolean) => (
    <CountUp end={value} separator="," decimals={isCurrency ? 2 : 0} />
);

const InfoCard: React.FC<InfoCardProps> = React.memo(
    ({ icon, title, value, isCurrency, borderColor }: InfoCardProps) => (
        <Flex vertical className={`${borderColor} w-1/2 rounded-2xl p-5 border `} gap={7}>
            <Flex
                className="w-8 h-8 rounded-full xs:bg-red-50 md:bg-white"
                align="center"
                justify="center"
            >
                <ReactSVG src={icon} />
            </Flex>

            <Tooltip title={`₹  ${Number(value)}`}>
                <Flex gap={3} align="baseline">
                    {isCurrency && (
                        <Text ellipsis className="text-xs font-normal md:text-sm">
                            ₹ &nbsp;
                        </Text>
                    )}
                    <Text
                        ellipsis
                        className="text-base font-semibold sm:text-sm md:text-lg whitespace-nowrap"
                    >
                        <Statistic
                            value={Number(value)}
                            formatter={() => formatter(Number(value), isCurrency)}
                            precision={isCurrency ? 2 : 0}
                            className="payroll-dashboard"
                        />
                    </Text>
                </Flex>
            </Tooltip>

            <Text className="text-xs font-normal md:text-sm ">{title}</Text>
        </Flex>
    )
);

export default InfoCard;
