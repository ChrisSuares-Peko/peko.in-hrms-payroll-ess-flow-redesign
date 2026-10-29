import React, { useEffect, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import PayoutActivationForm from '@src/domains/dashboard/Payouts/components/PayoutActivationForm';
import useNupayMerchants from '@src/domains/dashboard/Payouts/hooks/useNupayMerchants';
import useNupayOnboardingApi from '@src/domains/dashboard/Payouts/hooks/useNupayOnboardingApi';
import { NupayOnboardingPayload } from '@src/domains/dashboard/Payouts/types';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useOrganizationSettingsApi from '../../hooks/OrganizationSettings/useOrganizationSettingsApi';
import { setPayrollProgress } from '../../slices/payrollAuth';

interface Props {
    setActiveTabKey: (key: any) => void;
    setRefresh: any;
}

type PageState = 'form' | 'pending' | 'success';

const WelcomeSalaryRolloutSetup: React.FC<Props> = ({ setActiveTabKey, setRefresh }) => {
    const dispatch = useAppDispatch();
    const { statusData, isLoading: isFetching, fetchStatus } = useNupayMerchants();
    const { onboardMerchant, isLoading } = useNupayOnboardingApi();
    const { updateSkipDashboard, isLoading: isFinishing } = useOrganizationSettingsApi();
    const [pageState, setPageState] = useState<PageState>('form');

    useEffect(() => {
        if (isFetching || !statusData) return;
        if (statusData.onboardingStatus === 'SUCCESS') {
            setPageState('success');
        } else if (statusData.onboardingStatus === 'PENDING') {
            setPageState('pending');
        } else {
            setPageState('form');
        }
    }, [statusData, isFetching]);

    const finishOnboarding = async () => {
        await updateSkipDashboard(true);
        // Reaching this step means every earlier gated step (company profile, payroll
        // cycle, salary/deduction components) is already done, so it's safe to mark
        // progress 100% here rather than waiting on the async refetch below — otherwise
        // the Dashboard mounts on stale (<100%) progress and briefly shows the
        // "Complete Your Onboarding" banner until that refetch resolves.
        dispatch(setPayrollProgress({ isSkippedDasboard: true, progress: '100%' }));
        setRefresh((prev: boolean) => !prev);
    };

    const handleSubmit = async (payload: NupayOnboardingPayload) => {
        const res = await onboardMerchant(payload);
        if (res) {
            dispatch(showToast({ description: res.message, variant: 'success' }));
            await fetchStatus();
        } else {
            dispatch(showToast({ description: 'Something went wrong. Please try again.', variant: 'error' }));
        }
    };

    if (isFetching) {
        return (
            <Flex justify="center" align="center" className="h-[50vh]">
                <Spin size="large" />
            </Flex>
        );
    }

    if (pageState === 'pending') {
        return (
            <Flex vertical align="center" gap={24} className="w-full py-16 text-center">
                <Flex
                    align="center"
                    justify="center"
                    className="h-[64px] w-[64px] rounded-full"
                    style={{ background: '#FBBF24' }}
                >
                    <CheckCircleFilled style={{ fontSize: 30, color: '#fff' }} />
                </Flex>
                <Flex vertical gap={12} align="center" className="max-w-[580px]">
                    <Typography.Title
                        level={2}
                        className="!mb-0 !text-[26px] !font-semibold !text-[#1F2A44]"
                    >
                        Salary Rollout Setup Under Review
                    </Typography.Title>
                    <Typography.Text className="text-[15px] leading-[1.75] text-[#6B7280]">
                        Dear Customer, your salary rollout activation request is currently under
                        review. Our team is verifying your details, and the account will be
                        activated automatically once the review is completed. This process
                        typically takes up to 24 hours.
                    </Typography.Text>
                </Flex>
                <Button
                    type="primary"
                    danger
                    loading={isFinishing}
                    className="!h-[44px] !rounded-lg !bg-[#FF4D4F] px-6 text-[14px] font-semibold shadow-none"
                    onClick={finishOnboarding}
                >
                    Go to Dashboard →
                </Button>
            </Flex>
        );
    }

    if (pageState === 'success') {
        return (
            <Flex vertical align="center" gap={20} className="w-full py-16 text-center">
                <Flex
                    align="center"
                    justify="center"
                    className="h-[64px] w-[64px] rounded-full"
                    style={{ background: '#22C55E' }}
                >
                    <CheckCircleFilled style={{ fontSize: 34, color: '#fff' }} />
                </Flex>
                <Flex vertical gap={8} align="center" className="max-w-[580px]">
                    <Typography.Title
                        level={2}
                        className="!mb-0 !text-[26px] !font-semibold !text-[#1F2A44]"
                    >
                        Salary Rollout Activated
                    </Typography.Title>
                    <Typography.Text className="text-[15px] text-[#6B7280]">
                        Your salary rollout account has been set up successfully
                    </Typography.Text>
                </Flex>
                <Button
                    type="primary"
                    danger
                    loading={isFinishing}
                    className="!h-[44px] !rounded-lg !bg-[#FF4D4F] px-6 text-[14px] font-semibold shadow-none"
                    onClick={finishOnboarding}
                >
                    Continue to Dashboard →
                </Button>
            </Flex>
        );
    }

    return (
        <Content>
            <div
                style={{
                    border: '1px solid #EAEAEA',
                    borderRadius: 16,
                    padding: '24px',
                    background: '#fff',
                }}
            >
                <PayoutActivationForm isLoading={isLoading} onSubmit={handleSubmit} />
            </div>

            <Flex justify="space-between" align="center" gap={10} className="w-full mt-6">
                <Button onClick={() => setActiveTabKey('4')} className="px-8">
                    <Typography.Text className="text-textRed">Back</Typography.Text>
                </Button>
                <Button className="px-8" loading={isFinishing} onClick={finishOnboarding}>
                    Skip the Salary rollout
                </Button>
            </Flex>
        </Content>
    );
};

export default WelcomeSalaryRolloutSetup;
