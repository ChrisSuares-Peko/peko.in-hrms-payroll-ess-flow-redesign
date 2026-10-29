import React from 'react';

import { Layout, Typography, Result, Button } from 'antd';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const PaymentSuccess: React.FC = () => (
    <Layout>
        <Content style={{ padding: '50px' }}>
            <Result
                status="success"
                title="Payment Successful!"
                subTitle="Thank you for your purchase. Your order has been processed."
                extra={[
                    <Button type="primary" key="dashboard">
                        Return to Dashboard
                    </Button>,
                    <Button key="order">View Order Details</Button>,
                ]}
            />
            <Title level={2}>Order Summary</Title>
            <Paragraph>
                This is a sample test page for the payment success screen. In a real application,
                you would display actual order details and transaction information here.
            </Paragraph>
        </Content>
    </Layout>
);

export default PaymentSuccess;
