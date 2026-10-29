import React from 'react';

import { Content } from 'antd/es/layout/layout';

import Header from './Header';
import OrderContent from './OrderContent';

type Props = {};
const VisaApplications = (props: Props) => (
    <Content>
        <Header />
        <OrderContent />
    </Content>
);

export default VisaApplications;
