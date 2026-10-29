import React from 'react';

import { Flex, Typography } from 'antd';

import CustomerTable from '../components/customers/CustomerTable';

const { Text } = Typography;

const Customers = () => (
    <Flex vertical gap={18} className="w-full">
        <Text className="text-xl font-medium">Customers</Text>
        <CustomerTable />
    </Flex>
);

export default Customers;
