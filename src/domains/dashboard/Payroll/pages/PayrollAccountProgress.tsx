import type { CSSProperties } from 'react';
import { Fragment, useEffect, useState } from 'react';

import { CheckOutlined, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useScrollToTop } from '@src/hooks/useScrollToTop';
import { paths } from '@src/routes/paths';

import useGetPayrollAccountStatus from '../hooks/useGetPayrollAccountStatus';

const { Title, Text } = Typography;

type StepStatus = 'pending' | 'loading' | 'completed';

interface StepItemProps {
    title: string;
    description: string;
    infoText: string;
    estimatedTime: string;
    status: StepStatus;
    isLast?: boolean;
}

const StepItem = ({ title, description, infoText, estimatedTime, status, isLast }: StepItemProps) => {
    const isCompleted = status === 'completed';
    const isLoading = status === 'loading';
    const isPending = status === 'pending';

    let circleBg = '#F5F5F5';
    let circleBorder = '#D0D0D0';
    if (isCompleted) { circleBg = '#E7FFEC'; circleBorder = '#43B75D'; }
    else if (isLoading) { circleBg = '#F4EFFF'; circleBorder = '#8B5CF6'; }

    let innerBg = 'transparent';
    let innerBorder = '1.5px solid #D0D0D0';
    if (isCompleted) { innerBg = '#43B75D'; innerBorder = 'none'; }
    else if (isLoading) { innerBorder = '1.5px solid #8B5CF6'; }

    const circleStyle: CSSProperties = {
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: circleBg,
        border: `0.89px solid ${circleBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        zIndex: 1,
        transition: 'all 0.4s ease',
    };

    const innerCircleStyle: CSSProperties = {
        width: 21,
        height: 21,
        borderRadius: '50%',
        background: innerBg,
        border: innerBorder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.4s ease',
    };

    return (
        <Flex gap={25} style={{ width: '100%' }}>
            {/* Timeline indicator */}
            <Flex vertical align="center" style={{ width: 32, flexShrink: 0 }}>
                <div style={circleStyle}>
                    <div style={innerCircleStyle}>
                        {isCompleted && <CheckOutlined style={{ fontSize: 10, color: '#FFFFFF' }} />}
                        {isLoading && <LoadingOutlined style={{ fontSize: 12, color: '#8B5CF6' }} />}
                    </div>
                </div>
                {!isLast && (
                    <div
                        style={{
                            width: 2,
                            flex: 1,
                            background: isCompleted ? '#43B75D' : '#E0E0E0',
                            minHeight: 32,
                            transition: 'background 0.4s ease',
                        }}
                    />
                )}
            </Flex>

            {/* Step card */}
            <Flex
                justify="space-between"
                align="center"
                style={{
                    flex: 1,
                    background: '#FBFBFB',
                    border: '1px solid #EFEFEF',
                    borderRadius: 24,
                    padding: 24,
                    gap: 12,
                    marginBottom: isLast ? 0 : 32,
                    opacity: isPending ? 0.45 : 1,
                    transition: 'opacity 0.4s ease',
                }}
            >
                {/* Left content */}
                <Flex vertical gap={16} style={{ flex: 1, maxWidth: 695 }}>
                    <Flex vertical gap={4}>
                        <Text strong style={{ fontSize: 15, lineHeight: '24px', color: '#101828' }}>
                            {title}
                        </Text>
                        <Text style={{ fontSize: 13, lineHeight: '20px', color: '#6A7282' }}>
                            {description}
                        </Text>
                    </Flex>

                    <Flex vertical gap={8}>
                        {/* Info banner */}
                        <Flex
                            align="center"
                            style={{
                                background: '#F4EFFF',
                                border: '0.5px solid #8B5CF6',
                                borderRadius: 8,
                                padding: '8px 12px',
                                gap: 10,
                            }}
                        >
                            <Text style={{ fontSize: 13, lineHeight: '20px', color: '#6A7282' }}>
                                {infoText}
                            </Text>
                        </Flex>

                        {/* Estimated time */}
                        <Flex align="center" gap={4}>
                            <ClockCircleOutlined style={{ fontSize: 13, color: '#6A7282' }} />
                            <Text style={{ fontSize: 13, lineHeight: '20px', color: '#6A7282' }}>
                                {estimatedTime}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>

                {/* Status badge */}
                {!isPending && (
                    <Flex
                        justify="center"
                        align="center"
                        style={{
                            background: isCompleted ? '#ECFFE8' : '#F4EFFF',
                            border: `1px solid ${isCompleted ? '#C0F0B8' : '#D4B8FF'}`,
                            borderRadius: 8,
                            padding: '4px 16px',
                            flexShrink: 0,
                            transition: 'all 0.4s ease',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 13,
                                lineHeight: '20px',
                                color: isCompleted ? '#26A411' : '#8B5CF6',
                            }}
                        >
                            {isCompleted ? 'Completed' : 'In Progress'}
                        </Text>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};

const stepsData = [
    {
        title: 'Application Submission',
        description: 'Your virtual account application has been submitted to Decentro for processing.',
        infoText: "We've received your entity details and are initiating the account creation process with our banking partner.",
        estimatedTime: 'Estimated time: Instant',
    },
    {
        title: 'Account Creation',
        description: 'Your dedicated virtual account is being created on the banking infrastructure.',
        infoText: 'This involves provisioning your account number, IFSC code, and linking it to your settlement bank account.',
        estimatedTime: 'Estimated time: 1–2 minutes',
    },
    {
        title: 'Sharing Account Details',
        description: 'Your virtual account credentials are ready and have been shared with you.',
        infoText: 'Your Virtual Account Number and IFSC code are now active. You can start receiving funds and processing payroll immediately.',
        estimatedTime: 'Estimated time: Instant',
    },
];

const STEP_DURATION = 1500;

const PayrollAccountProgress = () => {
    useScrollToTop();
    const navigate = useNavigate();
    const { data: account } = useGetPayrollAccountStatus();

    const [completedCount, setCompletedCount] = useState(0);
    const animationFinished = completedCount === stepsData.length;

    const successHeading =
        account?.type === 'bank'
            ? 'Your Bank Account is Verified'
            : 'Your Virtual Account is Ready';

    let detailRows: { label: string; value: string | number | null | undefined }[] = [];

    if (account?.type === 'virtual') {
        detailRows = [
            { label: 'Virtual Account Number', value: account.record.virtualAccountNumber },
            { label: 'IFSC Code', value: account.record.virtualAccountIfsc },
            { label: 'Bank Code', value: account.record.bankCode },
            { label: 'Account Holder', value: account.record.name },
            { label: 'Account Status', value: account.record.status || 'Active' },
        ].filter(r => r.value);
    } else if (account?.type === 'bank') {
        detailRows = [
            { label: 'Account Holder', value: account.record.accountHolderName },
            { label: 'Account Number', value: account.record.accountNumber },
            { label: 'IFSC Code', value: account.record.ifscCode },
            { label: 'Branch', value: account.record.branch },
            { label: 'Name at Bank', value: account.record.nameAtBank },
            { label: 'Account Status', value: account.record.accountStatus || 'Verified' },
        ].filter(r => r.value);
    }

    const isStatusReady =
        (account?.type === 'virtual' &&
            String(account.record.status || '').toUpperCase() === 'SUCCESS') ||
        (account?.type === 'bank' &&
            String(account.record.accountStatus || '').toUpperCase() === 'VALID');

    const allCompleted = animationFinished && isStatusReady;

    useEffect(() => {
        if (completedCount >= stepsData.length) return undefined;
        const timer = setTimeout(() => {
            setCompletedCount(prev => prev + 1);
        }, STEP_DURATION);
        return () => clearTimeout(timer);
    }, [completedCount]);

    const getStatus = (index: number): StepStatus => {
        if (index < completedCount) return 'completed';
        if (index === completedCount) return 'loading';
        return 'pending';
    };

    return (
        <Flex
            vertical
            align="center"
            gap={50}
            style={{ padding: '24px 16px 48px', maxWidth: 1180, margin: '0 auto', width: '100%' }}
        >
            {/* Header */}
            <Flex vertical align="center" gap={8}>
                <Title
                    level={2}
                    style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 32,
                        lineHeight: '42px',
                        textAlign: 'center',
                        color: '#000000',
                    }}
                >
                    Setting Up Your Virtual Account
                </Title>
                <Text
                    style={{
                        fontSize: 14,
                        lineHeight: '22px',
                        textAlign: 'center',
                        color: '#6A7282',
                    }}
                >
                    Your dedicated payroll account is being configured. This only takes a moment.
                </Text>
            </Flex>

            {/* Main Card */}
            <Flex
                vertical
                style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6E3DD',
                    boxShadow: '0px 2px 16px 1px rgba(0,0,0,0.06)',
                    borderRadius: 36,
                    padding: 52,
                    width: '100%',
                    gap: 52,
                }}
            >
                {/* Steps */}
                <Flex
                    vertical
                    style={{
                        paddingBottom: allCompleted ? 52 : 0,
                        borderBottom: allCompleted ? '0.5px solid #C4C4C4' : 'none',
                        width: '100%',
                        transition: 'padding-bottom 0.4s ease',
                    }}
                >
                    {stepsData.map((step, index) => (
                        <StepItem
                            key={index}
                            {...step}
                            status={getStatus(index)}
                            isLast={index === stepsData.length - 1}
                        />
                    ))}
                </Flex>

                {/* Success section — visible only after all steps complete */}
                {allCompleted && (
                    <Flex
                        vertical
                        align="center"
                        gap={32}
                        style={{
                            width: '100%',
                            animation: 'fadeIn 0.5s ease',
                        }}
                    >
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                        {/* Nested green circles with checkmark */}
                        <Flex vertical align="center" gap={16}>
                            <Flex
                                align="center"
                                justify="center"
                                style={{
                                    width: 122,
                                    height: 122,
                                    background: '#E8FAF0',
                                    borderRadius: '50%',
                                }}
                            >
                                <Flex
                                    align="center"
                                    justify="center"
                                    style={{
                                        width: 91.5,
                                        height: 91.5,
                                        background: '#D1F4E0',
                                        borderRadius: '50%',
                                    }}
                                >
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{
                                            width: 61,
                                            height: 61,
                                            background: '#45D483',
                                            borderRadius: '50%',
                                        }}
                                    >
                                        <CheckOutlined style={{ fontSize: 22, color: '#E6F7FF', fontWeight: 700 }} />
                                    </Flex>
                                </Flex>
                            </Flex>

                            <Text
                                style={{
                                    display: 'block',
                                    fontWeight: 700,
                                    fontSize: 22,
                                    lineHeight: '32px',
                                    color: '#000000',
                                    textAlign: 'center',
                                }}
                            >
                                {successHeading}
                            </Text>
                        </Flex>

                        {/* Account details card */}
                        <Flex
                            vertical
                            gap={16}
                            style={{
                                width: 520,
                                background: '#FFFFFF',
                                border: '0.5px solid rgba(204,204,204,0.8)',
                                borderRadius: 16,
                                padding: 24,
                            }}
                        >
                            {detailRows.map((row, idx) => (
                                <Fragment key={row.label}>
                                    {idx > 0 && <div style={{ borderTop: '0.5px solid #CBD5E1' }} />}
                                    <Flex justify="space-between" align="center">
                                        <Text style={{ fontSize: 14, lineHeight: '22px', color: '#6A7282' }}>
                                            {row.label}
                                        </Text>
                                        <Text strong style={{ fontSize: 14, lineHeight: '22px', color: '#101828' }}>
                                            {row.value}
                                        </Text>
                                    </Flex>
                                </Fragment>
                            ))}
                        </Flex>

                        {/* CTA Button */}
                        <button
                            type="button"
                            onClick={() => navigate(`/${paths.payroll.index}/${paths.payroll.salaryDashboard}`)}
                            style={{
                                width: '100%',
                                height: 44,
                                background: '#FF4F4F',
                                border: '1px solid #FF4F4F',
                                borderRadius: 8,
                                color: '#FFFFFF',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Go to Payroll Dashboard
                        </button>
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};

export default PayrollAccountProgress;
