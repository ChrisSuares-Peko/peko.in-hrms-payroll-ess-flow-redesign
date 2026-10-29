import type { FC } from 'react';

import { Flex } from 'antd';

import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import SubscriptionPage from '../../IndividualPlan/pages/SubscriptionPage';
import ActionsHeader from '../components/landingPage/ActionsHeader';
import SignDeskBranding from '../components/SignDeskBranding';
import { eSignFeatures, serviceDetails, subDescription } from '../utils/features';

interface LandingPageProps {}

const LandingPage: FC<LandingPageProps> = () => (
    <SubscriptionPage
        serviceName="eSign"
        title="From signing to storing and sharing, manage every | document digitally in one easy, secure platform"
        serviceDetails={serviceDetails}
        subDescription={subDescription}
        accessCode={packageAccessKeys.eSign}
        serviceAccessKey={accessKeys.eSign}
        features={eSignFeatures}
    >
        <Flex vertical>
            <ActionsHeader />
            {/* <ESignHeader /> */}

            <SignDeskBranding position="center" />
        </Flex>
    </SubscriptionPage>
);

export default LandingPage;
