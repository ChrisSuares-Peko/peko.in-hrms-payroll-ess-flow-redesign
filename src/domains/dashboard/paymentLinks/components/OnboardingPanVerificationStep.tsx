import { useState } from 'react';

import { ArrowRightOutlined, CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Input, Spin, Typography } from 'antd';

import { PanStepData } from '../types/activateCollectionsTypes';
import { OnboardingRecord } from '../types/paymentLinkTypes';

interface Props {
    onCancel: () => void;
    onContinue: () => void;
    loading?: boolean;
    initialData?: OnboardingRecord | null;
    saveDetails: (data: PanStepData) => Promise<OnboardingRecord | false>;
    title?:string;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

const OnboardingPanVerificationStep = ({
    onCancel,
    onContinue,
    loading,
    initialData,
    saveDetails,
    title = "Payment Link"
}: Props) => {
    const recordPan = initialData?.pan?.toUpperCase() || '';
    const profilePan = initialData?.profilePan?.toUpperCase() || '';
    const savedPan = recordPan || profilePan;
    const hasVerifiedSavedPan = Boolean(
        (recordPan && initialData?.panVerifiedAt) ||
            (!recordPan && profilePan && initialData?.profilePanVerified)
    );
    const [panInput, setPanInput] = useState(savedPan);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [detectedBusinessName, setDetectedBusinessName] = useState<string | null>(
        initialData?.businessName || null
    );
    const panSuffix = (() => {
        if (verifying) return <Spin size="small" />;
        if (verified || (hasVerifiedSavedPan && panInput.trim().toUpperCase() === savedPan)) return <CheckCircleFilled style={{ color: '#12B76A', fontSize: 16 }} />;
        return null;
    })();

    const showVerifiedState = async () => {
        setError('');
        setVerified(true);
        setVerifying(false);
    };

    const handleContinue = async () => {
        if (verified) {
            onContinue();
        } else {
            const normalizedPan = panInput.trim().toUpperCase();

            if (!panInput.trim()) {
                setError('Please enter the PAN number');
                return;
            }
            if (!PAN_REGEX.test(normalizedPan)) {
                setError('Please enter a valid PAN number.');
                return;
            }

            if (hasVerifiedSavedPan && normalizedPan === savedPan) {
                onContinue();
                return;
            }

            setVerifying(true);
            const result = await saveDetails({ pan: normalizedPan });
            if (result) {
                if (result.businessName) setDetectedBusinessName(result.businessName);
                await showVerifiedState();
            } else {
                setVerifying(false);
            }
        }
    };

    return (
        <Flex vertical gap={20} className="mt-4">
            <Flex vertical gap={3}>
                <Typography.Text className="text-[16px] font-semibold leading-[1.35] text-[#1F2A44]">
                    Verify PAN Details
                </Typography.Text>
                <Typography.Text className="text-xs leading-[1.4] text-[#667085]">
                    PAN verification is required to comply with KYC regulations and enable {title==="Payouts" ? "payout" :"payment collections"}.
                </Typography.Text>
            </Flex>

            <Flex vertical gap={6}>
                <Typography.Text className="text-[13px] font-medium text-[#344054]">
                    PAN <span style={{ color: '#FF4D4F' }}>*</span>
                </Typography.Text>
                <Input
                    placeholder="e.g. ABCDE1234F"
                    value={panInput}
                    onChange={e => {
                        // Only allow letters and numbers
                        const cleanValue = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        setPanInput(cleanValue);
                        setError('');
                        if (verified) setVerified(false);
                    }}
                    maxLength={10}
                    className="!h-10 !rounded-lg !text-[13px]"
                    status={error ? 'error' : undefined}
                    suffix={panSuffix}
                />
       
                {error && <Typography.Text className="text-[12px] text-[#FF4D4F]">{error}</Typography.Text>}
                {(verified || hasVerifiedSavedPan) && detectedBusinessName && (
                    <Flex align="center" gap={6} className="mt-1">
                        <CheckCircleFilled style={{ color: '#12B76A', fontSize: 13 }} />
                        <Typography.Text className="text-[12px] text-[#344054]">
                            Business name: <span className="font-semibold">{detectedBusinessName}</span>
                        </Typography.Text>
                    </Flex>
                )}
            </Flex>

                <Card
                    className="rounded-xl border border-[#FEF0C7] shadow-none overflow-hidden"
                    styles={{ body: { padding: '14px 16px', background: '#FFFCF0' } }}
                >
                    <Flex gap={10} align="flex-start">
                        <InfoCircleOutlined
                            style={{ fontSize: 14, color: '#F79009', flexShrink: 0, marginTop: 1 }}
                        />
                        <Flex vertical gap={4}>
                            <Typography.Text className="text-[13px] font-semibold text-[#344054]">
                                Why is PAN required?
                            </Typography.Text>
                            <Typography.Text className="text-[12px] leading-[1.5] text-[#667085]">
                                As per RBI guidelines, PAN verification is mandatory for businesses
                                collecting payments above ₹50,000 per transaction.
                            </Typography.Text>
                        </Flex>
                    </Flex>
                </Card>
<Button
                    type="primary"
                    danger
                    className="!h-9 !px-5 !text-[13px] !font-medium"
                    loading={verifying || loading}
                    disabled={verified || (hasVerifiedSavedPan && panInput.trim().toUpperCase() === savedPan)}
                    icon={<ArrowRightOutlined />}
                    onClick={handleContinue}
                >
                    Verify Pan
                </Button>
            <Flex justify="flex-end" gap={10} className="pt-1">
                <Button className="!h-9 !px-5 !text-[13px]" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    danger
                    className="!h-9 !px-5 !text-[13px] !font-medium"
                    loading={verifying || loading}
                    disabled={!(verified || (hasVerifiedSavedPan && panInput.trim().toUpperCase() === savedPan))}
                    icon={<ArrowRightOutlined />}
                    onClick={handleContinue}
                >
                    Continue
                </Button>
            </Flex>
        </Flex>
    );
};

export default OnboardingPanVerificationStep;
