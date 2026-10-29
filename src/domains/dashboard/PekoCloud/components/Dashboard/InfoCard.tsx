import { Flex, Grid, Statistic, Typography } from 'antd';
import CountUp from 'react-countup';
import { ReactSVG } from 'react-svg';

import { InfoCardProps } from '@domains/dashboard/PekoCloud/types/dash/index';

const formatter = (value: any, isCurrency: boolean) => (
    <CountUp end={value} separator="," decimals={isCurrency ? 2 : 0} />
);
const InfoCard = ({ icon, title, value: OValue, isCurrency, bgColor }: InfoCardProps) => {
    const screens = Grid.useBreakpoint();
    return (
        <Flex
            vertical
            className={`${bgColor} rounded-2xl py-3 lg:py-4 pl-5 md:pl-7 pr-3 flex-1 `}
            gap={4}
        >
            <Flex className="w-8 h-8 bg-white rounded-full" align="center" justify="center">
                <ReactSVG src={icon} />
            </Flex>

            {!screens.sm && (
                <Typography.Text className="sm:min-w-28 font-medium">{title}</Typography.Text>
            )}

            {isCurrency ? (
                <Flex align="baseline">
                    <Typography.Text
                        ellipsis
                        className={` md:text-xl font-semibold sm:font-normal xs:text-xl`}
                    >
                        ₹ &nbsp;
                    </Typography.Text>

                    <Typography.Text
                        ellipsis
                        className={` text-base md:font-semibold xs:font-medium sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28`}
                    >
                        <Statistic
                            value={Number(OValue)?.toFixed(2)}
                            formatter={(value: any) => formatter(value, isCurrency)}
                            precision={0}
                            className="payroll-dashboard"
                        />
                    </Typography.Text>
                </Flex>
            ) : (
                <Typography.Text
                    ellipsis
                    className={` text-base md:font-semibold xs:font-medium sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28`}
                >
                    <Statistic
                        className="payroll-dashboard"
                        value={Number(OValue)?.toFixed(0)}
                        formatter={(value: any) => formatter(value, false)}
                        precision={0}
                    />
                </Typography.Text>
            )}
            {screens.sm && (
                <Typography.Text className=" text-xs font-normal truncate text-nowrap sm:min-w-28">
                    {title}
                </Typography.Text>
            )}
        </Flex>
    );
};

export default InfoCard;
