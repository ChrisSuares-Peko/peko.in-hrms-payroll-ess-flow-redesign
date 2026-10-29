import React, { useEffect, useState, useMemo, useCallback } from 'react';

import { Flex, Tabs, TabsProps } from 'antd';
import { useLocation } from 'react-router-dom';

import BillingHistory from '../components/billingHistory/BillingHistory';
import ManageSubscription from '../components/billingHistory/ManageSubscription';
import OrdersTable from '../components/billingHistory/OrderTable';

const BillingHistoryPage: React.FC = () => {
    const location = useLocation();
    const { activeTab } = location.state || {};

    const [activeTabKey, setActiveTabKey] = useState<string>(activeTab || '1');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [forceRemountKey, setForceRemountKey] = useState<number>(0);
    const [refresh, setRefresh] = useState<boolean>(false);

    const handleTabChange = useCallback((key: string) => {
        if (key === '2') {
            setForceRemountKey(prevKey => prevKey + 1);
        }
        setActiveTabKey(key);
    }, []);

    const items: TabsProps['items'] = useMemo(
        () => [
            {
                key: '1',
                label: 'Billing History',
                children: <OrdersTable refresh={refresh} setRefresh={setRefresh} />,
            },
            {
                key: '2',
                label: 'Top-Up History',
                children: <BillingHistory />,
            },
        ],
        [refresh]
    );

    useEffect(() => {
        if (items.length > 0 && !items.some(item => item.key === activeTabKey)) {
            handleTabChange(items[0].key);
        }
    }, [items, activeTabKey, handleTabChange]);

    return (
        <Flex vertical gap={20}>
            <ManageSubscription setRefresh={setRefresh} />
            <Tabs
                activeKey={activeTabKey}
                defaultActiveKey="1"
                items={items}
                onChange={handleTabChange}
            />
        </Flex>
    );
};

export default BillingHistoryPage;
