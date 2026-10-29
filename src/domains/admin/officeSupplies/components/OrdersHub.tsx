import { useState } from 'react';

import { Flex } from 'antd';

import CancelAndRefunds from './CancelAndRefunds';
import Issues from './Issues';
import OrderContent from './Orders';
import OrdersTabBar, { OrdersTabKey } from './OrdersTabBar';
import ReturnRequests from './ReturnRequest';
import useOpenIssuesCount from '../hooks/useOpenIssuesCount';

type Props = {
    initialTab: OrdersTabKey;
};

/**
 * Single routed page hosting all 4 Orders tabs. Mounted once per real route
 * (`/manage/orders`, `/manage/cancel-&-refunds`, `/manage/return-request`,
 * `/manage/issues` — each still permission-checked by RoleGuard on arrival,
 * same as before) — but once mounted, switching tabs is purely local state,
 * never a navigation, so it never re-triggers RoleGuard for a tab whose
 * "service" isn't in the current role's permissions.
 */
const OrdersHub = ({ initialTab }: Props) => {
    const [activeTab, setActiveTab] = useState<OrdersTabKey>(initialTab);
    const issuesCount = useOpenIssuesCount();

    return (
        <Flex vertical gap={20}>
            <OrdersTabBar activeTab={activeTab} onChange={setActiveTab} issuesCount={issuesCount} />
            {activeTab === 'orders' && <OrderContent />}
            {activeTab === 'cancellations' && <CancelAndRefunds />}
            {activeTab === 'returns' && <ReturnRequests />}
            {activeTab === 'issues' && <Issues />}
        </Flex>
    );
};

export default OrdersHub;
