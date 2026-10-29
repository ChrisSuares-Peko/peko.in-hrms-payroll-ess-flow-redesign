import { LinkOutlined, QrcodeOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Card, Divider, Flex, Typography } from 'antd';

interface TransactionSidebarProps {
    paymentMode: string;
    onNavigateDashboard: () => void;
    onNavigateTransactions: () => void;
}

const TransactionSidebar = ({
    paymentMode,
    onNavigateDashboard,
    onNavigateTransactions,
}: TransactionSidebarProps) => {
    console.log(paymentMode)
    const isQr = (paymentMode || '').toLowerCase().includes('qr code');
    const modeIcon = isQr
        ? <QrcodeOutlined style={{ color: '#fff', fontSize: 18 }} />
        : <LinkOutlined style={{ color: '#fff', fontSize: 18 }} />;
    const modeLabel = isQr ? 'QR Code' : 'Payment Link';
    const modeSubtitle = isQr ? 'Paid via QR code scan' : 'Paid via payment link';

    return (
        <Flex vertical gap={16}>

            {/* Payment Mode */}
            <Card
                styles={{ body: { padding: 20 } }}
                style={{ borderRadius: 16 }}
            >
                <Flex vertical gap={12}>
                    <Typography.Text strong style={{ fontSize: 16 }}>Payment Mode</Typography.Text>
                    <Card
                        styles={{ body: { padding: 12 } }}
                        style={{ borderRadius: 12, background: '#F9FAFB', border: 'none' }}
                    >
                        <Flex align="center" gap={12}>
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: '#EF4444',
                                    flexShrink: 0,
                                }}
                            >
                                {modeIcon}
                            </Flex>
                            <Flex vertical gap={2}>
                                <Typography.Text strong style={{ fontSize: 14 }}>
                                    {modeLabel}
                                </Typography.Text>
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    {modeSubtitle}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Card>
                </Flex>
            </Card>

            {/* Refund Policy */}
            <Card
                styles={{ body: { padding: 20, background: '#F3F4F6' } }}
                style={{ borderRadius: 16 }}
            >
                <Flex vertical gap={8}>
                    <Flex align="center" gap={8}>
                        <SafetyCertificateOutlined style={{ color: '#374151', fontSize: 16 }} />
                        <Typography.Text strong style={{ fontSize: 16 }}>Refund Policy</Typography.Text>
                    </Flex>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                        Refunds can be initiated within 7 days of the transaction. Processing time is 5–7 business days.
                    </Typography.Text>
                </Flex>
            </Card>

            {/* Quick Navigation */}
            <Card
                styles={{ body: { padding: 20 } }}
                style={{ borderRadius: 16 }}
            >
                <Flex vertical gap={12}>
                    <Typography.Text strong style={{ fontSize: 16 }}>Quick Navigation</Typography.Text>
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ cursor: 'pointer' }}
                        onClick={onNavigateDashboard}
                    >
                        <Typography.Text style={{ fontSize: 14, color: '#4B5563' }}>Back to Dashboard</Typography.Text>
                        <Typography.Text type="secondary">{'>'}</Typography.Text>
                    </Flex>
                    <Divider style={{ margin: 0 }} />
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ cursor: 'pointer' }}
                        onClick={onNavigateTransactions}
                    >
                        <Typography.Text style={{ fontSize: 14, color: '#4B5563' }}>View All Transactions</Typography.Text>
                        <Typography.Text type="secondary">{'>'}</Typography.Text>
                    </Flex>
                </Flex>
            </Card>
        </Flex>
    );
};

export default TransactionSidebar;
