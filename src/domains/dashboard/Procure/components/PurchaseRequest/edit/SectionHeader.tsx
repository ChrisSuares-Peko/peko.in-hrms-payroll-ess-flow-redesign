import React from 'react';

import { Flex, Typography } from 'antd';

const { Text } = Typography;

interface Props {
    icon: string;
    title: string;
    subtitle: string;
    iconSize?: number;
}

const SectionHeader: React.FC<Props> = ({ icon, title, subtitle, iconSize = 20 }) => (
    <Flex gap={14} align="center" className="mb-4">
        <Flex align="center" justify="center" className="shrink-0 w-[37px] h-[37px] rounded-[10px]" style={{ background: '#fff4f4' }}>
            <img src={icon} alt={title} style={{ width: iconSize, height: iconSize }} />
        </Flex>
        <Flex vertical gap={2}>
            <Text strong className="text-sm block">{title}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{subtitle}</Text>
        </Flex>
    </Flex>
);

export default SectionHeader;
