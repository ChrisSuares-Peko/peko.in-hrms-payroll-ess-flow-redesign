import React from 'react';

import { Flex, Typography } from 'antd';

import { landingHeader } from '@utils/plansLandingData';

const PlanHeader: React.FC = () => (
    <Flex vertical align="center" gap={8} className="px-4 py-6 text-center sm:py-8">
        <Typography.Title
            level={2}
            className="!mb-0 !text-2xl !font-bold !text-textHeadings sm:!text-3xl xxl:!text-4xl"
        >
            {landingHeader.title}
        </Typography.Title>
        <Typography.Text className="max-w-2xl text-sm text-textGray sm:text-base">
            {landingHeader.subtitle}
        </Typography.Text>
        <Typography.Text className="text-xs text-black sm:text-sm">
            {landingHeader.billingNote}
        </Typography.Text>
    </Flex>
);

export default PlanHeader;
