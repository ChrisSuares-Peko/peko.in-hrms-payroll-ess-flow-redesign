import React from 'react';

import { Flex } from 'antd';

import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import SubscriptionPage from '../../IndividualPlan/pages/SubscriptionPage';
import HomePage from '../components/homepage/HomePage';
import { featureData, serviceDetails, subDescription } from '../utils/data';
import { SKIP_TURBO_SUBSCRIPTION_GATE } from '../utils/devFlags';

const Dashboard = () => {
    const { garage } = accessKeys;
    const { garage:packageAccessKey } =packageAccessKeys
    useScrollToTop();

    const content = (
        <Flex vertical>
            <HomePage />
        </Flex>
    );

    if (SKIP_TURBO_SUBSCRIPTION_GATE) return content;

    return (
        <SubscriptionPage
            serviceName="Turbo"
            title="Your Smart Vehicle and Driver Assistant"
            serviceDetails={serviceDetails}
            subDescription={subDescription}
            accessCode={packageAccessKey}
            serviceAccessKey={garage}
            features={featureData}
        >
            {content}
        </SubscriptionPage>
    );
};

export default Dashboard;
