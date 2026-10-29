import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface IconCardProps {
    icon: any;
    title: string;
    onClick?: () => void;
}

const { Text } = Typography;

const BbpsIconCard: React.FC<IconCardProps> = ({ icon, title, onClick }) => (
    <Flex
        vertical
        gap={18}
        align="center"
        role="button"
        onClick={onClick}
        className="w-[90px] transition duration-300 transform cursor-pointer hover:scale-110"
    >
        <Flex
            className="w-[90px] h-[90px] shrink-0 bg-bgIconCard rounded-3xl"
            align="center"
            justify="center"
        >
            <ReactSVG
                src={icon}
                // Larger icons on smaller screens; large screens keep the 52px cap
                className="flex items-center justify-center leading-none [&_svg]:block [&_svg]:max-w-[60px] [&_svg]:max-h-[60px] lg:[&_svg]:max-w-[52px] lg:[&_svg]:max-h-[52px]"
            />
        </Flex>
        <Text className="text-sm text-center whitespace-nowrap">{title}</Text>
    </Flex>
);

export default React.memo(BbpsIconCard);
