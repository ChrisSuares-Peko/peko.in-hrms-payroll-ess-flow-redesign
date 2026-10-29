import React, { Suspense, useState } from 'react';

import { Descriptions, Flex, Spin, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Link } from 'react-router-dom';
// import { ReactSVG } from 'react-svg';

// import email from '@domains/dashboard/Invoice/assets/mail.svg';
import { useAppSelector } from '@src/hooks/store';

import '../assets/style.css';
import SendEmailModal from './SendEmailModal';

const { Text, Paragraph } = Typography;

const PaymentTable = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const { paymentLink, Details, paymentLinkForm, paymentLinkPayload } = useAppSelector(
        store => store.reducer.invoices
    );

    const createdDate = paymentLinkForm.createdAt?.split('T')[0];
    // const expires_at = paymentLinkForm.expires_at?.split('T')[0];
    const amount = paymentLinkPayload?.amount || Details?.paymentDetails?.total;

    return (
        <>
            <Content className="w-2/3 py-6 pl-10 border rounded-md ">
                <Flex>
                    <Text>Payment Link :</Text>
                    <Link to={paymentLink} target="_blank">
                        <Paragraph
                            copyable
                            className="ml-2 text-red-500 cursor-pointer custom-copyable hover:underline"
                        >
                            {paymentLink}
                        </Paragraph>
                    </Link>
                </Flex>
            </Content>

            <Descriptions bordered size="middle" column={1} className="w-2/3 pg-success-table">
                <Descriptions.Item label="Date">{createdDate}</Descriptions.Item>

                <Descriptions.Item label="Payment ID">{paymentLinkForm.orderId}</Descriptions.Item>

                <Descriptions.Item label="Customer Name">
                    {paymentLinkForm.customerName}
                </Descriptions.Item>

                {/* <Descriptions.Item label="Expiry Date">{expires_at}</Descriptions.Item> */}
            </Descriptions>
            {/* <Flex align="center" gap={10}>
                <Text>Share payment link through </Text>
                <Button danger type="text" onClick={() => setModalVisible(true)}>
                    <ReactSVG src={email} />
                </Button>
            </Flex> */}
            <Suspense fallback={<Spin />}>
                <SendEmailModal
                    open={modalVisible}
                    handleCancel={() => setModalVisible(false)}
                    invoiceId={paymentLinkForm.orderId}
                    invoiceOnly={false}
                    amount={amount}
                    link={paymentLink}
                />
            </Suspense>
        </>
    );
};
export default PaymentTable;
