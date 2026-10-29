import React from 'react';

import { Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

import SoundBoxHeader from '../components/SoundBoxHeader';
import SoundboxOrderData from '../components/SoundboxOrderData';

const SoundboxOrderDetails = () => (
    <Content className="px-0 sm:px-6">
        <Flex vertical gap={40}>
            <SoundBoxHeader />
            <SoundboxOrderData />
        </Flex>
    </Content>
);

export default SoundboxOrderDetails;
