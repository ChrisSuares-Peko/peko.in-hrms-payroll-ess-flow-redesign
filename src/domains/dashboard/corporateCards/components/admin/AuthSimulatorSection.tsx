import { useState } from 'react';

import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Flex,
    Input,
    InputNumber,
    Row,
    Select,
    Tag,
    Tabs,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/lib/table';

import GenericTable from '@components/atomic/GenericTable';

import { formatRupeesDecimal } from '../../utils/helpers';

const { Title, Text } = Typography;

/* ─── Mock data ─────────────────────────────────────── */

const CARD_OPTIONS = [
    { value: '3344', label: '••3344 — Rohan Mehta (virtual, active)' },
    { value: '9012', label: '••9012 — Priya Sharma (physical, active)' },
    { value: '4421', label: '••4421 — Arjun Das (physical, active)' },
];

const CHANNEL_OPTIONS = [
    { value: 'pos', label: 'POS — In-store swipe' },
    { value: 'online', label: 'Online — E-commerce' },
    { value: 'atm', label: 'ATM — Cash withdrawal' },
    { value: 'contactless', label: 'Contactless — Tap to pay' },
];

const MCC_OPTIONS = [
    { value: 'software', label: 'Software' },
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'retail', label: 'Retail' },
    { value: 'fuel', label: 'Fuel' },
];

const COUNTRY_OPTIONS = [
    { value: 'india', label: 'India' },
    { value: 'usa', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'uae', label: 'UAE' },
];

const DECISION_STEPS = [
    { step: 1, label: 'Card lookup', detail: 'Card ••9012 (physical)' },
    { step: 2, label: 'Card status', detail: 'Active' },
    { step: 3, label: 'KYC', detail: 'Verified for Rohan Mehta' },
    { step: 4, label: 'Geo control', detail: 'India ∈ allowed list' },
    { step: 5, label: 'Merchant category', detail: 'No category restriction' },
    { step: 6, label: 'Per-transaction limit', detail: '₹500.0 ≤ ₹2,500.00' },
    { step: 7, label: 'ATM rules', detail: 'Not an ATM withdrawal' },
    {
        step: 8,
        label: 'Card period limit',
        detail: 'Spent ₹11,700.00 of ₹15,000.00 (monthly) — ₹3,300.00 available',
    },
];

interface LogRow {
    key: string;
    time: string;
    card: string;
    merchant: string;
    channel: string;
    amount: number;
    decision: string;
    reason: string;
    applied: string;
}

const LOG_ROWS: LogRow[] = [
    {
        key: '1',
        time: '2024-02-03',
        card: 'Peko card •• 4421',
        merchant: 'Razorpay',
        channel: 'POS',
        amount: 9120,
        decision: 'Paid',
        reason: 'APPROVED',
        applied: 'Yes',
    },
    {
        key: '2',
        time: '2024-03-15',
        card: 'External card ••',
        merchant: 'Razorpay',
        channel: 'POS',
        amount: 7240.5,
        decision: 'Paid',
        reason: 'APPROVED',
        applied: 'Yes',
    },
    {
        key: '3',
        time: '2024-04-27',
        card: 'Peko card •• 4421',
        merchant: 'Razorpay',
        channel: 'POS',
        amount: 5240.5,
        decision: 'Paid',
        reason: 'APPROVED',
        applied: 'Yes',
    },
    {
        key: '4',
        time: '2024-05-19',
        card: 'Peko card •• 4421',
        merchant: 'Razorpay',
        channel: 'POS',
        amount: 4500,
        decision: 'Paid',
        reason: 'APPROVED',
        applied: 'Yes',
    },
    {
        key: '5',
        time: '2024-06-10',
        card: 'External card ••',
        merchant: 'Razorpay',
        channel: 'POS',
        amount: 3750.25,
        decision: 'Paid',
        reason: 'APPROVED',
        applied: 'Yes',
    },
    {
        key: '6',
        time: '2024-07-22',
        card: 'External card ••',
        merchant: 'Razorpay',
        channel: 'POS',
        amount: 2980.75,
        decision: 'Paid',
        reason: 'APPROVED',
        applied: 'Yes',
    },
];

const LOG_COLUMNS: ColumnsType<LogRow> = [
    {
        key: 'time',
        title: 'Time',
        dataIndex: 'time',
        width: 120,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'card',
        title: 'Card',
        dataIndex: 'card',
        width: 160,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'merchant',
        title: 'Merchant',
        dataIndex: 'merchant',
        width: 120,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'channel',
        title: 'Channel',
        dataIndex: 'channel',
        width: 100,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'amount',
        title: 'Amount',
        dataIndex: 'amount',
        width: 120,
        render: (v: number) => (
            <Text className="text-sm text-textBody">{formatRupeesDecimal(v)}</Text>
        ),
    },
    {
        key: 'decision',
        title: 'Decision',
        dataIndex: 'decision',
        width: 110,
        render: v => (
            <Tag className="rounded-full border-0 bg-savingsTagLightBg px-3 text-savingsTagLightText">
                {v}
            </Tag>
        ),
    },
    {
        key: 'reason',
        title: 'Reason',
        dataIndex: 'reason',
        width: 120,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
    {
        key: 'applied',
        title: 'Applied',
        dataIndex: 'applied',
        width: 90,
        render: v => <Text className="text-sm text-textBody">{v}</Text>,
    },
];

/* ─── Sub-views ──────────────────────────────────────── */

const AuthDecisionLog = ({ onBack }: { onBack: () => void }) => {
    const [activeTab, setActiveTab] = useState('all');

    let filtered = LOG_ROWS;
    if (activeTab === 'approved') filtered = LOG_ROWS.filter(r => r.reason === 'APPROVED');
    else if (activeTab === 'declined') filtered = LOG_ROWS.filter(r => r.reason === 'DECLINED');

    return (
        <Flex vertical gap={24}>
            <Flex justify="space-between" align="flex-start">
                <Flex vertical gap={4}>
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        Auth decision log
                    </Title>
                    <Text className="text-sm text-textBody">
                        Platform-charged fees (ATM, card issuance, monthly, replacement, FX). Pay
                        via your Peko corporate card or any external card through the payment
                        gateway.
                    </Text>
                </Flex>
                <Button onClick={onBack}>← Back</Button>
            </Flex>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'all', label: 'All' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'declined', label: 'Declined' },
                ]}
            />

            <GenericTable columns={LOG_COLUMNS} dataSource={filtered} rowKey="key" />
        </Flex>
    );
};

const SimulatorView = ({ onOpenLog }: { onOpenLog: () => void }) => {
    const [ran, setRan] = useState(false);
    const [amount, setAmount] = useState<number | null>(3720);
    const [merchant, setMerchant] = useState('Razorpay');
    const [channel, setChannel] = useState('pos');
    const [mcc, setMcc] = useState('software');
    const [country, setCountry] = useState('india');
    const [card, setCard] = useState('3344');

    return (
        <Flex vertical gap={24}>
            <Flex justify="space-between" align="flex-start">
                <Flex vertical gap={4}>
                    <Title level={3} className="!mb-0 !text-textHeadings">
                        Authorization simulator
                    </Title>
                    <Text className="text-sm text-textBody">
                        Simulate an acquirer auth request and watch the rule engine evaluate it
                        step-by-step.
                    </Text>
                </Flex>
                <Button
                    onClick={onOpenLog}
                    className="border-brandColor text-brandColor hover:!border-brandColor hover:!text-brandColor"
                >
                    Auth decision log
                </Button>
            </Flex>

            <Row gutter={24} align="top">
                <Col span={10}>
                    <Card
                        className="rounded-2xl border border-borderCard"
                        styles={{ body: { padding: 24 } }}
                    >
                        <Flex vertical gap={20}>
                            <Title level={5} className="!mb-0 !text-textHeadings">
                                Incoming auth request
                            </Title>

                            <Flex vertical gap={6}>
                                <Text className="text-sm text-textBody">Card</Text>
                                <Select
                                    value={card}
                                    onChange={setCard}
                                    options={CARD_OPTIONS}
                                    className="w-full [&_.ant-select-selector]:!rounded-md"
                                />
                                <Text className="text-xs text-textGreyLight">
                                    Limit ₹5,000.00 · Spent ₹1,280.00 · Available ₹3,720.00 · KYC
                                    verified · MCC [Software] · Geo [India, United States]
                                </Text>
                            </Flex>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Flex vertical gap={6}>
                                        <Text className="text-sm text-textBody">Channel</Text>
                                        <Select
                                            value={channel}
                                            onChange={setChannel}
                                            options={CHANNEL_OPTIONS}
                                            className="w-full [&_.ant-select-selector]:!rounded-md"
                                        />
                                    </Flex>
                                </Col>
                                <Col span={12}>
                                    <Flex vertical gap={6}>
                                        <Text className="text-sm text-textBody">Amount (INR)</Text>
                                        <InputNumber
                                            value={amount}
                                            onChange={setAmount}
                                            prefix="₹"
                                            className="w-full rounded-md"
                                            controls={false}
                                        />
                                    </Flex>
                                </Col>
                            </Row>

                            <Flex vertical gap={6}>
                                <Text className="text-sm text-textBody">Merchant name</Text>
                                <Input
                                    value={merchant}
                                    onChange={e => setMerchant(e.target.value)}
                                    className="rounded-md"
                                />
                            </Flex>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Flex vertical gap={6}>
                                        <Text className="text-sm text-textBody">
                                            Merchant category (MCC)
                                        </Text>
                                        <Select
                                            value={mcc}
                                            onChange={setMcc}
                                            options={MCC_OPTIONS}
                                            className="w-full [&_.ant-select-selector]:!rounded-md"
                                        />
                                    </Flex>
                                </Col>
                                <Col span={12}>
                                    <Flex vertical gap={6}>
                                        <Text className="text-sm text-textBody">
                                            Merchant country
                                        </Text>
                                        <Select
                                            value={country}
                                            onChange={setCountry}
                                            options={COUNTRY_OPTIONS}
                                            className="w-full [&_.ant-select-selector]:!rounded-md"
                                        />
                                    </Flex>
                                </Col>
                            </Row>

                            <Button
                                type="primary"
                                block
                                className="mt-2 rounded-lg !bg-brandRed hover:!bg-red-600"
                                onClick={() => setRan(true)}
                            >
                                Run authorization
                            </Button>
                        </Flex>
                    </Card>
                </Col>

                <Col span={14}>
                    <Card
                        className="rounded-2xl border border-borderCard"
                        styles={{ body: { padding: 24 } }}
                    >
                        <Flex vertical gap={16}>
                            <Flex justify="space-between" align="center">
                                <Title level={5} className="!mb-0 !text-textHeadings">
                                    Engine decision
                                </Title>
                                <Button
                                    type="text"
                                    icon={<CopyOutlined />}
                                    className="text-textBody"
                                >
                                    JSON
                                </Button>
                            </Flex>

                            {ran ? (
                                <>
                                    <Flex
                                        align="center"
                                        justify="space-between"
                                        className="rounded-xl px-4 py-3"
                                        style={{ backgroundColor: '#EBF6F1' }}
                                    >
                                        <Flex align="center" gap={8}>
                                            <CheckCircleFilled className="text-savingsTagLightText text-lg" />
                                            <Text className="font-semibold text-savingsTagLightText">
                                                Approved
                                            </Text>
                                        </Flex>
                                        <Tag className="rounded-full border-0 bg-white px-3 text-textBody text-xs">
                                            Limit reduced
                                        </Tag>
                                    </Flex>

                                    <Flex vertical gap={0}>
                                        {DECISION_STEPS.map(s => (
                                            <Flex
                                                key={s.step}
                                                align="flex-start"
                                                gap={12}
                                                className="rounded-xl border border-borderCard px-4 py-3 mb-2"
                                            >
                                                <CheckCircleFilled className="mt-0.5 text-savingsTagLightText" />
                                                <Flex vertical gap={2}>
                                                    <Text className="text-sm text-textBody">
                                                        Step {s.step} ·{' '}
                                                        <span className="font-semibold text-textHeadings">
                                                            {s.label}
                                                        </span>
                                                    </Text>
                                                    <Text className="text-xs text-textGreyLight">
                                                        {s.detail}
                                                    </Text>
                                                </Flex>
                                            </Flex>
                                        ))}
                                    </Flex>
                                </>
                            ) : (
                                <Flex align="center" justify="center" className="py-16">
                                    <Text className="text-sm text-textGreyLight">
                                        Fill in the form and click &quot;Run authorization&quot; to
                                        see results.
                                    </Text>
                                </Flex>
                            )}
                        </Flex>
                    </Card>
                </Col>
            </Row>
        </Flex>
    );
};

/* ─── Root ───────────────────────────────────────────── */

const AuthSimulatorSection = () => {
    const [view, setView] = useState<'simulator' | 'log'>('simulator');

    return view === 'log' ? (
        <AuthDecisionLog onBack={() => setView('simulator')} />
    ) : (
        <SimulatorView onOpenLog={() => setView('log')} />
    );
};

export default AuthSimulatorSection;
