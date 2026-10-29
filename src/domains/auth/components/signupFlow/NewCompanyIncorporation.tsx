import React from 'react';

import { Card, Flex, Typography, Button, Row, Col, Divider } from 'antd';
import Image from 'antd/es/image';
import { useDispatch } from 'react-redux';

import logo from '@assets/mainLogo/Logo.png';
import automation from '@assets/Signup/automation.svg';
import payrollExpense from '@assets/Signup/calender.svg';
import documentationIcon from '@assets/Signup/documents.svg';
import fastProcessingIcon from '@assets/Signup/fast.svg';
import gstverify from '@assets/Signup/gstverify.png';
import invoice from '@assets/Signup/Invoice.svg';
import manage from '@assets/Signup/payment.svg';
import requirement from '@assets/Signup/requirement.png';
import supportIcon from '@assets/Signup/support.svg';
import taxreview from '@assets/Signup/taxreview.svg';
import trackpayment from '@assets/Signup/trackpayment.svg';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import { nextStep, previousStep } from '../../slices/registerSlice';

interface FeatureItem {
    icon: string;
    title: string;
    description: string;
    color: string;
    iconStyle?: React.CSSProperties;
}

const signupTypeContent: Record<
    string,
    { title: string; subtitle: string; features: FeatureItem[] }
> = {
    NEW_COMPANY: {
        title: 'New Business Registration',
        subtitle: "Let's get your business registered and ready to operate",
        features: [
            {
                icon: supportIcon,
                title: 'End-to-end registration support',
                description: "We'll guide you through every step",
                color: '#F9F7F3',
            },
            {
                icon: documentationIcon,
                title: 'Complete documentation',
                description: 'All required documents prepared and filed correctly',
                color: '#F9F7F3',
            },
            {
                icon: fastProcessingIcon,
                title: 'Fast processing',
                description: 'Get your business up and running in days, not weeks',
                color: '#F9F7F3',
                iconStyle: { width: '100%', height: '100%', objectFit: 'contain' as const },
            },
        ],
    },
    EXISTING_COMPANY: {
        title: 'Set up your account on Peko',
        subtitle: "Connect your existing business to Peko's platform",
        features: [
            {
                icon: manage,
                title: 'Payment management',
                description: 'Streamline all your business payments in one place',
                color: '#F9F7F3',
            },
            {
                icon: automation,
                title: 'Compliance automation',
                description: 'Stay compliant with automated tax and regulatory tracking',
                color: '#F9F7F3',
            },
            {
                icon: payrollExpense,
                title: 'Payroll & expenses',
                description: 'Manage employee payments and business expenses effortlessly',
                color: '#F9F7F3',
            },
        ],
    },
    FREELANCER: {
        title: 'Set up your Peko account',
        subtitle:
            'Manage invoicing, payments, and taxes — all in one place for independent professionals',
        features: [
            {
                icon: invoice,
                title: 'Invoice management',
                description: 'Create and send professional invoices to your clients instantly',
                color: '#F9F7F3',
            },
            {
                icon: trackpayment,
                title: 'Payment tracking',
                description: 'Track incoming payments and outstanding dues with ease',
                color: '#F9F7F3',
            },
            {
                icon: taxreview,
                title: 'Tax simplification',
                description: 'Automate tax calculations and stay compliant with timely reminders',
                color: '#F9F7F3',
            },
        ],
    },
    COMPLIANCE_HEALTH: {
        title: 'Compliance Check',
        subtitle: "Verify your company's regulatory compliance status",
        features: [
            {
                icon: taxreview,
                title: 'Tax compliance review',
                description: 'Comprehensive check of your tax filing status and obligations',
                color: '#F9F4FD',
            },
            {
                icon: gstverify,
                title: 'GST verification',
                description: 'Ensure your VAT registration and returns are up to date',
                color: '#F0F6F0',
            },
            {
                icon: requirement,
                title: 'Regulatory requirements',
                description: 'Check compliance with industry-specific regulations and licenses',
                color: '#F9F7F3',
            },
        ],
    },
};

const { Text } = Typography;

const NewCompanyIncorporation = () => {
    const signupType =
        useAppSelector(state => state.reducer.registration.signupType) || 'NEW_COMPANY';
    const content = signupTypeContent[signupType] || signupTypeContent.NEW_COMPANY;
    const dispatch = useDispatch();
    const { md } = useScreenSize();

    const handleBack = () => {
        dispatch(previousStep());
    };

    return (
        <Flex vertical className="relative min-h-svh bg-white">
            {md && (
                <Flex vertical align="flex-start" gap={16} className="absolute top-8 left-10 z-10">
                    <Image src={logo} alt="Peko" preview={false} width={126} />
                </Flex>
            )}

            <Flex className="min-h-svh px-4 md:px-10" align="center" justify="center">
                <Card
                    style={{
                        maxWidth: 880,
                        width: '100%',
                        borderRadius: 24,
                        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
                        border: 'none',
                    }}
                    bodyStyle={{ padding: 40 }}
                >
                    <Flex vertical align="center" gap={8}>
                        <Image
                            src={logo}
                            alt="Peko"
                            preview={false}
                            width={80}
                            className="mb-4 md:hidden"
                        />
                        <Text className="text-3xl font-medium text-center" style={{ margin: 0 }}>
                            {content.title}
                        </Text>
                        <Text className="text-lg text-center">{content.subtitle}</Text>
                    </Flex>

                    <Row gutter={[16, 16]} justify="center" align="stretch" className="mt-8">
                        {content.features.map((feature, index) => (
                            <Col xs={24} md={8} key={index}>
                                <FeatureCard
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                    color={feature.color}
                                    iconStyle={feature.iconStyle}
                                />
                            </Col>
                        ))}
                    </Row>

                    <Divider style={{ margin: '24px 0' }} />

                    <Flex justify="space-between" align="center">
                        <Button size="large" danger onClick={handleBack}>
                            Go Back
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            style={{
                                backgroundColor: '#ff5a52',
                                borderColor: '#ff5a52',
                                paddingInline: 40,
                                fontWeight: 500,
                            }}
                            onClick={() => dispatch(nextStep())}
                        >
                            Next
                        </Button>
                    </Flex>
                </Card>
            </Flex>
        </Flex>
    );
};

interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    color: string;
    iconStyle?: React.CSSProperties;
}

const FeatureCard = ({ icon, title, description, color, iconStyle }: FeatureCardProps) => (
    <Card
        bordered
        style={{
            borderRadius: 24,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
            height: '100%',
        }}
        bodyStyle={{ padding: 20, height: '100%' }}
    >
        <Flex vertical gap={16} className="h-full">
            <Flex
                align="center"
                justify="center"
                style={{
                    width: '100%',
                    height: 140,
                    borderRadius: 24,
                    backgroundColor: color,
                    overflow: 'hidden',
                }}
            >
                <Image
                    src={icon}
                    preview={false}
                    style={iconStyle ?? { width: '100%', maxWidth: 160 }}
                    wrapperStyle={iconStyle ? { width: '100%', height: '100%' } : undefined}
                />
            </Flex>
            <Flex vertical gap={4}>
                <Text className="font-medium text-lg">{title}</Text>
                <Text className="text-xs">{description}</Text>
            </Flex>
        </Flex>
    </Card>
);

export default NewCompanyIncorporation;
