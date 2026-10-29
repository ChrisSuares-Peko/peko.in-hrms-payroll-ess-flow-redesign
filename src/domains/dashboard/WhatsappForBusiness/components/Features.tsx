import React from 'react';

import { Flex, Image, Typography } from 'antd';

const { Text } = Typography;

interface FeatureCardProps {
    icon: string;
    title: string;
    description?: string;
    bgColor: string;
    iconStyle: any;
}
const Features: React.FC<FeatureCardProps> = ({ icon, title, description, bgColor, iconStyle }) => (
    <Flex
        vertical
        align="center"
        className="mt-8 cursor-pointer rounded-2xl"
        gap={8}
        justify="center"
        style={{
            background: bgColor,
            padding: '16px',
            height: '250px',
            overflow: 'hidden',
        }}
    >
        {icon && (
            <Flex>
                <Image src={icon} style={iconStyle} alt={`${title} icon`} preview={false} />
            </Flex>
        )}
        {description && (
            <Flex justify="center">
                <Text
                    className="font-normal w-2/3"
                    style={{
                        color: '#000',
                        fontSize: '18px',
                        textAlign: 'center',
                    }}
                >
                    {description}
                </Text>
            </Flex>
        )}
    </Flex>
);

export default React.memo(Features);
