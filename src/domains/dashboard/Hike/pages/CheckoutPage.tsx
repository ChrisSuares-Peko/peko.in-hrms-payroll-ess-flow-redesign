import React from 'react';

import { Typography } from 'antd';

import Checkout from '../components/Checkout';

const { Text } = Typography;

const CheckoutPage: React.FC = () => (
    <>
        <Checkout />
        <Text className="text-medium font-medium mt-2">
            After the purchase, the voucher details will be sent to the employees via email.
        </Text>
    </>
);

export default CheckoutPage;
