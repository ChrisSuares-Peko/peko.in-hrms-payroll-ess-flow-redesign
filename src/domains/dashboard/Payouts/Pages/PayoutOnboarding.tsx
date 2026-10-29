import { useState } from 'react';

import { ClockCircleOutlined, LockOutlined, ThunderboltFilled } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Tag, Typography } from 'antd';

import ActivatePaymentCollections from '../../paymentLinks/components/ActivatePaymentCollections';
import { PaymentLinkOnboardingProps } from '../../paymentLinks/types/paymentLinkTypes';
import { onboardingSteps, statusCards } from '../utils/stats';

const iconMap = {
    clock: (color: string) => <ClockCircleOutlined className="text-[18px]" style={{ color }} />,
    lock:  (color: string) => <LockOutlined       className="text-[18px]" style={{ color }} />,
};

const PaymentLinkOnboarding = ({ onboardingRecord,refresh,title="Payouts" }: PaymentLinkOnboardingProps) => {
    const [activating, setActivating] = useState(false);

    const handleActivated = () => {};

    if (activating) {
        return (
            <ActivatePaymentCollections
                onCancel={() => setActivating(false)}
                onActivated={handleActivated}
                initialData={onboardingRecord}
                refresh={refresh}
                title={title}
            />
        );
    }

    return (
        <Flex vertical gap={24} className="w-full px-4 py-2 md:gap-9 md:px-0 md:py-0">
            {/* Page Title */}
            <Flex vertical gap={8} className="max-w-[900px]">
                <Typography.Title level={1} className="!mb-0 !text-[24px] !font-semibold !leading-[1.15] !text-[#1F2A44]">
                    {title}
                </Typography.Title>
                <Typography.Text className="text-[14px] leading-6 text-[#667085]">
                    Manage payout accounts, transfer funds, and track disbursements
                </Typography.Text>
            </Flex>

            {/* Hero card */}
            <Card
                className="overflow-hidden rounded-[28px] border border-[#D7E2F0] shadow-none"
                styles={{ body: { padding: 30 } }}
            >
                <Row gutter={[36, 28]} align="middle">
                    {/* Left */}
                    <Col xs={24} lg={15}>
                        <Flex vertical gap={28}>
                            <Tag
                                className="!m-0 flex h-10 w-fit items-center rounded-full border-0 px-5 text-[11px] font-semibold leading-none text-[#3AB75E]"
                                style={{ backgroundColor: '#ECFDF3' }}
                            >
                                <ThunderboltFilled className="mr-1" />
                                Setup takes less than 2 minutes
                            </Tag>

                            <Flex vertical gap={12} className="max-w-[900px]">
                                <Typography.Title
                                    level={2}
                                    className="!mb-0 !text-[23px] !font-semibold !leading-[1.2] !text-[#1F2A44]"
                                >
                                    Start Sending Payouts Today
                                </Typography.Title>
                                <Typography.Text className="max-w-[880px] text-[14px] leading-[1.5] text-[#667085]">
                                    Activate your payout service to disburse funds via NEFT, IMPS, UPI, and same-day transfers — all from one dashboard.
                                </Typography.Text>
                            </Flex>

                            <Flex
                                wrap="wrap"
                                gap={32}
                                className="md:gap-x-[64px] md:gap-y-6"
                            >
                                <Flex vertical gap={6} className="min-w-[180px]">
                                    <Typography.Title
                                        level={4}
                                        className="!mb-0 !text-[20px] !font-semibold !leading-none !text-[#1F2A44]"
                                    >
                                        ₹80K+
                                    </Typography.Title>
                                    <Typography.Text className="text-[11px] leading-5 text-[#98A2B3]">
                                        Avg. monthly disbursals
                                    </Typography.Text>
                                </Flex>
                                <Flex vertical gap={6} className="min-w-[140px]">
                                    <Typography.Title
                                        level={4}
                                        className="!mb-0 !text-[20px] !font-semibold !leading-none !text-[#1F2A44]"
                                    >
                                        Same-day
                                    </Typography.Title>
                                    <Typography.Text className="text-[11px] leading-5 text-[#98A2B3]">
                                        Transfer speed
                                    </Typography.Text>
                                </Flex>
                                <Flex vertical gap={6} className="min-w-[140px]">
                                    <Typography.Title
                                        level={4}
                                        className="!mb-0 !text-[20px] !font-semibold !leading-none !text-[#1F2A44]"
                                    >
                                        3 modes
                                    </Typography.Title>
                                    <Typography.Text className="text-[11px] leading-5 text-[#98A2B3]">
                                        Transfer channels
                                    </Typography.Text>
                                </Flex>
                            </Flex>

                            <Flex vertical gap={14}>
                                <Button
                                    type="primary"
                                    danger
                                    className="!h-[44px] !rounded-xl !border-0 !bg-[#FF4D4F] w-[50%] px-7 text-[13px] font-semibold shadow-none hover:!bg-[#FF4D4F]"
                                    onClick={() => setActivating(true)}
                                >
                                    Activate Payout Service →
                                </Button>
                                <Typography.Text className="text-[11px] leading-5 text-[#667085]">
                                    No setup fee · Instant activation · KYC already on file
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Col>

                    {/* Right — setup steps */}
                    <Col xs={24} lg={9}>
                        <Card
                            className="h-full rounded-[26px] border-0 shadow-none"
                            styles={{ body: { padding: 36 } }}
                            style={{ background: '#F7FAFF' }}
                        >
                            <Flex vertical gap={34}>
                                <Typography.Text className="text-[12px] font-semibold uppercase tracking-wide text-[#475467]">
                                    Setup Steps
                                </Typography.Text>
                                {onboardingSteps.map(step => (
                                    <Flex key={step.id} align="start" gap={10}>
                                        <Flex
                                            align="center"
                                            justify="center"
                                            className=" h-7 w-7 rounded-full border border-[#3AB75E] text-[16px] font-medium text-[#3AB75E]"
                                            style={{ flexShrink: 0 }}
                                        >
                                            {step.id}
                                        </Flex>
                                        <Flex vertical gap={8} className='mt-1'>
                                            <Typography.Text className="text-[14px] font-semibold leading-[1.3] text-[#1F2A44]">
                                                {step.title}
                                            </Typography.Text>
                                            <Typography.Text className="text-[13px] leading-6 text-[#667085]">
                                                {step.description}
                                            </Typography.Text>
                                        </Flex>
                                    </Flex>
                                ))}
                            </Flex>
                        </Card>
                    </Col>
                </Row>
            </Card>

            {/* Service Status card */}
            <Card
                className="overflow-hidden rounded-[28px] border border-[#D7E2F0] shadow-none"
                styles={{ body: { padding: 30 } }}
            >
                <Flex vertical gap={32}>
                    <Flex vertical gap={8}>
                        <Typography.Title
                            level={2}
                            className="!mb-0 !text-[23px] !font-semibold !leading-[1.2] !text-[#1F2A44]"
                        >
                            Service Status
                        </Typography.Title>
                        <Typography.Text className="text-[14px] leading-6 text-[#667085]">
                            Current state of your payout service
                        </Typography.Text>
                    </Flex>

                    <Row gutter={[28, 28]}>
                        {statusCards.map(item => (
                            <Col xs={24} lg={8} key={item.key}>
                                <Card
                                    className="h-full rounded-[22px] border border-[#D7E2F0] shadow-none"
                                    styles={{ body: { padding: 16 } }}
                                >
                                    <Flex gap={18} align="start">
                                        <Flex
                                            align="center"
                                            justify="center"
                                            className="h-16 w-16 rounded-[18px]"
                                            style={{ background: item.statusBg, flexShrink: 0 }}
                                        >
                                            {iconMap[item.iconType](item.statusColor)}
                                        </Flex>
                                        <Flex className="flex-1" gap={10}>
                                            <Flex vertical justify="space-between" align="start" gap={12}>
                                                <Typography.Text className="pr-2 text-sm font-semibold leading-[1.3] text-[#1F2A44]">
                                                    {item.title}
                                                </Typography.Text>
                                                <Typography.Text className="text-xs leading-4 text-[#475467]">
                                                {item.description}
                                            </Typography.Text>
                                            </Flex>
                                           <Flex justify='start' align='start'>

                                            <Tag
                                                    className="!m-0 rounded-full border-0 px-3 py-1 text-[10px] font-medium"
                                                    style={{
                                                        color: item.statusColor,
                                                        backgroundColor: item.statusBg,
                                                    }}
                                                    >
                                                    • {item.status}
                                                </Tag>
                                                    </Flex>
                                        </Flex>
                                    </Flex>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Flex>
            </Card>
        </Flex>
    );
};

export default PaymentLinkOnboarding;
