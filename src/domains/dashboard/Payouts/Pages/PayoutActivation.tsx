import { useEffect, useState } from 'react';

import { CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Spin, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { showToast } from '@src/slices/apiSlice';

import PayoutRejected from './PayoutRejected';
import underReviewIcon from '../assets/icons/underReviewIcon.svg';
import PayoutActivationForm from '../components/PayoutActivationForm';
import useNupayMerchants from '../hooks/useNupayMerchants';
import useNupayOnboardingApi from '../hooks/useNupayOnboardingApi';
import { NupayOnboardingPayload } from '../types';

type PageState = 'form' | 'pending' | 'success' | 'rejected';

const PayoutActivation = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { statusData, isLoading: isFetching } = useNupayMerchants();
    const { onboardMerchant, isLoading } = useNupayOnboardingApi();
    const [pageState, setPageState] = useState<PageState>('form');
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    useEffect(() => {
        if (isFetching) return;
        if (!statusData) return;
        if (statusData.onboardingStatus === 'SUCCESS') {
            navigate('/payouts/dashboard', { replace: true });
        } else if (statusData.onboardingStatus === 'PENDING') {
            setPageState('pending');
        } else if (statusData.onboardingStatus === 'FAILED') {
            setRejectionReason(statusData.rejectionReason ?? null);
            setPageState('rejected');
        }
    }, [statusData, isFetching, navigate]);

    const handleSubmit = async (payload: NupayOnboardingPayload) => {
        const res = await onboardMerchant(payload);
        if (res) {
            dispatch(showToast({ description: res.message, variant: 'success' }));
            setPageState('pending');
        }
    };

    if (isFetching) {
        return (
            <Flex align="center" justify="center" className="w-full py-20">
                <Spin size="large" />
            </Flex>
        );
    }

    if (pageState === 'rejected') {
        return (
            <PayoutRejected rejectionReason={rejectionReason} />
        );
    }

    if (pageState === 'pending') {
        return (
            <Flex vertical align="center" gap={24} className="w-full py-20 text-center">
                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#FBBF24]">
                    <img src={underReviewIcon} alt="under review" className="h-[36px] w-[36px]" />
                </div>
                <Flex vertical gap={12} align="center" className="max-w-[580px]">
                    <Typography.Title
                        level={2}
                        className="!mb-0 !text-[26px] !font-semibold !text-[#1F2A44]"
                    >
                        Payout Activation Under Review
                    </Typography.Title>
                    <Typography.Text className="text-[15px] leading-[1.75] text-[#6B7280]">
                        Dear Customer, Your payout activation request is currently under review. Our
                        team is verifying your details, and the account will be activated automatically
                        once the review is completed. This process typically takes up to 24 hours.
                    </Typography.Text>
                </Flex>
            </Flex>
        );
    }

    if (pageState === 'success') {
        return (
            <Flex vertical align="center" gap={20} className="w-full py-20 text-center">
                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#22C55E]">
                    <CheckCircleFilled style={{ fontSize: 34, color: '#fff' }} />
                </div>
                <Flex vertical gap={8} align="center" className="max-w-[580px]">
                    <Typography.Title
                        level={2}
                        className="!mb-0 !text-[26px] !font-semibold !text-[#1F2A44]"
                    >
                        Payment Collections Activated
                    </Typography.Title>
                    <Typography.Text className="text-[15px] text-[#6B7280]">
                        Your virtual account has been created successfully
                    </Typography.Text>
                </Flex>
                <Button
                    type="primary"
                    danger
                    className="!h-[44px] !rounded-lg !bg-[#FF4D4F] px-6 text-[14px] font-semibold shadow-none"
                    onClick={() => navigate('/payouts/dashboard')}
                >
                    Continue to Dashboard →
                </Button>
            </Flex>
        );
    }

    return (
        <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
            <div
                style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '32px',
                    background: '#fff',
                }}
            >
                <PayoutActivationForm isLoading={isLoading} onSubmit={handleSubmit} />
            </div>
        </div>
    );
};

export default PayoutActivation;
