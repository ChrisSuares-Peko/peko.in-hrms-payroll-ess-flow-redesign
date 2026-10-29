import React from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

interface IconCardProps {
    icon: any;
    title: string;
    onClick?: () => void;
    label:string;
}

const { Text } = Typography;

const QuickActionCard: React.FC<IconCardProps> = ({ icon, title, onClick,label }) => (
    <Flex vertical gap={8} align="center">
        <Flex
            className="w-full h-24 cursor-pointer bg-bgIconCard rounded-3xl transition duration-300 transform hover:scale-110"
            align="center"
            role="button"
            onClick={onClick}
            justify="center"
        >
            <ReactSVG src={icon} />
        </Flex>
        <Text onClick={onClick} className="text-xs cursor-pointer" style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
            {title}
        </Text>
    </Flex>
);

export default React.memo(QuickActionCard);
