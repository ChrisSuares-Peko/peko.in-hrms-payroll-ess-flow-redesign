import { useState } from 'react';

import { Card, Flex, Typography } from 'antd';

import ActivationSuccess from './ActivationSuccess';
import OnboardingBankVerificationStep from './OnboardingBankVerificationStep';
import OnboardingConsentStep from './OnboardingConsentStep';
import OnboardingPanVerificationStep from './OnboardingPanVerificationStep';
import OnboardingStepIndicator from './OnboardingStepIndicator';
import UnderReview from '../../Payouts/Pages/PayoutUnderReview';
import { usePaymentLinkOnboarding } from '../hooks/usePaymentLinkOnboarding';
import {
    ActivatePaymentCollectionsProps,
    BankStepData,
    PanStepData,
    Step1Data,
} from '../types/activateCollectionsTypes';
import { OnboardingRecord } from '../types/paymentLinkTypes';

const ActivatePaymentCollections = ({
    onCancel,
    onActivated,
    initialData,
    refresh,
    title = "Payment Links"
}: ActivatePaymentCollectionsProps) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [step1Data] = useState<Step1Data | null>(null);
    const [activatedRecord, setActivatedRecord] = useState<OnboardingRecord | null>(null);
    const { loading, record, submitPanStep, submitBankStep, submitStep2 } =
        usePaymentLinkOnboarding();
    const currentOnboardingData = record ?? initialData;
    if(initialData?.status === "approval-pending"){
        return  <UnderReview
           activationType={title}
         />
     }
    // const handleStep1Continue = async (data: Step1Data) => {
    //     const result = await submitStep1(data);
    //     if (!result) {
    //         return;
    //     }
    //     setStep1Data(data);

    //     const canAutoSkipPan =
    //         result.profilePan && result.profilePanVerified && !result.panVerifiedAt;

    //     if (canAutoSkipPan) {
    //         const panResult = await submitPanStep({ pan: result.profilePan as string });
    //         if (panResult) {
    //             setStep(3);
    //             return;
    //         }
    //     }

    //     setStep(2);
    // };

    const handlePanContinue = () => {
        setStep(2);
    };

    const handleBankContinue = (_data: BankStepData) => {
        setStep(3);
    };

    const handleActivate = async () => {
        const result = await submitStep2();
        if (!result) {
            return;
        }
        setActivatedRecord(result);
    };

    const handleContinue = () => {
        refresh();
        onActivated();
    };

    if (activatedRecord) {
        return (
            <ActivationSuccess
                virtualAccountNumber={activatedRecord.virtualAccountNumber}
                onContinue={handleContinue}
            />
        );
    }

    return (
        <Flex align="center" justify="center" className="w-full px-3 py-4 sm:px-4 sm:py-6">
            <Card
                bordered={false}
                className="w-full max-w-[600px] rounded-[20px] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                styles={{ body: { padding: 'clamp(20px, 4vw, 32px) clamp(16px, 5vw, 36px)' } }}
            >
                <Flex vertical gap={20}>
                    <Flex vertical gap={2}>
                        <Typography.Title
                            level={3}
                            className="!mb-0 !text-[22px] !font-bold !leading-[1.3] !text-[#1F2A44]"
                        >
                            Activate {title==="Payment Links" ? "Payment Collections" : "Payout"}
                        </Typography.Title>
                        <Typography.Text className="text-[13px] leading-[1.45] text-[#667085]">
                            Just 4 quick steps to start accepting payments
                        </Typography.Text>
                    </Flex>

                    <OnboardingStepIndicator step={step} />

                    {/* {step === 1 && (
                        <OnboardingBusinessDetailsStep
                            onCancel={onCancel}
                            onContinue={handleStep1Continue}
                            loading={loading}
                            initialData={currentOnboardingData}
                            title={title}
                        />
                    )} */}

                    {step === 1 && (
                        <OnboardingPanVerificationStep
                            onCancel={onCancel}
                            onContinue={handlePanContinue}
                            initialData={currentOnboardingData}
                            saveDetails={async (data: PanStepData) => {
                                const result = await submitPanStep(data);
                                if (!result) {
                                    return false;
                                }
                                return result;
                            }}
                            loading={loading}
                            title={title}
                        />
                    )}

                    {step === 2 && (
                        <OnboardingBankVerificationStep
                            step1Data={step1Data}
                            initialData={currentOnboardingData}
                            onBack={() => setStep(1)}
                            onContinue={handleBankContinue}
                            saveDetails={async data => {
                                const result = await submitBankStep({
                                    accountNumber: data.accountNumber,
                                    ifsc: data.ifsc,
                                    bankName: data.bankName,
                                    name: data.accountHolderName,
                                    phone: data.phone,
                                    ...(data.phoneOtp ? { phoneOtp: data.phoneOtp } : {}),
                                });

                                if (!result) {
                                    return false;
                                }

                                return result;
                            }}
                            loading={loading}
                        />
                    )}

                    {step === 3 && (
                        <OnboardingConsentStep
                            onBack={() => setStep(2)}
                            onActivate={handleActivate}
                            loading={loading}
                            initialData={currentOnboardingData}
                        />
                    )}
                </Flex>
            </Card>
        </Flex>
    );
};

export default ActivatePaymentCollections;
