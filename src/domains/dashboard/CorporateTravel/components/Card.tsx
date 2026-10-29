import React from 'react';

import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import '../assets/styles.css';

interface IconCardProps {
    icon: string;
    title: string;
    path: string;
    status: string;
}

const Card: React.FC<IconCardProps> = ({ icon, title, path, status }) => {
    let color = '';

    if (status === 'Free') {
        color = 'text-green-500';
    } else if (status === 'New') {
        color = 'text-red-500';
    } else if (status === 'Coming soon') {
        color = 'text-orange-500';
    }

    return (
        <Link to={path}>
            <Flex vertical gap={10} align="center">
                <Flex
                    className={`w-[6rem] sm:w-[6.75rem] sm:h-[7rem]  h-[6rem] bg-bgIconCard rounded-2xl sm:rounded-3xl text-${color}`}
                    align="center"
                    justify="center"
                >
                    <ReactSVG className="corporate-travel" src={icon} />
                </Flex>
                <Typography.Text className="text-[.73rem] text-center sm:text-[0.875rem] ">
                    {title}
                </Typography.Text>
                <Typography.Text
                    className={`text-[.73rem] text-center sm:text-[0.875rem] ${color}`}
                >
                    {status}
                </Typography.Text>
            </Flex>
        </Link>
    );
};

export default Card;
