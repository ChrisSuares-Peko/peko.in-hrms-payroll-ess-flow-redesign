import React from 'react';

import { Flex, Image, Typography } from 'antd';

interface IconCardProps {
    icon: any;
    title: string;
    onClick?: () => void;
}
const { Text } = Typography;

const IconCardMobile = ({ icon, title, onClick }: IconCardProps) => (
    <Flex
        vertical
        gap={12}
        align="center"
        role="button"
        onClick={onClick}
        className="cursor-pointer w-1/4 transition duration-300 transform sm:hover:scale-110"
    >
        <Flex
            className="w-[4.5rem] h-[4.5rem] bg-bgIconCard rounded-lg"
            align="center"
            justify="center"
        >
            <Image
                src={icon}
                alt="icon"
                preview={false}
                height={46}
                width={46}
                className="object-contain"
            />
        </Flex>
        <Text className="text-[0.60rem] text-center">{title}</Text>
    </Flex>
);
export default React.memo(IconCardMobile);
