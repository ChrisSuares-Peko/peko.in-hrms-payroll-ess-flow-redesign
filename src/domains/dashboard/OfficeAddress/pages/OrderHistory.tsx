import React from 'react';

import { Content } from 'antd/es/layout/layout';

import OrderHistoryTable from '@src/domains/dashboard/OfficeAddress/components/order-history/Table';

const OrderHistoryPage = () => (
    <Content>
        <OrderHistoryTable />
    </Content>
);

export default OrderHistoryPage;
