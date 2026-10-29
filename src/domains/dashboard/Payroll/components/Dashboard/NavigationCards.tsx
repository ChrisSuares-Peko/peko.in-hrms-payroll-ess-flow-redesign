import React from 'react';

import { Flex, Image, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { CardProps } from '@domains/dashboard/Payroll/types/types';

const NavigationCards = ({ icon, title, link, isActive, reference, onClick, iconWidth = 50 }: CardProps) => {
    const isActionOnly = !link && typeof onClick === 'function';

    const handleClick = () => {
        if (isActionOnly) {
            console.log('Clicked download payslip');
            onClick?.();
        }
    };

    const desktopCard = (
        <Flex
            ref={reference}
            vertical
            gap={18}
            align="center"
            justify="center"
            onClick={handleClick}
            role={isActionOnly ? 'button' : undefined}
            tabIndex={isActionOnly ? 0 : undefined}
            onKeyDown={
                isActionOnly
                    ? e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick?.();
                          }
                      }
                    : undefined
            }
            className="xs:hidden md:flex transition duration-300 transform hover:scale-110 cursor-pointer"
        >
            <Flex
                className="h-[90px] w-[90px] bg-[#F9F6F5] rounded-3xl"
                align="center"
                justify="center"
            >
                <Image width={iconWidth} preview={false} src={icon} />
            </Flex>
            <Typography.Text
                {...(!isActive && { disabled: true })}
                className="text-[13px] md:text-center w-24 break-normal min-h-10"
            >
                {title}
            </Typography.Text>
        </Flex>
    );

    const mobileCard = (
        <Flex
            align="center"
            justify="center"
            gap="middle"
            vertical
            onClick={handleClick}
            role={isActionOnly ? 'button' : undefined}
            tabIndex={isActionOnly ? 0 : undefined}
            onKeyDown={
                isActionOnly
                    ? e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick?.();
                          }
                      }
                    : undefined
            }
            className="md:hidden xs:flex my-2 cursor-pointer"
        >
            <Flex className="min-w-[4rem] h-14 bg-[#F9F6F5] rounded-xl justify-center">
                <Image width={iconWidth / 2} preview={false} src={icon} className="mt-5" />
            </Flex>
            <Typography.Text
                {...(!isActive && { disabled: true })}
                className="text-[.69rem] mt-2 w-full font-medium text-center"
            >
                {title}
            </Typography.Text>
        </Flex>
    );

    return (
        <>
            {isActionOnly ? desktopCard : <Link to={link}>{desktopCard}</Link>}
            {isActionOnly ? mobileCard : <Link to={link}>{mobileCard}</Link>}
        </>
    );
};

export default NavigationCards;
