import React from 'react';

import { Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { paths } from '@src/routes/paths';

interface PriceInfoCardProps {
    bgColor: string;
    icon: any;
    title: string;
    value: string | number;
    currency: string;
    reference?: React.MutableRefObject<null>;
    isMobile?: boolean;
}

const PriceInfoCard = ({
    bgColor,
    icon,
    title,
    value,
    currency,
    reference,
    isMobile = false,
}: PriceInfoCardProps) => {
    const { Text } = Typography;
    const navigate = useNavigate();

    const handleClick = () => {
        if (title === 'Wallet') {
            navigate(`/${paths.pekoWallet.index}`);
        }
    };
    const isClickable = title === 'Wallet';

    if (isMobile) {
        return (
            <Flex
                ref={reference}
                align="center"
                className={`${bgColor} rounded-[18px] py-5 lg:py-5 pl-4 md:pl-8 pr-4 flex-1 max-w-[50%] h-[94px] ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                gap={8}
                onClick={handleClick}
            >
                <Flex className="bg-white rounded-full w-7 h-7" align="center" justify="center">
                    {icon && <ReactSVG data-testid="icon-svg-mobile" src={icon} />}
                </Flex>
                <Flex vertical gap={3}>
                    <Text className="text-[0.65rem] font-medium md:text-sm text-wrap sm:min-w-28">
                        {title}
                    </Text>
                    <Text className="text-[12px] font-semibold sm:text-sm md:text-lg whitespace-nowrap">
                        {currency} {value}
                    </Text>
                </Flex>
            </Flex>
        );
    }

    return (
        <Flex
            vertical
            ref={reference}
            className={`${bgColor} rounded-[18px] py-4 lg:py-5 pl-6 md:pl-8 pr-4 flex-1 md:max-w-[50%]`}
            gap={16}
            onClick={handleClick}
        >
            <Flex className="w-8 h-8 bg-white rounded-full" align="center" justify="center">
                {icon && <ReactSVG data-testid="icon-svg" src={icon} />}
            </Flex>
            <Flex vertical gap={3}>
                <Text className="text-base font-semibold cursor-default sm:text-sm md:text-lg whitespace-nowrap">
                    {currency} {value}
                </Text>
                <Text className="text-xs font-normal cursor-default md:text-sm text-nowrap sm:min-w-28">
                    {title}
                </Text>
            </Flex>
        </Flex>
    );
};

export default React.memo(PriceInfoCard);
