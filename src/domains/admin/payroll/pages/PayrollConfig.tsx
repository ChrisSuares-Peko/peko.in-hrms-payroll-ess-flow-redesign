import React from 'react';

import { Tabs, TabsProps } from 'antd';

import ProfessionalTax from '../components/ProfessionalTax';

const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Professional Tax',
        children: <ProfessionalTax />,
    },
];
const PayrollConfig = () => <Tabs defaultActiveKey="1" items={items} />;

export default PayrollConfig;
