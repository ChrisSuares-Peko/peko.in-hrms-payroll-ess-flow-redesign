import React, { lazy } from 'react';

import { Result, Flex, Button } from 'antd';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { paths } from '@src/routes/paths';

const PaymentTable = lazy(() => import('./SuccessTable'));

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const ComplaintSuccess = () => {
    const subTitleMessage =
        'Thank you for reaching out to us. Your complaint has been received and is now in our queue for review. We will work diligently to resolve your concern and will keep you updated on our progress.';

    return (
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
            <Result
                className="md:w-3/6 p-0"
                icon={<Lottie options={defaultOptions} height={100} />}
                status="success"
                title="Your Complaint is registered"
                subTitle={subTitleMessage}
                extra={[
                    <Flex justify="center" className="flex flex-col gap-4 sm:flex-row" key="btn">
                        <Link to={`${paths.dashboard.billPayments}`}>
                            <Button type="primary" danger>
                                Go to Bill Payment
                            </Button>
                        </Link>
                        <Link
                            to={`${paths.dashboard.billPayments}/${paths.billPayments.complaintRegistration}`}
                        >
                            <Button>Track Complaints</Button>
                        </Link>
                    </Flex>,
                ]}
            />
            <PaymentTable />
        </Flex>
    );
};

export default ComplaintSuccess;
