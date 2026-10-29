import { Flex, Grid, Typography } from 'antd';
// import CountUp from 'react-countup';
import { ReactSVG } from 'react-svg';

import { InfoCardProps } from '@domains/dashboard/PekoCloud/types/types';

const SubscriptionInfoCard = ({ icon, title, value, isCurrency, bgColor }: InfoCardProps) => {
    const screens = Grid.useBreakpoint();

    return (
        <Flex
            className={`${bgColor} ${screens.sm ? 'rounded-2xl' : 'rounded-xl'} py-4 lg:py-7 pl-2 md:pl-7 pr-1 md:pr-3 flex-1 `}
            gap={10}
            align={`${screens.xs && 'center'}`}
        >
            <Flex
                className="w-9 h-9 xs:bg-white md:bg-white rounded-full"
                align="center"
                justify="center"
            >
                <ReactSVG src={icon} />
            </Flex>

            <Flex vertical className="p-0 m-0">
                {isCurrency ? (
                    <Flex align="baseline">
                        <Typography.Text ellipsis className={` text-xs font-normal md:text-sm`}>
                            ₹ &nbsp;
                        </Typography.Text>

                        <Typography.Text
                            className={` text-sm font-semibold sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28 p-0 m-0`}
                        >
                            {value}
                        </Typography.Text>
                    </Flex>
                ) : (
                    <Typography.Text
                        className={` text-sm font-semibold sm:text-sm md:text-lg whitespace-nowrap sm:min-w-28 p-0 m-0`}
                    >
                        {value}
                    </Typography.Text>
                )}

                <Typography.Text
                    className={`text-xs font-normal  ${screens.sm && 'text-nowrap'} sm:min-w-28`}
                >
                    {title}
                </Typography.Text>
            </Flex>
        </Flex>
    );
};

export default SubscriptionInfoCard;
