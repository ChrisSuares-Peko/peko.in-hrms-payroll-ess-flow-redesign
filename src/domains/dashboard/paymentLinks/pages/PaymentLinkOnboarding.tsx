import { useState } from 'react';

import { ThunderboltFilled } from '@ant-design/icons';
import { Button, Card, Col, Flex, Row, Tag, Typography } from 'antd';

import UnderReview from '../../Payouts/Pages/PayoutUnderReview';
import ActivateCollectionsNupay from '../components/nupayOnboarding/ActivateCollectionsNupay';
import NupayOnboardingFailed from '../components/nupayOnboarding/NupayOnboardingFailed';
import { PaymentLinkOnboardingProps } from '../types/paymentLinkTypes';
import { onboardingSteps, statusCards } from '../utils/data';

const PaymentLinkOnboarding = ({ onboardingRecord,refresh,title="Payment Links" }: PaymentLinkOnboardingProps) => {
    const [activating, setActivating] = useState(false);

    const handleActivated = () => {};

    if (activating) {
        return (
            <ActivateCollectionsNupay
                onCancel={() => setActivating(false)}
                onActivated={handleActivated}
                initialData={onboardingRecord}
                refresh={refresh}
                title={title}
            />
        );
    }

    if (onboardingRecord?.status === 'approval-pending') {
        return <UnderReview activationType={title} />;
    }

    if (onboardingRecord?.status === 'rejected' || onboardingRecord?.status === 'on_hold') {
        return <NupayOnboardingFailed record={onboardingRecord} title={title} />;
    }


    return (
        <Flex vertical gap={24} className="w-full px-4 py-2 md:gap-9 md:px-0 md:py-0">
            {/* Page Title */}
            <Flex vertical gap={8} className="max-w-[900px]">
                <Typography.Title level={1} className="!mb-0 !text-[24px] !font-semibold !leading-[1.15] !text-[#1F2A44]">
                    {title}
                </Typography.Title>
                <Typography.Text className="text-[14px] leading-6 text-[#667085]">
                    Manage payment links, QR codes, and track payment collections
                </Typography.Text>
            </Flex>

            {/* Hero card */}
            <Card
                bordered={false}
                className="overflow-hidden rounded-[28px] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                styles={{ body: { padding: 30 } }}
            >
                <Row gutter={[36, 28]} align="stretch">
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
                                    Start Accepting Payments Today
                                </Typography.Title>
                                <Typography.Text className="max-w-[880px] text-[14px] leading-[1.5] text-[#667085]">
                                    Activate your payment collections service — all from one
                                    dashboard.
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
                                        ₹95K+
                                    </Typography.Title>
                                    <Typography.Text className="text-[11px] leading-5 text-[#98A2B3]">
                                        Avg. monthly collections
                                    </Typography.Text>
                                </Flex>
                                <Flex vertical gap={6} className="min-w-[140px]">
                                    <Typography.Title
                                        level={4}
                                        className="!mb-0 !text-[20px] !font-semibold !leading-none !text-[#1F2A44]"
                                    >
                                        T+1
                                    </Typography.Title>
                                    <Typography.Text className="text-[11px] leading-5 text-[#98A2B3]">
                                        Settlement speed
                                    </Typography.Text>
                                </Flex>
                            </Flex>

                            <Flex vertical gap={14}>
                                <Button
                                    type="primary"
                                    danger
                                    className="!h-[44px] !border-0 !bg-[#FF4D4F] w-[50%] px-7 text-[13px] font-semibold shadow-none hover:!bg-[#FF4D4F]"
                                    onClick={() => setActivating(true)}
                                >
                                    Activate Payment Collections →
                                </Button>
                                <Typography.Text className="text-[11px] leading-5 text-[#667085]">
                                    No setup fee · 48hrs Activation
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Col>

                    {/* Right — setup steps */}
                    <Col xs={24} lg={9}>
                        <Card
                            bordered={false}
                            className="h-full rounded-[26px]"
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
                bordered={false}
                className="overflow-hidden rounded-[28px] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
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
                            Current state of your payment collections service
                        </Typography.Text>
                    </Flex>

                    <Row gutter={[28, 28]}>
                        {statusCards.map(item => (
                            <Col xs={24} lg={12} key={item.key}>
                                <Card
                                    bordered={false}
                                    className="h-full rounded-[22px] border border-[#CBD5E1]"
                                    styles={{ body: { padding: 16 } }}
                                >
                                    <Flex gap={14} align="center">
                                        <Flex
                                            align="center"
                                            justify="center"
                                            className="h-10 w-10 rounded-[12px]"
                                            style={{ background: '#FFF1F0', flexShrink: 0 }}
                                        >
                                            {item.icon}
                                        </Flex>
                                        <Flex vertical gap={2} className="flex-1">
                                            <Flex justify="space-between" align="center" gap={10}>
                                                <Typography.Text className="text-sm font-semibold leading-[1.3] text-[#1F2A44]">
                                                    {item.title}
                                                </Typography.Text>
                                                <Tag
                                                    className="!m-0 !inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1 text-[10px] font-medium"
                                                    style={{
                                                        color: item.statusColor,
                                                        backgroundColor: item.statusBg,
                                                    }}
                                                >
                                                    <span
                                                        className="inline-block rounded-full"
                                                        style={{ width: 6, height: 6, backgroundColor: item.statusColor }}
                                                    />
                                                    {item.status}
                                                </Tag>
                                            </Flex>
                                            <Typography.Text className="text-xs leading-4 text-[#475467]">
                                                {item.description}
                                            </Typography.Text>
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
