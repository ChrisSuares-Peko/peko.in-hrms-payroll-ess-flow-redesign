import { Avatar, Button, Card, Col, Flex, Row, Select, Space, Typography } from 'antd';

const { Text, Title } = Typography;

const INTEGRATIONS = [
    {
        key: 'quickbooks',
        name: 'QuickBooks Online',
        initials: 'QB',
        bgColor: '#2CA01C',
        connected: true,
        subLabel: 'Peko Technologies Pvt. Ltd.',
    },
    {
        key: 'xero',
        name: 'Xero',
        initials: 'Xe',
        bgColor: '#13B5EA',
        connected: false,
        subLabel: 'Not connected',
    },
];

const EXAMPLE_POSTING = [
    { label: '5020 · Fees (Net)', amount: '₹847.46', bold: false },
    { label: '1410 · Input CGST Receivable (CGST 9.0%)', amount: '₹76.27', bold: false },
    { label: '1410 · Input SGST Receivable (SGST 9.0%)', amount: '₹76.27', bold: false },
    { label: 'Gross', amount: '₹1,000.00', bold: true },
];

const IntegrationsTab = () => (
    <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={10}>
            <Card className="rounded-2xl border-borderCard" styles={{ body: { padding: 24 } }}>
                <Space direction="vertical" size={4} className="mb-5 w-full">
                    <Title level={5} className="!mb-0 !text-textHeadings">
                        Integrations
                    </Title>
                    <Text className="text-xs text-textBody">Connect your accounting software.</Text>
                </Space>
                <Space direction="vertical" size={12} className="w-full">
                    {INTEGRATIONS.map(item => (
                        <Card
                            key={item.key}
                            className="rounded-xl border-borderCard"
                            styles={{ body: { padding: '12px 16px' } }}
                        >
                            <Flex align="center" gap={12}>
                                <Avatar
                                    shape="square"
                                    size={40}
                                    style={{
                                        backgroundColor: item.bgColor,
                                        borderRadius: 12,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                    }}
                                >
                                    {item.initials}
                                </Avatar>
                                <Space direction="vertical" size={2} className="flex-1">
                                    <Flex gap={8} align="center">
                                        <Text className="text-sm font-medium text-textHeadings">
                                            {item.name}
                                        </Text>
                                        {item.connected && (
                                            <Text className="text-xs font-medium text-savingsTagLightText">
                                                Connected
                                            </Text>
                                        )}
                                    </Flex>
                                    <Text className="text-xs text-textGreyLight">
                                        {item.subLabel}
                                    </Text>
                                </Space>
                                <Button danger size="small" className="shrink-0">
                                    {item.connected ? 'Manage' : 'Connect'}
                                </Button>
                            </Flex>
                        </Card>
                    ))}
                </Space>
            </Card>
        </Col>

        <Col xs={24} lg={14}>
            <Card className="rounded-2xl border-borderCard" styles={{ body: { padding: 24 } }}>
                <Space direction="vertical" size={4} className="mb-6 w-full">
                    <Title level={5} className="!mb-0 !text-textHeadings">
                        Card fees mapping (GST)
                    </Title>
                    <Text className="text-sm text-textBody">
                        Choose the default account for card transaction fees (FX, processing,
                        interchange). Fees are auto-mapped to this account on every export.
                    </Text>
                </Space>

                <Space direction="vertical" size={20} className="w-full">
                    <Space direction="vertical" size={4} className="w-full">
                        <Text className="text-sm font-medium text-textHeadings">
                            Default fees account
                        </Text>
                        <Select placeholder="Select" options={[]} className="w-full" />
                        <Text className="text-xs text-textGreyLight">
                            Only the amount paid to the vendor needs manual mapping in the
                            Accounting Export.
                        </Text>
                    </Space>

                    <Space direction="vertical" size={4} className="w-full">
                        <Text className="text-sm font-medium text-textHeadings">
                            Default GST rate on fees
                        </Text>
                        <Select placeholder="Select" options={[]} className="w-full" />
                        <Text className="text-xs text-textGreyLight">
                            Fees are always treated as inclusive of GST. For intra-state rates, GST
                            is split 50/50 into CGST and SGST and posted to separate input-tax
                            accounts. Inter-state rates post a single IGST line.
                        </Text>
                    </Space>

                    <Card
                        className="rounded-xl border-borderCard"
                        styles={{ body: { padding: 20 } }}
                    >
                        <Space direction="vertical" size={4} className="mb-4 w-full">
                            <Text className="text-sm font-medium text-textHeadings">
                                Input GST account mapping
                            </Text>
                            <Text className="text-xs text-textBody">
                                Each component of GST posts to its own ledger account on export.
                            </Text>
                        </Space>
                        <Row gutter={16} className="mb-5">
                            {['Input CGST account', 'Input SGST account', 'Input IGST account'].map(
                                label => (
                                    <Col key={label} span={8}>
                                        <Space direction="vertical" size={4} className="w-full">
                                            <Text className="text-xs text-textGreyLight">
                                                {label}
                                            </Text>
                                            <Select
                                                placeholder="Select"
                                                options={[]}
                                                className="w-full"
                                            />
                                        </Space>
                                    </Col>
                                )
                            )}
                        </Row>

                        <Card
                            className="rounded-xl border-0 bg-[#F8FAFC]"
                            styles={{ body: { padding: 16 } }}
                        >
                            <Text className="mb-4 block text-xs font-medium text-textBody">
                                Example posting on ₹1,000 fee (inclusive)
                            </Text>
                            <Space direction="vertical" size={12} className="w-full">
                                {EXAMPLE_POSTING.map((row, i) => (
                                    <Flex key={i} justify="space-between" align="center">
                                        <Text
                                            className={
                                                row.bold
                                                    ? 'text-xs font-semibold text-textHeadings'
                                                    : 'text-xs text-textBody'
                                            }
                                        >
                                            {row.label}
                                        </Text>
                                        <Text
                                            className={
                                                row.bold
                                                    ? 'text-xs font-semibold text-textHeadings'
                                                    : 'text-xs text-textBody'
                                            }
                                        >
                                            {row.amount}
                                        </Text>
                                    </Flex>
                                ))}
                            </Space>
                        </Card>
                    </Card>
                </Space>
            </Card>
        </Col>
    </Row>
);

export default IntegrationsTab;
