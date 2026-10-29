import { useState } from 'react';

import { ArrowRightOutlined, CheckCircleFilled, EditOutlined, InfoCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import BankPhoneOtpModal from './BankPhoneOtpModal';
import { bankVerificationSchema } from '../schema/onboardingSchema';
import { BankStepData, Step1Data } from '../types/activateCollectionsTypes';
import { OnboardingRecord } from '../types/paymentLinkTypes';

interface Props {
    step1Data: Step1Data | null;
    initialData?: OnboardingRecord | null;
    onBack: () => void;
    onContinue: (data: BankStepData) => void;
    saveDetails: (data: BankStepData) => Promise<OnboardingRecord | false>;
    loading?: boolean;
}

type BankVerificationFormValues = BankStepData;

const getVerifiedDataFromRecord = (record?: OnboardingRecord | null): BankStepData | null => {
    if (!record?.bankVerifiedAt || !record.accountNumber || !record.ifsc) {
        return null;
    }

    return {
        accountNumber: record.accountNumber,
        bankName: record.bankVerificationResponse?.bank_name || record.bankName || '',
        ifsc: record.ifsc,
        accountHolderName:
            record.bankVerificationResponse?.name_at_bank || record.accountHolderName || '',
        phone: record.phone || '',
    };
};

const buildInitialValues = (
    step1Data: Step1Data | null,
    initialData?: OnboardingRecord | null
): BankVerificationFormValues => ({
    accountNumber: step1Data?.accountNumber || initialData?.accountNumber || '',
    ifsc: step1Data?.ifsc || initialData?.ifsc || '',
    bankName: step1Data?.bankName || initialData?.bankName || '',
    accountHolderName: initialData?.accountHolderName || '',
    phone: initialData?.phone || '',
});

const OnboardingBankVerificationStep = ({
    step1Data,
    initialData,
    onBack,
    onContinue,
    saveDetails,
    loading,
}: Props) => {
    const verifiedData = getVerifiedDataFromRecord(initialData);
    const [isEditing, setIsEditing] = useState(false);
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [phoneToVerify, setPhoneToVerify] = useState('');
    const [capturedOtp, setCapturedOtp] = useState<{ phone: string; otp: string } | null>(null);
    const initialValues = buildInitialValues(step1Data, initialData);
    const profilePhone = initialData?.phone || '';
    const savedBankPhone = initialData?.savedBankPhone || '';
    const accountForDisplay = verifiedData?.accountNumber || initialValues.accountNumber;
    const maskedAccount = accountForDisplay
        ? `${'*'.repeat(Math.max(0, accountForDisplay.length - 4))}${accountForDisplay.slice(-4)}`
        : '–';

    return (
        <Flex vertical gap={20} className="mt-4">
            <Flex vertical gap={3}>
                <Typography.Text className="text-[16px] font-semibold leading-[1.35] text-[#1F2A44]">
                    Verify Bank Account
                </Typography.Text>
                <Typography.Text className="text-xs leading-[1.4] text-[#667085]">
                    Bank account verification is required to enable settlements and ensure funds
                    reach you securely.
                </Typography.Text>
            </Flex>

            {verifiedData && !isEditing ? (
                <Card
                    className="rounded-xl border border-[#ABEFC6] shadow-none overflow-hidden"
                    styles={{ body: { padding: '16px 20px', background: '#F6FEF9' } }}
                >
                    <Flex vertical gap={12}>
                        <Flex align="center" justify="space-between">
                            <Flex align="center" gap={8}>
                                <CheckCircleFilled style={{ fontSize: 16, color: '#12B76A' }} />
                                <Typography.Text className="text-[14px] font-semibold text-[#027A48]">
                                    Bank Account Verified Successfully
                                </Typography.Text>
                            </Flex>
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => setIsEditing(true)}
                                className="!text-[#667085] hover:!text-[#1F2A44]"
                            >
                                Edit
                            </Button>
                        </Flex>
                        <Flex vertical gap={8}>
                            {(
                                [
                                    { label: 'Account Number', value: maskedAccount },
                                    { label: 'Bank Name', value: verifiedData.bankName || '–' },
                                    { label: 'IFSC Code', value: verifiedData.ifsc || '–' },
                                    {
                                        label: 'Account Holder Name',
                                        value: verifiedData.accountHolderName || '–',
                                    },
                                    { label: 'Phone Number', value: verifiedData.phone || '–' },
                                ] as const
                            ).map(row => (
                                <Flex key={row.label} justify="space-between" gap={16}>
                                    <Typography.Text className="text-[13px] text-[#667085]">
                                        {row.label}
                                    </Typography.Text>
                                    <Typography.Text className="text-[13px] font-medium text-[#1F2A44] text-right">
                                        {row.value}
                                    </Typography.Text>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                </Card>
            ) : (
                <Formik
                    initialValues={initialValues}
                    validationSchema={bankVerificationSchema}
                    enableReinitialize
                    onSubmit={async values => {
                        const trimmedPhone = values.phone.trim();
                        const result = await saveDetails({
                            accountNumber: values.accountNumber.trim(),
                            ifsc: values.ifsc.trim().toUpperCase(),
                            bankName: values.bankName,
                            accountHolderName: values.accountHolderName.trim(),
                            phone: trimmedPhone,
                            phoneOtp:
                                capturedOtp && capturedOtp.phone === trimmedPhone
                                    ? capturedOtp.otp
                                    : undefined,
                        });
                        if (result) {
                            setCapturedOtp(null);
                            if (isEditing) setIsEditing(false);
                        }
                    }}
                >
                    {({ values, handleSubmit }) => {
                        const currentPhone = values.phone?.trim() || '';
                        const isTrustedPhone =
                            !currentPhone ||
                            currentPhone === profilePhone ||
                            currentPhone === savedBankPhone;
                        const hasOtpForCurrent =
                            !!capturedOtp && capturedOtp.phone === currentPhone;
                        const requiresOtp = !isTrustedPhone && !hasOtpForCurrent;
                        // Invalidate captured OTP when phone changes
                        if (capturedOtp && capturedOtp.phone !== currentPhone && !otpModalOpen) {
                            queueMicrotask(() => setCapturedOtp(null));
                        }
                        return (
                        <Flex vertical gap={12}>
                            <Flex vertical gap={6}>
                                <Typography.Text className="text-[13px] font-medium text-[#344054]">
                                    Account Number <span style={{ color: '#FF4D4F' }}>*</span>
                                </Typography.Text>
                                <TextInput
                                    name="accountNumber"
                                    type="text"
                                    maxLength={18}
                                    minLength={9}
                                    placeholder="e.g. 0123456789"
                                    allowNumbersOnly
                                    values={values.accountNumber}
                                    formItemClass="!mb-0"
                                    classes="!h-10 !rounded-lg !text-[13px]"
                                />
                            </Flex>

                            <Flex vertical gap={6}>
                                <Typography.Text className="text-[13px] font-medium text-[#344054]">
                                    IFSC Code <span style={{ color: '#FF4D4F' }}>*</span>
                                </Typography.Text>
                                <TextInput
                                    name="ifsc"
                                    type="text"
                                    placeholder="e.g. HDFC0001234"
                                    values={values.ifsc}
                                    allowAlphabetsAndNumbersOnly
                                    convertToUppercase
                                    maxLength={11}
                                    formItemClass="!mb-0"
                                    classes="!h-10 !rounded-lg !text-[13px]"
                                />
                            </Flex>

                            <Flex vertical gap={6}>
                                <Typography.Text className="text-[13px] font-medium text-[#344054]">
                                    Account Holder Name <span style={{ color: '#FF4D4F' }}>*</span>
                                </Typography.Text>
                                <TextInput
                                    name="accountHolderName"
                                    type="text"
                                    placeholder="e.g. Acme Trading Pvt Ltd"
                                    values={values.accountHolderName}
                                    allowAlphabetsAndSpaceOnly
                                    maxLength={50}
                                    formItemClass="!mb-0"
                                    classes="!h-10 !rounded-lg !text-[13px]"
                                />
                            </Flex>

                            <Flex vertical gap={6}>
                                <Typography.Text className="text-[13px] font-medium text-[#344054]">
                                    Phone Number <span style={{ color: '#FF4D4F' }}>*</span>
                                </Typography.Text>
                                <TextInput
                                    name="phone"
                                    type="text"
                                    placeholder="Phone number from your profile"
                                    values={values.phone}
                                    allowNumbersOnly
                                    maxLength={10}
                                    inputMode="numeric"
                                    formItemClass="!mb-0"
                                    classes="!h-10 !rounded-lg !text-[13px]"
                                />
                                {!isTrustedPhone && hasOtpForCurrent && (
                                    <Flex align="center" gap={6}>
                                        <CheckCircleFilled
                                            style={{ fontSize: 13, color: '#12B76A' }}
                                        />
                                        <Typography.Text className="text-[12px] text-[#027A48]">
                                            Phone number verified via OTP
                                        </Typography.Text>
                                    </Flex>
                                )}
                                {!isTrustedPhone && !hasOtpForCurrent && currentPhone.length === 10 && (
                                    <Flex align="center" justify="space-between" gap={6}>
                                        <Typography.Text className="text-[12px] text-[#B54708]">
                                            This number differs from your registered one. Verify
                                            it via OTP to continue.
                                        </Typography.Text>
                                        <Button
                                            size="small"
                                            icon={<SafetyCertificateOutlined />}
                                            onClick={() => {
                                                setPhoneToVerify(currentPhone);
                                                setOtpModalOpen(true);
                                            }}
                                            className="!text-[12px] !text-[#FF4D4F] !border-[#FECDCA]"
                                        >
                                            Verify
                                        </Button>
                                    </Flex>
                                )}
                            </Flex>

                            <Card
                                className="rounded-xl border border-[#FEF0C7] shadow-none overflow-hidden"
                                styles={{ body: { padding: '14px 16px', background: '#FFFCF0' } }}
                            >
                                <Flex gap={10} align="flex-start">
                                    <InfoCircleOutlined
                                        style={{
                                            fontSize: 14,
                                            color: '#F79009',
                                            flexShrink: 0,
                                            marginTop: 1,
                                        }}
                                    />
                                    <Flex vertical gap={4}>
                                        <Typography.Text className="text-[13px] font-semibold text-[#344054]">
                                            Why is bank verification required?
                                        </Typography.Text>
                                        <Typography.Text className="text-[12px] leading-[1.5] text-[#667085]">
                                            As per RBI guidelines, bank account verification ensures
                                            that all settlements reach the correct and authorised
                                            account for your business.
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            </Card>

                            <Flex justify="flex-end" gap={10} className="pt-1">
                                <Button
                                    className="!h-9 !px-5 !text-[13px]"
                                    onClick={onBack}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    className="!h-9 !px-5 !text-[13px] !font-medium"
                                    loading={loading}
                                    icon={<ArrowRightOutlined />}
                                    disabled={requiresOtp}
                                    onClick={() => handleSubmit()}
                                >
                                    Continue
                                </Button>
                            </Flex>
                        </Flex>
                    );
                    }}
                </Formik>
            )}

            {verifiedData && !isEditing && (
                <Flex justify="flex-end" gap={10} className="pt-1">
                    <Button className="!h-9 !px-5 !text-[13px]" onClick={onBack}>
                        Back
                    </Button>
                    <Button
                        type="primary"
                        danger
                        className="!h-9 !px-5 !text-[13px] !font-medium"
                        icon={<ArrowRightOutlined />}
                        onClick={() => onContinue(verifiedData)}
                    >
                        Continue
                    </Button>
                </Flex>
            )}

            <BankPhoneOtpModal
                open={otpModalOpen}
                phone={phoneToVerify}
                onCancel={() => setOtpModalOpen(false)}
                onConfirm={otp => {
                    setCapturedOtp({ phone: phoneToVerify, otp });
                    setOtpModalOpen(false);
                }}
            />
        </Flex>
    );
};

export default OnboardingBankVerificationStep;
