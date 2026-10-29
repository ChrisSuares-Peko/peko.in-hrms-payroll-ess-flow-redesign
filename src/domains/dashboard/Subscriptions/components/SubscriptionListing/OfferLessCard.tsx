import React from 'react';

import { Card, Flex, Image, Tooltip, Typography } from 'antd';
// import clevertap from 'clevertap-web-sdk';
import { useNavigate } from 'react-router-dom';

import { CardProps } from '@domains/dashboard/Subscriptions/types/types';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import defaultImage from '../../assets/images/defaultImage.png';

const OfferLessCard = ({ title, description, image, id }: CardProps) => {
    const navigate = useNavigate();
    const { md } = useScreenSize();
    const handleClick = (name: string) => {
        // clevertap.event.push('Softwares', {
        //     Page: 'Softwares',
        //     Action: `${name} clicked`,
        //     // Action:'softwares clicked',
        //     Email: user?.email,
        //     SubscriptionName: name,
        // });
        navigate(`/${paths.subscriptions.index}/${paths.subscriptions.details}/${id}`);
    };
    return (
        <Card
            className="transform border cursor-pointer xs:bg-white md:bg-white rounded-xl hover:scale-105"
            onClick={() => handleClick(title)}
            style={{
                transition: 'transform .3s ease-in-out', // Adjust the duration (0.5s) to change animation speed
            }}
        >
            {/* <Link to={`/${paths.subscriptions.index}/${paths.subscriptions.details}/${id}`}> */}
            <Flex vertical gap={10} align="center">
                <>
                    <Flex
                        className={` w-24 sm:w-20 md:h-28 xs:h-24 rounded-2xl sm:rounded-3xl`}
                        align="center"
                        justify="center"
                    >
                        <Image preview={false} fallback={defaultImage} src={image} width="70%" />
                    </Flex>
                    <Typography.Text className="mt-0 font-medium md:mt-3 md:text-lg line-clamp-1">
                        <Tooltip title={md ? '' : title}>{title}</Tooltip>
                    </Typography.Text>
                </>
                {/* 
                <Typography.Text className="md:text-[.75rem] xxl:text-sm text-center text-textGrey line-clamp-1 ">
                    {description}
                </Typography.Text> */}
            </Flex>
            {/* </Link> */}
        </Card>
    );
};

export default OfferLessCard;
