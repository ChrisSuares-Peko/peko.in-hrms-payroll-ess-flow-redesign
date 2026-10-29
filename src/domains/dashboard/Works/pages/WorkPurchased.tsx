import React from 'react';

import { Result, Row } from 'antd';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const WorkPurchased = () => (
    <Row className=" justify-center px-0 sm:px-6">
        <Result
            className="md:w-3/6 "
            icon={<Lottie options={defaultOptions} height={100} />}
            status="success"
            title="Your starter plan for graphic design has been successfully purchased."
            subTitle="The next step is to book a meeting with the agency now."
        />
    </Row>
);

export default WorkPurchased;
