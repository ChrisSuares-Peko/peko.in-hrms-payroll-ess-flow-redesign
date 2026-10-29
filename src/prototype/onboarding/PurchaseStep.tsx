// PROTOTYPE-SETUP: purchase step of the Payroll onboarding flow. The package prices come from
// buildDemoSubscription() (src/prototype/payrollSeed.ts) and are illustrative, so the step says so.
import { lazy } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Tag, Tooltip } from 'antd';

const SubscriptionLanding = lazy(() => import('@src/domains/dashboard/Payroll/pages/HomePage'));

const PurchaseStep = () => (
    <Flex vertical gap={8} className="w-full min-w-0">
        <Flex justify="flex-end">
            <Tooltip title="Prices on this screen are placeholders for the prototype, not Peko's live pricing.">
                <Tag icon={<InfoCircleOutlined />} color="gold" className="m-0" data-testid="illustrative-pricing">
                    Illustrative pricing
                </Tag>
            </Tooltip>
        </Flex>
        <SubscriptionLanding />
    </Flex>
);

export default PurchaseStep;
