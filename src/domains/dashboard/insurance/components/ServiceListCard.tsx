import React from 'react';

import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { IconCardProps } from '../types/type';

const ServiceListCard: React.FC<IconCardProps> = ({ icon, title, path }) => (
    <Link to={path}>
        <Flex vertical gap={10} align="center">
            <Flex
                className=" w-full  h-32 bg-bgIconCard rounded-2xl sm:rounded-3xl "
                align="center"
                justify="center"
            >
                <ReactSVG src={icon} />
            </Flex>
            <Typography.Text className="text-center text-base ">{title}</Typography.Text>
        </Flex>
    </Link>
);

export default ServiceListCard;
