import React from 'react';

import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import LandingPage from './LandingPage';
import SubscriptionPage from '../../IndividualPlan/pages/SubscriptionPage';
import { features, serviceDetails, subDescription } from '../utils/purchase-payroll';

const HomePage = () => (
    <SubscriptionPage
        accessCode={packageAccessKeys.Payroll}
        serviceAccessKey={accessKeys.payroll}
        features={features}
        serviceName="Payroll"
        title="One platform for everything HR – payroll, benefits, onboarding, leave tracking, and  compliance"
        serviceDetails={serviceDetails}
        subDescription={subDescription}
    >
        <LandingPage />
    </SubscriptionPage>
);

export default HomePage;
