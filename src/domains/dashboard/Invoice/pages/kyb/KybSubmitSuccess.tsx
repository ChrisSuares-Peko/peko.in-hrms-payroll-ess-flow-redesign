import React from 'react';

import { Button, Flex, Result } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const KybSubmitSuccess = () => (
    <Content className="flex items-center justify-center mt-20 md:mt-40">
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
            <Result
                className="p-0"
                icon={<Lottie options={defaultOptions} height={80} />}
                status="success"
                title="Your KYB has been successfully submitted"
                extra={[
                    <Flex justify="center" gap={15} key="btn">
                        <Link to="../">
                            <Button type="primary" danger>
                                Go to Invoicing
                            </Button>
                        </Link>
                    </Flex>,
                ]}
            />
        </Flex>
    </Content>
);

export default KybSubmitSuccess;
