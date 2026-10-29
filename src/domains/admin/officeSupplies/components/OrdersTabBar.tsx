import type { FC } from 'react';

import { Badge, Tabs } from 'antd';

export type OrdersTabKey = 'orders' | 'cancellations' | 'returns' | 'issues';

type Props = {
    activeTab: OrdersTabKey;
    onChange: (key: OrdersTabKey) => void;
    issuesCount?: number;
};

/**
 * Visual tab strip shared by the Orders hub page. Switches content via local
 * state, not route navigation — a separate route per tab (e.g. `/manage/issues`)
 * trips `RoleGuard`'s per-route permission check for a "service" that doesn't
 * exist in any role's permissions yet, showing Access Denied. Every tab lives
 * under whichever single route the hub was mounted at.
 */
const OrdersTabBar: FC<Props> = ({ activeTab, onChange, issuesCount }) => {
    const items = [
        { key: 'orders', label: 'All orders' },
        { key: 'cancellations', label: 'Cancellations & Refunds' },
        { key: 'returns', label: 'Returns' },
        {
            key: 'issues',
            label: issuesCount ? (
                <Badge count={issuesCount} offset={[8, 0]} color="#ef4444">
                    Issues
                </Badge>
            ) : (
                'Issues'
            ),
        },
    ];

    return <Tabs activeKey={activeTab} items={items} onChange={key => onChange(key as OrdersTabKey)} />;
};

export default OrdersTabBar;
