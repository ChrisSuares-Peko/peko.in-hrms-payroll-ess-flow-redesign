import React, { useState } from 'react';

import { Card, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import OnboardingBankVerificationStep from '../../paymentLinks/components/OnboardingBankVerificationStep';
import OnboardingBusinessDetailsStep from '../../paymentLinks/components/OnboardingBusinessDetailsStep';
import OnboardingConsentStep from '../../paymentLinks/components/OnboardingConsentStep';
import OnboardingPanVerificationStep from '../../paymentLinks/components/OnboardingPanVerificationStep';
import OnboardingStepIndicator from '../../paymentLinks/components/OnboardingStepIndicator';
import { usePaymentLinkOnboarding } from '../../paymentLinks/hooks/usePaymentLinkOnboarding';
import {
    BankStepData,
    PanStepData,
    Step1Data,
} from '../../paymentLinks/types/activateCollectionsTypes';
import ProcureActivationSuccess from '../components/ProcureActivationSuccess';

export default function PaymentLinkOnboardingPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
    const [activated, setActivated] = useState(false);

    const { loading, record, submitStep1, submitPanStep, submitBankStep, submitStep2 } =
        usePaymentLinkOnboarding();

    const handleStep1Continue = async (data: Step1Data) => {
        const result = await submitStep1(data);
        if (!result) return;
        setStep1Data(data);
        setStep(2);
    };

    const handleBankContinue = (_data: BankStepData) => setStep(4);

    const handleActivate = async () => {
        const result = await submitStep2();
        if (!result) return;
        setActivated(true);
    };

    if (activated) {
        return <ProcureActivationSuccess onContinue={() => navigate(paths.dashboard.procure)} />;
    }

    return (
        <Flex align="center" justify="center" className="w-full px-4 py-6">
            <Card
                className="w-full max-w-[600px] rounded-[20px] border border-[#D7E2F0] shadow-none"
                styles={{ body: { padding: '32px 36px' } }}
            >
                <Flex vertical gap={20}>
                    <Flex vertical gap={2}>
                        <Typography.Title
                            level={3}
                            className="!mb-0 !text-[22px] !font-bold !leading-[1.3] !text-[#1F2A44]"
                        >
                            Activate Payment Collections
                        </Typography.Title>
                        <Typography.Text className="text-[13px] leading-[1.45] text-[#667085]">
                            Just 4 quick steps to start accepting payments
                        </Typography.Text>
                    </Flex>

                    {step > 1 && <OnboardingStepIndicator step={(step - 1) as 1 | 2 | 3} />}

                    {step === 1 && (
                        <OnboardingBusinessDetailsStep
                            onCancel={() => navigate(paths.dashboard.procure)}
                            onContinue={handleStep1Continue}
                            loading={loading}
                            initialData={record}
                        />
                    )}

                    {step === 2 && (
                        <OnboardingPanVerificationStep
                            onCancel={() => setStep(1)}
                            onContinue={() => setStep(3)}
                            initialData={record}
                            saveDetails={(data: PanStepData) => submitPanStep(data)}
                            loading={loading}
                        />
                    )}

                    {step === 3 && (
                        <OnboardingBankVerificationStep
                            step1Data={step1Data}
                            initialData={record}
                            onBack={() => setStep(2)}
                            onContinue={handleBankContinue}
                            saveDetails={async data => {
                                const result = await submitBankStep({
                                    accountNumber: data.accountNumber,
                                    ifsc: data.ifsc,
                                    bankName: data.bankName,
                                    name: data.accountHolderName,
                                    phone: data.phone,
                                });
                                if (!result) return false;
                                return result;
                            }}
                            loading={loading}
                        />
                    )}

                    {step === 4 && (
                        <OnboardingConsentStep
                            onBack={() => setStep(3)}
                            onActivate={handleActivate}
                            loading={loading}
                            initialData={record}
                        />
                    )}
                </Flex>
            </Card>
        </Flex>
    );
}
