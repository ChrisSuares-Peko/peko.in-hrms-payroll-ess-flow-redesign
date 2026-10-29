import React from 'react';

import { Flex, Typography } from 'antd';

const { Text } = Typography;

interface Props {
    icon: string;
    bg: string;
    title: string;
    subtitle: string;
}

const VendorSectionHeader: React.FC<Props> = ({ icon, bg, title, subtitle }) => (
    <Flex gap={14} align="center">
        <Flex
            align="center"
            justify="center"
            className="shrink-0 rounded-[10px]"
            style={{ background: bg, width: 37, height: 37 }}
        >
            <img src={icon} alt={title} style={{ width: 24, height: 24 }} />
        </Flex>
        <Flex vertical justify="space-between" style={{ minHeight: 35 }}>
            <Text strong style={{ fontSize: 14, lineHeight: '1.186' }}>{title}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{subtitle}</Text>
        </Flex>
    </Flex>
);

export default VendorSectionHeader;
