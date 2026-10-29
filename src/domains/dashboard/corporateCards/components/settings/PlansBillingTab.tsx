import { useState } from 'react';

import { CheckCircleFilled, DownloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Divider,
    Flex,
    List,
    Row,
    Segmented,
    Space,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';

import bankIcon from '../../assets/icons/bank.svg';
import moneySendIcon from '../../assets/icons/money-send.svg';
import walletIcon from '../../assets/icons/wallet-money.svg';

const { Text, Title } = Typography;

const BILLING_SEGMENTS = [
    { label: 'Subscription Plans', value: 'subscription' },
    { label: 'My Bills', value: 'bills' },
    { label: 'Payments', value: 'payments' },
];

/* ---- Plan data ---- */
const PLANS = [
    {
        key: 'standard',
        name: 'Standard plan',
        price: 'Free',
        priceUnit: '',
        description: 'Best for lean teams',
        isCurrent: true,
        features: [
            'Get 1 FREE physical card',
            'Unlimited virtual cards',
            'Real-time expense tracking',
            'Standard support and basic analytics dashboard',
        ],
    },
    {
        key: 'premium',
        name: 'Premium plan',
        price: '₹ 1,999',
        priceUnit: 'monthly',
        description: 'Best for scaling companies',
        isCurrent: false,
        features: [
            'Everything in standard, plus:',
            'Get 3 FREE physical cards',
            'Unlimited virtual cards',
            'AI-powered analytics dashboard',
            'Predictive spend insights + alerts',
            'Accounting software integrations (all major platforms)',
            'Dedicated customer success manager',
        ],
    },
    {
        key: 'elite',
        name: 'Elite plan',
        price: '₹ 2,999',
        priceUnit: 'monthly',
        description: 'Best for larger organizations',
        isCurrent: false,
        features: [
            'Everything in premium, plus:',
            'Get 10 FREE physical cards',
            'Unlimited virtual cards',
            'Elite-only exclusive rewards',
            'Access to limited edition UAE inspired digital card designs',
            'Concierge services',
            'Branding opportunities on Peko sponsored events & marketing collaterals',
        ],
    },
];

/* ---- Bills data ---- */
interface BillRow {
    key: string;
    invoice: string;
    period: string;
    issuedOn: string;
    plan: string;
    amount: string;
    status: 'Due' | 'Paid';
}

const BILLS: BillRow[] = [
    {
        key: 'b1',
        invoice: 'INV-2024-1042',
        period: '2024-01-12',
        issuedOn: '2024-01-12',
        plan: 'Growth',
        amount: '₹2,400.00',
        status: 'Due',
    },
    {
        key: 'b2',
        invoice: 'INV-2024-1042',
        period: '2024-02-03',
        issuedOn: '2024-02-03',
        plan: 'Starter',
        amount: '₹790.50',
        status: 'Paid',
    },
    {
        key: 'b3',
        invoice: 'INV-2024-1043',
        period: '2024-03-15',
        issuedOn: '2024-03-15',
        plan: 'Growth',
        amount: '₹7,240.50',
        status: 'Paid',
    },
    {
        key: 'b4',
        invoice: 'INV-2024-1044',
        period: '2024-04-27',
        issuedOn: '2024-04-27',
        plan: 'Growth',
        amount: '₹5,240.50',
        status: 'Paid',
    },
    {
        key: 'b5',
        invoice: 'INV-2024-1045',
        period: '2024-05-09',
        issuedOn: '2024-05-09',
        plan: 'Starter',
        amount: '₹3,150.75',
        status: 'Paid',
    },
];

/* ---- Payments data ---- */
interface PaymentRow {
    key: string;
    invoice: string;
    period: string;
    paidOn: string;
    plan: string;
    method: string;
    amount: string;
}

const PAYMENTS: PaymentRow[] = [
    {
        key: 'p1',
        invoice: 'INV-2024-1042',
        period: '2024-01-12',
        paidOn: '2024-01-12',
        plan: 'Growth',
        method: 'Card •• 4242',
        amount: '₹2,400.00',
    },
    {
        key: 'p2',
        invoice: 'INV-2024-1042',
        period: '2024-02-03',
        paidOn: '2024-02-03',
        plan: 'Starter',
        method: 'Card •• 4242',
        amount: '₹790.50',
    },
    {
        key: 'p3',
        invoice: 'INV-2024-1043',
        period: '2024-03-15',
        paidOn: '2024-03-15',
        plan: 'Growth',
        method: 'Card •• 4242',
        amount: '₹7,240.50',
    },
    {
        key: 'p4',
        invoice: 'INV-2024-1044',
        period: '2024-04-27',
        paidOn: '2024-04-27',
        plan: 'Growth',
        method: 'Card •• 4242',
        amount: '₹5,240.50',
    },
    {
        key: 'p5',
        invoice: 'INV-2024-1045',
        period: '2024-05-09',
        paidOn: '2024-05-09',
        plan: 'Starter',
        method: 'Card •• 4242',
        amount: '₹3,150.75',
    },
];

/* ---- Sub-components ---- */

const BillStatusTag = ({ status }: { status: 'Due' | 'Paid' }) => (
    <Tag
        bordered={false}
        className={`m-0 rounded-full px-2 py-0.5 text-xs font-medium leading-none ${
            status === 'Due'
                ? 'bg-bgOrangeShade text-textOrange'
                : 'bg-savingsTagLightBg text-savingsTagLightText'
        }`}
    >
        {status}
    </Tag>
);

const PdfButton = () => (
    <Button type="text" size="small" icon={<DownloadOutlined />} className="text-textGreyLight">
        PDF
    </Button>
);

const billColumns: ColumnsType<BillRow> = [
    { key: 'invoice', title: 'Invoice', dataIndex: 'invoice', width: 160 },
    { key: 'period', title: 'Period', dataIndex: 'period', width: 130 },
    { key: 'issuedOn', title: 'Issued on', dataIndex: 'issuedOn', width: 130 },
    { key: 'plan', title: 'Plan', dataIndex: 'plan', width: 110 },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 130,
        render: (v: string) => <Text className="font-medium text-textHeadings">{v}</Text>,
    },
    {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 100,
        render: (s: 'Due' | 'Paid') => <BillStatusTag status={s} />,
    },
    {
        key: 'action',
        title: 'Action',
        width: 120,
        render: (_: unknown, row: BillRow) =>
            row.status === 'Due' ? (
                <Button type="primary" size="small">
                    Pay Now
                </Button>
            ) : (
                <PdfButton />
            ),
    },
];

const paymentColumns: ColumnsType<PaymentRow> = [
    { key: 'invoice', title: 'Invoice', dataIndex: 'invoice', width: 160 },
    { key: 'period', title: 'Period', dataIndex: 'period', width: 130 },
    { key: 'paidOn', title: 'Paid on', dataIndex: 'paidOn', width: 130 },
    { key: 'plan', title: 'Plan', dataIndex: 'plan', width: 110 },
    { key: 'method', title: 'Method', dataIndex: 'method', width: 150 },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 130,
        render: (v: string) => <Text className="font-medium text-textHeadings">{v}</Text>,
    },
    { key: 'receipt', title: 'Receipt', width: 100, render: () => <PdfButton /> },
];

/* ---- Stat card ---- */
interface PayStatCardProps {
    icon: string;
    bgColor: string;
    label: string;
    value: string;
}
const PayStatCard = ({ icon, bgColor, label, value }: PayStatCardProps) => (
    <Card
        className="h-full rounded-2xl border-0"
        style={{ backgroundColor: bgColor }}
        styles={{ body: { padding: 20 } }}
    >
        <Space direction="vertical" size={12}>
            <Flex align="center" justify="center" className="h-12 w-12 rounded-full bg-white">
                <img src={icon} alt="" className="h-5 w-5" />
            </Flex>
            <Space direction="vertical" size={4}>
                <Text className="text-xs text-textGreyLight">{label}</Text>
                <Text className="text-xl font-bold text-textHeadings">{value}</Text>
            </Space>
        </Space>
    </Card>
);

/* ---- Tab panels ---- */

const SubscriptionPlans = () => (
    <Space direction="vertical" size={24} className="w-full">
        <Row gutter={[24, 24]}>
            {PLANS.map(plan => (
                <Col key={plan.key} xs={24} md={8}>
                    <Card
                        className="h-full rounded-2xl border-borderCard"
                        styles={{ body: { padding: 32, display: 'flex', flexDirection: 'column' } }}
                    >
                        <Space direction="vertical" size={12} className="mb-6 w-full">
                            <Text className="text-sm font-semibold text-textLightRed">
                                {plan.name}
                            </Text>
                            <Flex align="flex-end" gap={4}>
                                <Title level={2} className="!mb-0 !text-textHeadings">
                                    {plan.price}
                                </Title>
                                {plan.priceUnit && (
                                    <Text className="mb-1 text-sm text-textGreyLight">
                                        {plan.priceUnit}
                                    </Text>
                                )}
                            </Flex>
                            <Text className="text-xs text-textGreyLight">{plan.description}</Text>
                        </Space>
                        {plan.isCurrent ? (
                            <Button className="mb-6 w-full font-medium" disabled>
                                Current Plan
                            </Button>
                        ) : (
                            <Button type="primary" className="mb-6 w-full font-medium">
                                Select Plan
                            </Button>
                        )}
                        <Divider className="!my-0" />
                        <Text className="mb-4 mt-5 block text-xs font-medium text-textGreyLight">
                            Features:
                        </Text>
                        <List
                            dataSource={plan.features}
                            renderItem={(feat, i) => (
                                <List.Item key={i} className="!border-0 !px-0 !py-1.5">
                                    <Flex gap={8} align="flex-start">
                                        <CheckCircleFilled className="mt-0.5 shrink-0 text-sm text-savingsTagLightText" />
                                        <Text className="text-xs text-textBody">{feat}</Text>
                                    </Flex>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            ))}
        </Row>

        <Card
            className="rounded-2xl border-[#CBD5E1] bg-[#F8FAFC]"
            styles={{ body: { padding: 16 } }}
        >
            <Flex gap={12} align="flex-start">
                <InfoCircleOutlined className="mt-0.5 shrink-0 text-textGreyLight" />
                <Text className="text-sm text-textBody">
                    Additional Physical Cards Can Be Purchased For INR 19 Each. Your Standard plan
                    includes 1 physical card. You&apos;re currently using 3. Any additional physical
                    card will be billed at INR 19.
                </Text>
            </Flex>
        </Card>
    </Space>
);

const MyBills = () => <GenericTable columns={billColumns} dataSource={BILLS} rowKey="key" />;

const PaymentsTab = () => (
    <Space direction="vertical" size={24} className="w-full">
        <Row gutter={[20, 20]}>
            <Col xs={24} md={8}>
                <PayStatCard
                    icon={walletIcon}
                    bgColor="#F6EBF4"
                    label="Total paid"
                    value="₹671.00"
                />
            </Col>
            <Col xs={24} md={8}>
                <PayStatCard
                    icon={moneySendIcon}
                    bgColor="#EBF6F1"
                    label="Payments made"
                    value="4"
                />
            </Col>
            <Col xs={24} md={8}>
                <PayStatCard
                    icon={bankIcon}
                    bgColor="#F6ECEB"
                    label="Last payment"
                    value="1 Mar 2025"
                />
            </Col>
        </Row>
        <GenericTable columns={paymentColumns} dataSource={PAYMENTS} rowKey="key" />
    </Space>
);

/* ---- Main component ---- */

const PlansBillingTab = () => {
    const [activeTab, setActiveTab] = useState('subscription');

    return (
        <Space direction="vertical" size={24} className="w-full">
            <Segmented
                options={BILLING_SEGMENTS}
                value={activeTab}
                onChange={val => setActiveTab(val as string)}
                style={{ borderRadius: 9999, padding: '6px 4px' }}
                className="[&_.ant-segmented-item]:!rounded-full [&_.ant-segmented-thumb]:!rounded-full [&_.ant-segmented-item-selected]:!rounded-full [&_.ant-segmented-item:not(.ant-segmented-item-selected):hover]:!bg-transparent"
            />
            {activeTab === 'subscription' && <SubscriptionPlans />}
            {activeTab === 'bills' && <MyBills />}
            {activeTab === 'payments' && <PaymentsTab />}
        </Space>
    );
};

export default PlansBillingTab;
