import React from 'react';

import { Flex, Typography } from 'antd';

import { TabLayout } from '../../../utils/vpsTabUtils';

const { Title } = Typography;

const SUPPORT_ITEMS = [
    'Boot, Login, Investigating Network/Hardware related issues',
    'Initial module installation and basic firewall setup',
    'Setup and re-installation of KVM VPS',
    'Core OS Upgrades & Patches',
    'Reverse DNS Setup',
];

const SupportTab: React.FC = () => (
    <TabLayout>
        <Title level={5} style={{ marginBottom: 6 }}>
            We are available 24/7 to help you with your queries
        </Title>
        <p className="text-gray-600 mb-3" style={{ fontSize: 13 }}>
            Our servers include semi-managed support related to:
        </p>
        <Flex vertical gap={6}>
            {SUPPORT_ITEMS.map(item => (
                <Flex key={item} align="flex-start" gap={8}>
                    <span className="text-lightRed leading-5 shrink-0" style={{ fontSize: 16 }}>•</span>
                    <span className="text-gray-600" style={{ fontSize: 13 }}>{item}</span>
                </Flex>
            ))}
        </Flex>
    </TabLayout>
);

export default SupportTab;
