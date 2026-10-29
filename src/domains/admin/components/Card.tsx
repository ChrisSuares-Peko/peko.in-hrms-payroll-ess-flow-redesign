import React from 'react';

import { Badge, Flex, Grid, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

interface IconCardProps {
    icon: string;
    title: string;
    path?: string;
    count?: string;
}

const Card: React.FC<IconCardProps> = ({ icon, title, path, count }) => {
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const navigate = useNavigate();

    const handleClick = () => {
        if (path) {
            navigate(path);
        } else console.log('TRIGGERED');
    };

    return (
        <Flex vertical align="center">
            <Badge count={count || 0}>
                <Flex
                    onClick={() => handleClick()}
                    vertical
                    align="center"
                    className="transition duration-300 transform cursor-pointer hover:scale-105"
                >
                    <Flex
                        className={`w-16 h-16 sm:w-[6.75rem] sm:h-28 bg-bgIconCard rounded-2xl sm:rounded-3xl `}
                        align="center"
                        justify="center"
                    >
                        <ReactSVG
                            className="more-services"
                            beforeInjection={svg => {
                                if (screens.xs) {
                                    svg.setAttribute('style', 'width: 20px; height: 20px;');
                                }
                            }}
                            src={icon}
                        />
                    </Flex>
                    <Typography.Text className="text-[.65rem] text-center sm:text-[0.875rem] min-h-9 sm:min-h-14 line-clamp-2 pt-1 sm:pt-3">
                        {title}
                    </Typography.Text>
                </Flex>
            </Badge>
        </Flex>
    );
};

export default Card;
