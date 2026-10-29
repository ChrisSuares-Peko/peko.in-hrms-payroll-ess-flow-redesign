import React from 'react';

import { Flex, Image, Typography } from 'antd';

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
}

const FeatureCardMob: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
    <Flex
        vertical
        align="center"
        style={{
            borderRadius: '10px',
            background: '#FFF9F9',
            padding: '8px',
            height: '184px',
            overflow: 'hidden',
        }}
    >
        <Flex vertical>
            <Typography.Text
                className="font-medium"
                style={{
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: '600',
                    textAlign: 'center',
                    marginBottom: '8px',
                }}
            >
                {title}
            </Typography.Text>
            <Typography.Text
                style={{
                    color: '#666',
                    fontSize: '9px',
                    textAlign: 'center',
                    lineHeight: '1.4',
                }}
            >
                {description}
            </Typography.Text>
        </Flex>
        <Flex className="mt-4">
            <Image src={icon} alt={`${title} icon`} preview={false} height="80px" />
        </Flex>
    </Flex>
);

export default FeatureCardMob;
