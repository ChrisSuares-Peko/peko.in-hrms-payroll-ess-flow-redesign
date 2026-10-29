import React from 'react';

import { Content } from 'antd/es/layout/layout';

import OrderHistoryPage from '@src/domains/dashboard/Subscriptions/components/orderHistory/OrderHistoryPage';
import useScreenSize from '@src/hooks/useScreenSize';

import OrderHistoryMobileView from '../components/orderHistory/OrderHistoryTableMobile';

type Props = {};

const SubscriptionOrderHistory = (props: Props) => {
    const { xs } = useScreenSize();
    return (
        <Content className="mb-20 mt-6">
            {xs ? <OrderHistoryMobileView /> : <OrderHistoryPage />}
        </Content>
    );
};

export default SubscriptionOrderHistory;
