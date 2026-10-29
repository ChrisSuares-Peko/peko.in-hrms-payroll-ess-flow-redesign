import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

import { Description, Plans } from '../components/subscriptionPlans';
import SubscriptionContextProvider from '../contexts/SubscriptionPageContext';

const SubscriptionPlan = () => (
    <SubscriptionContextProvider>
        <Content className="my-6">
            <Flex vertical className="items-center pt-16 gap-10">
                <Description />
                <Plans />
            </Flex>
        </Content>
    </SubscriptionContextProvider>
);

export default SubscriptionPlan;
