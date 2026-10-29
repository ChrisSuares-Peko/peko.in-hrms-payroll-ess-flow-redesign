import type { FC } from 'react';

import { Flex } from 'antd';

import OfficeSuppliesTop from '../components/OfficeSuppliesTop';
import OrderHistory from '../components/OrderHistory/OrderHistory';

interface OrderHistoryPageProps {}

/**
 * Keeps the shared header here so Order History has the Cart action (and its count
 * badge) like every other Office Supplies page. The header's own "Order History"
 * button hides itself on this route, and the default title is used rather than
 * "Order history" because HistoryTable/HistoryTableMobile already render that
 * heading above their filters.
 */
const OrderHistoryPage: FC<OrderHistoryPageProps> = () => (
    <Flex vertical gap={24}>
        <OfficeSuppliesTop />
        <OrderHistory />
    </Flex>
);

export default OrderHistoryPage;
