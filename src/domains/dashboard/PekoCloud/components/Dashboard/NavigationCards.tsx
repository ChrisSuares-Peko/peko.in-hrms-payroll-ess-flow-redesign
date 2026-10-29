import React from 'react';

import { Flex, Grid, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { CardProps } from '@domains/dashboard/PekoCloud/types/types';

const NavigationCards = ({ icon, title, link, isActive }: CardProps) => {
    const screens = Grid.useBreakpoint();

    return (
        <Link to={link}>
            <Flex
                vertical
                gap={12}
                align="center"
                justify="center"
                className="h-30 w-[21vw] sm:h-30 sm:w-24 transition duration-300 transform cursor-pointer hover:scale-110 "
            >
                <Flex
                    className="h-[21vw] w-[21vw] sm:h-24 sm:w-24 bg-bgIconCard rounded-xl sm:rounded-3xl"
                    align="center"
                    justify="center"
                >
                    <Image width={screens.md ? 35 : 26} preview={false} src={icon} />
                </Flex>
                <Typography.Text
                    {...(!isActive && { disabled: true })}
                    className="text-xs text-center text-wrap"
                >
                    {title}
                </Typography.Text>
            </Flex>
        </Link>
    );
};

export default NavigationCards;
