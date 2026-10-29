import { useState } from 'react';

import { Button, Descriptions, Flex, Result, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';
import { useLocation } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';

import { SendEmailModal } from '../components/SendEmailModal';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const LinkCreated = () => {
    const location = useLocation();
    const [modalVisible, setModalVisible] = useState(false);
    const { paymentLink, paymentLinkForm, paymentLinkPayload } = location.state;
    const createdDate = paymentLinkForm.createdAt.split('T')[0];
    const expires_at = paymentLinkForm?.expiryDate;
    const amount = paymentLinkPayload?.amount;
    return (
        <>
            {/* <CustomBreadCrumb /> */}
            <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
                <Result
                    className="md:w-3/6  p-0"
                    icon={<Lottie options={defaultOptions} height={100} />}
                    status="success"
                    title="Payment Link Created"
                />
                <Content className="border rounded-md w-2/3 pl-10 py-6 ">
                    <Flex>
                        <Typography.Text>Payment Link :</Typography.Text>
                        <Typography.Paragraph
                            copyable
                            className="ml-2 text-red-500 custom-copyable "
                        >
                            {paymentLink}
                        </Typography.Paragraph>
                    </Flex>
                </Content>

                <Descriptions bordered size="middle" column={1} className="w-2/3 pg-success-table">
                    <Descriptions.Item label="Date:">{createdDate}</Descriptions.Item>

                    <Descriptions.Item label="Payment ID">
                        {paymentLinkForm.orderId}
                    </Descriptions.Item>

                    <Descriptions.Item label="Customer Name">
                        {paymentLinkForm.customerName}
                    </Descriptions.Item>

                    <Descriptions.Item label="Expiry Time">{expires_at}</Descriptions.Item>
                </Descriptions>
                <Flex gap={6} onClick={() => setModalVisible(true)} align="center">
                    <Button danger>Share link through email</Button>
                </Flex>

                <SendEmailModal
                    open={modalVisible}
                    handleCancel={() => setModalVisible(false)}
                    contactPerson={paymentLinkForm.customerName}
                    amount={amount}
                    link={paymentLink}
                />
            </Flex>
        </>
    );
};
export default LinkCreated;
