import React from 'react';

import useScreenSize from '@src/hooks/useScreenSize';

import OrderHistoryMobile from '../components/OrderHistoryMobile';
import OrderHistoryWeb from '../components/OrderHistoryWeb';

const OrderHistory = () => {
    const screen = useScreenSize();
    return screen.xs ? <OrderHistoryMobile /> : <OrderHistoryWeb />;
};

export default OrderHistory;
