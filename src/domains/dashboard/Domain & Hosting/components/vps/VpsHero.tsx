import React from 'react';

import { Button, Flex, Typography } from 'antd';

import CloudBasedSolutionPng from '../../assets/img/cloud_based_solution.png';

const { Title } = Typography;

const HERO_BULLETS = [
    'High performance NVMe SSD Storage Volumes',
    'Instant Provisioning',
    'Full Root Access',
];

interface VpsHeroProps {
    minPrice: number | null;
    onLearnMore?: () => void;
    onBuyPlans?: () => void;
}

const VpsHero: React.FC<VpsHeroProps> = ({ minPrice, onLearnMore, onBuyPlans }) => (
    <div
        className="rounded-2xl py-10 px-8"
        style={{
            background: 'linear-gradient(to bottom, #fff 0%, #FFF5F5 100%)',
        }}
    >
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <Flex vertical gap={16} className="flex-1 w-full">
                <Title level={3} style={{ margin: 0, lineHeight: 1.4, fontWeight: 700 }}>
                    High-Performance Servers For Faster Websites &amp; Applications With Linux KVM
                    VPS Server
                </Title>
                <Flex vertical gap={6}>
                    {HERO_BULLETS.map(item => (
                        <Flex key={item} align="center" gap={8}>
                            <span className="text-gray-600 leading-none" style={{ fontSize: 16 }}>•</span>
                            <span className="text-gray-600" style={{ fontSize: 14 }}>{item}</span>
                        </Flex>
                    ))}
                </Flex>
                {minPrice != null && (
                    <p className="text-textPrimary m-0" style={{ fontSize: 14 }}>
                        As low as <span className="text-savingsTagLightText">₹{minPrice}/mo</span>
                    </p>
                )}
                {onBuyPlans && (
                    <Button size="large" onClick={onBuyPlans} className="self-start bg-lightRed border-lightRed text-white">
                        Buy Now
                    </Button>
                )}
                {onLearnMore && (
                    <Button onClick={onLearnMore} className="self-start bg-lightRed border-lightRed text-white">
                        Learn More
                    </Button>
                )}
            </Flex>
            <img src={CloudBasedSolutionPng} alt="VPS Server" className="hidden lg:block w-64 h-auto shrink-0" />
        </div>
    </div>
);

export default VpsHero;
