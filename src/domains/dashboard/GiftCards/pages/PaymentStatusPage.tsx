import { Flex } from 'antd';

interface PaymentProps {
    paymentStatus?: Boolean;
}
const PaymentStatusPage = (paymentStatus: PaymentProps) => (
    <Flex justify="center" align="center">
        <div>Hi</div>
    </Flex>
);

export default PaymentStatusPage;
