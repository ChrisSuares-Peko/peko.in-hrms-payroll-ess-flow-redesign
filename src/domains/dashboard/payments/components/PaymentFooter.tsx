import React from 'react';

import { Col, Flex, Image } from 'antd';

import AmericanExpressLogo from '../assets/images/American_Express_Logo.png';
import mastercardLogo from '../assets/images/Mastercard-logo.png';
import PcjDss from '../assets/images/PcjDss.png';
import VisaLogo from '../assets/images/Visa_Logo.png';

const PaymentFooter = () => (
    <Col span={24} className="mt-3">
        <Flex justify="end" align="center" gap={20}>
            <Image
                className="object-contain"
                src={mastercardLogo}
                height={28}
                width={50}
                preview={false}
            />
            <Image src={VisaLogo} height={15} preview={false} />
            <Image src={AmericanExpressLogo} height={25} preview={false} />
            <Image src={PcjDss} height={20} preview={false} />
        </Flex>
    </Col>
);

export default PaymentFooter;
