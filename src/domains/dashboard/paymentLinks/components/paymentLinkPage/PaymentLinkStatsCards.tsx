import { Card, Col, Flex, Image, Row, Typography } from 'antd';

import LinkIcon from "../../assets/icons/link.svg"
import WalletIcon from "../../assets/icons/walleticon.svg"

interface PaymentLinkStatsCardsProps {
    activePaymentLinksCount: number;
    totalAmountThisMonth: number;
    isLoading: boolean;
}

const PaymentLinkStatsCards = ({
    activePaymentLinksCount,
    totalAmountThisMonth,
    isLoading,
}: PaymentLinkStatsCardsProps) => (
    <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
            <Card className="rounded-xl h-full bg-[#FDF6F0] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]" bordered={false} loading={isLoading}>
                <Flex vertical gap={10}>
                    <Flex
                        align="center"
                        justify="center"
                        className="w-9 h-9 rounded-full bg-white"
                    >
                        <Image src={LinkIcon} height={25} width={25}/>
                    </Flex>
                    <Typography.Title level={3} className="!mb-0 !font-bold">
                        {activePaymentLinksCount}
                    </Typography.Title>
                    <Typography.Text className="text-gray-500 text-sm">
                        Active Payment Links
                    </Typography.Text>
                </Flex>
            </Card>
        </Col>
        <Col xs={24} sm={12}>
            <Card
                className="rounded-xl h-full"
                bordered={false}
                loading={isLoading}
                style={{ background: '#ECF0FC' }}
            >
                <Flex vertical gap={10}>
                    <Flex
                        align="center"
                        justify="center"
                        className="w-9 h-9 rounded-full bg-white "
                    >
                        <Image src={WalletIcon} height={25} width={25}/>
                    </Flex>
                    <Typography.Title level={3} className="!mb-0 !font-bold">
                        {`₹${totalAmountThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                    </Typography.Title>
                    <Typography.Text className="text-gray-500 text-sm">
                        Payment Received This Month
                    </Typography.Text>
                </Flex>
            </Card>
        </Col>
    </Row>
);

export default PaymentLinkStatsCards;
