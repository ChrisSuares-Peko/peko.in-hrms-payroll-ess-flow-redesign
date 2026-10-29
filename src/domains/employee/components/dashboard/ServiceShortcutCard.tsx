import React from 'react';

import { Badge, Flex, Grid, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

interface ServiceShortcutCardProps {
    icon: string;
    title: string;
    path?: string;
    count?: string;
    // Rendered icon pixel size (non-xs breakpoint); the xs size scales down with it.
    iconSize?: number;
}

// Matches the Payroll dashboard's quick-access card size (96x96, 40px icon), on a
// #F9F6F5 background — dedicated to the employee ESS dashboard's shortcuts row.
const ServiceShortcutCard: React.FC<ServiceShortcutCardProps> = ({
    icon,
    title,
    path,
    count,
    iconSize = 60,
}) => {
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
                        className="w-24 h-24 rounded-3xl"
                        style={{ backgroundColor: '#F9F6F5' }}
                        align="center"
                        justify="center"
                    >
                        <ReactSVG
                            className="more-services flex items-center justify-center"
                            beforeInjection={svg => {
                                const size = screens.xs ? Math.round(iconSize * 0.52) : iconSize;
                                svg.setAttribute(
                                    'style',
                                    `width: ${size}px; height: ${size}px; display: block;`
                                );
                            }}
                            src={icon}
                        />
                    </Flex>
                    <Typography.Text className="text-[.65rem] text-center sm:text-[0.875rem] line-clamp-2 pt-1 sm:pt-3">
                        {title}
                    </Typography.Text>
                </Flex>
            </Badge>
        </Flex>
    );
};

export default ServiceShortcutCard;
