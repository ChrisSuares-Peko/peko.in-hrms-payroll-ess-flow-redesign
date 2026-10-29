import React from 'react';

import { Col, Flex, Image, Typography } from 'antd';

import mastercardsecure from '../assets/images/mastercardsecure.png';
import paytmseal from '../assets/images/paytmseal.png';
import rupay from '../assets/images/rupay.png';
import visaverified from '../assets/images/visaverified.png';

const { Text } = Typography;

const PaymentFooter = () => (
    <Col span={24} className="mt-5">
        <Flex
            justify="space-between"
            className="sm:flex-row flex-col sm:items-center sm:gap-0 gap-5 "
        >
            <Flex gap={25} align="center" justify="center">
                <Text className="text-gray-500">Terms of use</Text>
                <Text className="text-gray-500">Privacy Policy</Text>
                <Text className="text-gray-500">Refund Policy</Text>
            </Flex>

            <Flex gap={20} align="center" justify="center">
                <Image src={paytmseal} height={30} preview={false} />
                <Image src={rupay} height={20} preview={false} />
                <Image src={visaverified} height={20} preview={false} />
                <Image src={mastercardsecure} height={20} preview={false} />
            </Flex>
        </Flex>
    </Col>
);

export default PaymentFooter;
