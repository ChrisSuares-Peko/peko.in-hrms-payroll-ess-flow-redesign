// OrderHistory.tsx
import React from 'react';

import { Flex } from 'antd';

// Update the path accordingly

import useScreenSize from '@src/hooks/useScreenSize';

import HistoryTable from './HistoryTable';
import HistoryTableMobile from './HistoryTableMobile';

const OrderHistory: React.FC = () => {
    const screen = useScreenSize();

    return <Flex vertical>{screen.md ? <HistoryTable /> : <HistoryTableMobile />}</Flex>;
};

export default OrderHistory;
