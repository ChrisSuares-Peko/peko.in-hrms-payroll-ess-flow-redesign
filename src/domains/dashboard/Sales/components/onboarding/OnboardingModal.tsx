import { useEffect, useRef, useState } from 'react';

import { ArrowRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Modal } from 'antd';

import { useAppDispatch } from '@src/hooks/hooks';
import { showToast } from '@src/slices/apiSlice';

import ActivationSuccess from './ActivationSuccess';
import BankVerification, { BankVerificationHandle } from './BankVerification';
import ConsentConfirm from './ConsentConfirm';
import GetStarted from './GetStarted';
import PANVerification from './PANVerification';
import ReviewDetails from './ReviewDetails';
import {
    BACK_STEP,
    DEFAULT_BANK_VERIFICATION_VALUES,
    DEFAULT_CURRENCY_ACCOUNT_BUSINESS,
    STEP_LABELS,
    STEP_ORDER,
} from '../../constants/onboarding';
import useOnboarding from '../../hooks/useOnboarding';
import { panVerificationSchema } from '../../schema/onboarding/panVerificationSchema';
import {
    BankAccountFormValues,
    BankVerificationFormValues,
    OnboardingStep,
    VerifiedBankData,
    VirtualAccountResponse,
} from '../../types/onboarding';
import LeftHeader from '../shared/LeftHeader';

interface OnboardingModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess?: () => void;
    type?: 'payment-link' | 'currency-account';
    prefillData?: VirtualAccountResponse | null;
}

const getInitialStep = (d?: VirtualAccountResponse | null): OnboardingStep => {
    if (!d) return 'get-started';
    if (d.bankVerifiedAt) return 'consent';
    if (d.panVerifiedAt) return 'bank-verification';
    if (d.businessName) return 'pan';
    return 'review';
};

const OnboardingModal = ({
    open,
    onCancel,
    onSuccess,
    type = 'payment-link',
    prefillData,
}: OnboardingModalProps) => {
    const {
        isSavingStep1,
        isSavingPan,
        isSavingBank,
        isActivating,
        saveStep1,
        savePanStep,
        saveBankStep,
        activateNow,
    } = useOnboarding(type);
    const dispatch = useAppDispatch();
    const bankFormRef = useRef<BankVerificationHandle>(null);
    const [step, setStep] = useState<OnboardingStep>('get-started');
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [consent, setConsent] = useState(false);
    const [virtualAccount, setVirtualAccount] = useState<string | null>(null);
    const [formData, setFormData] = useState({ ...DEFAULT_CURRENCY_ACCOUNT_BUSINESS });
    const [pan, setPan] = useState('');
    const [bankVerificationValues, setBankVerificationValues] =
        useState<BankVerificationFormValues>(DEFAULT_BANK_VERIFICATION_VALUES);
    const [verifiedPan, setVerifiedPan] = useState<string | null>(null);
    const [verifiedBankData, setVerifiedBankData] = useState<VerifiedBankData | null>(null);

    useEffect(() => {
        if (!open) return;
        setStep(getInitialStep(prefillData));
        setFormData(
            prefillData
                ? {
                      businessName: prefillData.businessName || '',
                      bankName: prefillData.bankName || '',
                      accountNumber: prefillData.accountNumber || '',
                      ifsc: prefillData.ifsc || '',
                  }
                : { ...DEFAULT_CURRENCY_ACCOUNT_BUSINESS }
        );
        setPan(prefillData?.pan || '');
        setBankVerificationValues({
            accountNumber: prefillData?.accountNumber || DEFAULT_BANK_VERIFICATION_VALUES.accountNumber,
            ifsc: prefillData?.ifsc || DEFAULT_BANK_VERIFICATION_VALUES.ifsc,
            name: prefillData?.accountHolderName || DEFAULT_BANK_VERIFICATION_VALUES.name,
            phone: prefillData?.phone || DEFAULT_BANK_VERIFICATION_VALUES.phone,
        });
        setVerifiedPan(prefillData?.panVerifiedAt ? (prefillData.pan || null) : null);
        setVerifiedBankData(
            prefillData?.bankVerifiedAt
                ? {
                      bankName: prefillData.bankName || '',
                      accountNumber: prefillData.accountNumber || '',
                      ifsc: prefillData.ifsc || '',
                      accountHolderName: prefillData.accountHolderName || '',
                      phone: prefillData.phone || '',
                  }
                : null
        );
        setIsEditingBank(false);
        setConsent(false);
        setVirtualAccount(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleClose = () => {
        onCancel();
    };

    const handleSuccessDone = () => {
        onSuccess?.();
        onCancel();
    };

    const handleBankSubmit = async (values: BankVerificationFormValues) => {
        const data = await saveBankStep({ ...values, bankName: formData.bankName });
        if (data) setVerifiedBankData(data);
    };

    const handleContinue = async () => {
        if (step === 'review') {
            const { businessName, bankName, accountNumber, ifsc } = formData;
            if (!businessName?.trim()) {
                dispatch(
                    showToast({ description: 'Business name is required.', variant: 'error' })
                );
                return;
            }
            if (!bankName?.trim() || !accountNumber?.trim() || !ifsc?.trim()) {
                dispatch(
                    showToast({
                        description: 'Please fill in all bank account details.',
                        variant: 'error',
                    })
                );
                return;
            }
            const ok = await saveStep1(formData);
            if (ok) setStep('pan');
        } else if (step === 'pan') {
            if (verifiedPan) {
                setStep('bank-verification');
                return;
            }
            if (!pan.trim()) {
                dispatch(
                    showToast({ description: 'Please enter your PAN number.', variant: 'error' })
                );
                return;
            }
            const phone = await savePanStep(pan);
            if (phone !== null) {
                setVerifiedPan(pan);
                if (phone) setBankVerificationValues(prev => ({ ...prev, phone }));
            }
        } else if (step === 'bank-verification') {
            if (verifiedBankData) {
                setStep('consent');
                return;
            }
            bankFormRef.current?.submitForm();
        }
    };

    const handleActivate = async () => {
        const account = await activateNow(formData);
        if (account === null) return;
        setVirtualAccount(account);
        setStep('success');
    };

    const handleBack = () => {
        if (step === 'pan' && verifiedPan) {
            setVerifiedPan(null);
            return;
        }

        if (step === 'bank-verification' && verifiedBankData) {
            setVerifiedBankData(null);
            return;
        }

        if (BACK_STEP[step]) {
            setStep(BACK_STEP[step]!);
            return;
        }

        handleClose();
    };

    const handleSaveBank = (values: BankAccountFormValues) => {
        setFormData(prev => ({ ...prev, ...values }));
        setBankVerificationValues(prev => ({
            ...prev,
            accountNumber: values.accountNumber,
            ifsc: values.ifsc,
        }));
        setIsEditingBank(false);
    };

    const isMultiStep =
        step === 'review' || step === 'pan' || step === 'bank-verification' || step === 'consent';

    const currentStepIdx = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);

    const isContinueLoading =
        (step === 'review' && isSavingStep1) ||
        (step === 'pan' && isSavingPan) ||
        (step === 'bank-verification' && isSavingBank) ||
        (step === 'consent' && isActivating);

    const isContinueDisabled =
        (step === 'consent' && !consent) ||
        (step === 'pan' && !verifiedPan && !panVerificationSchema.isValidSync({ pan }));

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={650}
            closable={false}
            destroyOnHidden
            className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:p-0 [&_.ant-modal-content]:overflow-hidden"
            styles={{ body: { maxHeight: '90vh', overflowY: 'auto' } }}
        >
            <Flex vertical className="p-7">
                {step === 'get-started' && <GetStarted onNext={() => setStep('review')} />}

                {isMultiStep && (
                    <Flex vertical gap={20}>
                        <LeftHeader
                            title="Activate Payment Collections"
                            description="Just 4 quick steps to start accepting payments"
                        />

                        <Flex className="border-b border-[#E4E4E7]">
                            {STEP_ORDER.map(s => {
                                const idx = STEP_ORDER.indexOf(s);
                                const isActive = s === step;
                                const isDone = idx < currentStepIdx;
                                return (
                                    <Flex
                                        key={s}
                                        align="center"
                                        gap={6}
                                        className={`pb-3 pt-2 pr-5 text-sm font-medium border-b-2 cursor-default select-none ${
                                            isActive
                                                ? 'border-[#FF4F4F] text-[#FF4F4F]'
                                                : 'border-transparent text-[#6A7282]'
                                        }`}
                                    >
                                        <CheckCircleOutlined
                                            className={isDone ? 'text-[#FF4F4F]' : ''}
                                        />
                                        {STEP_LABELS[s]}
                                    </Flex>
                                );
                            })}
                        </Flex>

                        {step === 'review' && (
                            <ReviewDetails
                                data={formData}
                                isEditingBank={isEditingBank}
                                onEditBank={() => setIsEditingBank(true)}
                                onSaveBank={handleSaveBank}
                                onCancelEditBank={() => setIsEditingBank(false)}
                                onSaveBusiness={name =>
                                    setFormData(prev => ({ ...prev, businessName: name }))
                                }
                            />
                        )}

                        {step === 'pan' && (
                            <PANVerification
                                pan={pan}
                                onChange={setPan}
                                verifiedPan={verifiedPan}
                                isVerifying={isSavingPan}
                                onVerify={async () => {
                                    const phone = await savePanStep(pan);
                                    if (phone !== null) {
                                        setVerifiedPan(pan);
                                        if (phone) setBankVerificationValues(prev => ({ ...prev, phone }));
                                    }
                                }}
                            />
                        )}

                        {step === 'bank-verification' && (
                            <BankVerification
                                ref={bankFormRef}
                                initialValues={{
                                    accountNumber:
                                        bankVerificationValues.accountNumber || formData.accountNumber,
                                    ifsc: bankVerificationValues.ifsc || formData.ifsc,
                                    name: bankVerificationValues.name,
                                    phone: bankVerificationValues.phone,
                                }}
                                verifiedBankData={verifiedBankData}
                                onSubmit={handleBankSubmit}
                                onChange={setBankVerificationValues}
                            />
                        )}

                        {step === 'consent' && (
                            <ConsentConfirm
                                data={formData}
                                consent={consent}
                                onConsentChange={setConsent}
                            />
                        )}

                        <Flex justify="end" gap={12}>
                            <Button className="h-10" onClick={handleBack}>
                                {BACK_STEP[step] ? 'Back' : 'Cancel'}
                            </Button>
                            <Button
                                type="primary"
                                danger
                                className="h-10"
                                icon={<ArrowRightOutlined />}
                                iconPosition="end"
                                disabled={isContinueDisabled}
                                loading={isContinueLoading}
                                onClick={step === 'consent' ? handleActivate : handleContinue}
                            >
                                {step === 'consent' ? 'Activate Now' : 'Continue'}
                            </Button>
                        </Flex>
                    </Flex>
                )}

                {step === 'success' && (
                    <ActivationSuccess virtualAccount={virtualAccount} onDone={handleSuccessDone} />
                )}
            </Flex>
        </Modal>
    );
};

export default OnboardingModal;
