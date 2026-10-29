import React from 'react';

import { Flex, Typography } from 'antd';

import { trustBadges } from '@utils/plansLandingData';

import checkSeal from './assets/check-seal.svg';

const TrustBadges: React.FC = () => (
    <Flex wrap="wrap" align="center" justify="center" gap={24} className="px-4 py-2">
        {trustBadges.map(badge => (
            <Flex key={badge} align="center" gap={8}>
                <img src={checkSeal} alt="" aria-hidden className="h-4 w-4" />
                <Typography.Text className="text-sm text-textHeadings">{badge}</Typography.Text>
            </Flex>
        ))}
    </Flex>
);

export default TrustBadges;
