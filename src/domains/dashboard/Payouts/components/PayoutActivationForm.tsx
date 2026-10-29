import { useState } from 'react';

import { CheckCircleFilled, CheckCircleOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Row, Typography } from 'antd';
import { Formik } from 'formik';

import CityAutoCompleteInput from '@src/components/atomic/inputs/CityAutoCompleteInput';
import FileUploadInput from '@src/components/atomic/inputs/FileUploadInput';
import SelectInput from '@src/components/atomic/inputs/SelectInput';
import TextInput from '@src/components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';
import { INDIAN_STATES } from '@utils/indianLocations';

import { step1ValidationSchema, step2ValidationSchema, step3ValidationSchema, step4ValidationSchema } from '../schema/payoutActivation';
import { NupayOnboardingPayload } from '../types';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Basic Information', 'Address', 'Bank Info', 'Documents Upload'];

const StepIndicator = ({ step }: { step: Step }) => (
    <Flex gap={0} className="gap-y-3 border-b border-[#E5E7EB]" wrap="wrap">
        {STEP_LABELS.map((label, idx) => {
            const id = (idx + 1) as Step;
            const isActive = step === id;
            const isDone = step > id;
            return (
                <Flex
                    key={id}
                    align="center"
                    gap={8}
                    className="pb-3 pr-8"
                    style={{
                        borderBottom: isActive ? '2px solid #FF4D4F' : '2px solid transparent',
                        marginBottom: -1,
                    }}
                >
                    {isDone ? (
                        <CheckCircleFilled style={{ fontSize: 18, color: '#22C55E' }} />
                    ) : (
                        <CheckCircleOutlined
                            style={{ fontSize: 18, color: isActive ? '#FF4D4F' : '#9CA3AF' }}
                        />
                    )}
                    <Typography.Text
                        className="text-[13px] font-medium"
                        // eslint-disable-next-line no-nested-ternary
                        style={{ color: isDone ? '#22C55E' : isActive ? '#FF4D4F' : '#9CA3AF' }}
                    >
                        {label}
                    </Typography.Text>
                </Flex>
            );
        })}
    </Flex>
);

const initialValues = {
    merchantName: '',
    contactNumber: '',
    email: '',
    websiteUrl: '',
    city: '',
    state: '',
    pincode: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    cancelledCheque: null as File | null,
};

const stepFields: Record<Step, (keyof typeof initialValues)[]> = {
    1: ['merchantName', 'contactNumber', 'email', 'websiteUrl'],
    2: ['city', 'state', 'pincode'],
    3: ['accountNumber', 'ifscCode', 'bankName'],
    4: ['cancelledCheque'],
};

interface PayoutActivationFormProps {
    isLoading: boolean;
    onSubmit: (payload: NupayOnboardingPayload) => void;
}

const PayoutActivationForm = ({ isLoading, onSubmit }: PayoutActivationFormProps) => {
    const [step, setStep] = useState<Step>(1);
    const { id } = useAppSelector(state => state.reducer.auth);
    const draftStorageKey = `nupayOnboardingDraft_${id}`;

    const [formInitialValues] = useState(() => {
        try {
            const saved = sessionStorage.getItem(draftStorageKey);
            if (saved) {
                return { ...initialValues, ...JSON.parse(saved), cancelledCheque: null };
            }
        } catch {
            // ignore malformed/unavailable storage
        }
        return initialValues;
    });

    const saveDraft = (values: typeof initialValues) => {
        try {
            const rest: Partial<typeof initialValues> = { ...values };
            delete rest.cancelledCheque;
            sessionStorage.setItem(draftStorageKey, JSON.stringify(rest));
        } catch {
            // storage unavailable — draft persistence is best-effort
        }
    };

    const getSchema = () => {
        if (step === 1) return step1ValidationSchema;
        if (step === 2) return step2ValidationSchema;
        if (step === 3) return step3ValidationSchema;
        return step4ValidationSchema;
    };

    const handleSubmit = (values: typeof initialValues) => {
        onSubmit({
            merchant_name: values.merchantName,
            contact_number: values.contactNumber,
            official_email: values.email,
            city: values.city,
            state: values.state,
            pincode: values.pincode,
            website_url: values.websiteUrl,
            bank_account_number: values.accountNumber || undefined,
            ifsc_code: values.ifscCode || undefined,
            bank_name: values.bankName || undefined,
            cancelled_cheque: values.cancelledCheque as File,
        });
    };

    return (
        <Formik
            initialValues={formInitialValues}
            validationSchema={getSchema()}
            validate={saveDraft}
            onSubmit={handleSubmit}
            enableReinitialize={false}
        >
            {({ setFieldTouched, validateForm, values }) => {
                const handleBack = () => {
                    if (step === 1) return;
                    setStep(s => (s - 1) as Step);
                };

                const handleNext = async () => {
                    const errors = await validateForm();
                    const currentFields = stepFields[step];
                    currentFields.forEach(f => setFieldTouched(f as string, true));
                    const hasErrors = currentFields.some(f => errors[f]);
                    if (hasErrors) return;

                    if (step === 4) {
                        handleSubmit(values);
                        return;
                    }
                    setStep(s => (s + 1) as Step);
                };

                return (
                    <Form layout="vertical">
                        <Flex vertical gap={24}>
                            <Flex vertical gap={4}>
                                <Typography.Title
                                    level={3}
                                    className="!mb-0 !text-[24px] !font-semibold !text-[#1F2A44]"
                                >
                                    Activate Payouts
                                </Typography.Title>
                                <Typography.Text className="text-[14px] text-[#6B7280]">
                                    Just a few quick steps to start making payouts
                                </Typography.Text>
                            </Flex>

                            <StepIndicator step={step} />

                            {step === 1 && (
                                <Row gutter={[24, 0]}>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="merchantName"
                                            label="Merchant Name"
                                            placeholder="Enter Merchant Name"
                                            type="text"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="contactNumber"
                                            label="Contact Number"
                                            placeholder="Enter Contact Number"
                                            type="text"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                            maxLength={10}
                                            allowNumbersOnly
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="email"
                                            label="Official Email"
                                            placeholder="Enter Official Email"
                                            type="email"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                            allowLowerCaseOnly
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="websiteUrl"
                                            label="Website URL"
                                            placeholder="Enter Website URL (e.g. https://example.com)"
                                            type="text"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                        />
                                    </Col>
                                </Row>
                            )}

                            {step === 2 && (
                                <Row gutter={[24, 0]}>
                                    <Col xs={24} md={12}>
                                        <SelectInput
                                            name="state"
                                            label="State"
                                            placeholder="Select State"
                                            isRequired
                                            size="large"
                                            showSearch
                                            allowClear
                                            options={INDIAN_STATES.map(s => ({ value: s.name, label: s.name }))}
                                            filterOption={(input, option) =>
                                                option?.children?.toLowerCase().includes(input.toLowerCase())
                                            }
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <CityAutoCompleteInput
                                            name="city"
                                            stateFieldName="state"
                                            label="City"
                                            placeholder="Enter City"
                                            isRequired
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="pincode"
                                            label="Pincode"
                                            placeholder="Enter Pincode"
                                            type="text"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                            maxLength={6}
                                            allowNumbersOnly
                                        />
                                    </Col>
                                </Row>
                            )}

                            {step === 3 && (
                                <Row gutter={[24, 0]}>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="accountNumber"
                                            label="Account Number"
                                            placeholder="Enter Account Number"
                                            type="text"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                            maxLength={18}
                                            allowNumbersOnly
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="ifscCode"
                                            label="IFSC Code"
                                            placeholder="e.g. SBIN0001234"
                                            type="text"
                                            isRequired
                                            size="large"
                                            classes="!rounded-lg"
                                            maxLength={11}
                                            allowUpperCaseOnly
                                            allowAlphabetsAndNumbersOnly
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <TextInput
                                            name="bankName"
                                            label="Bank Name (Optional)"
                                            placeholder="e.g. State Bank of India"
                                            type="text"
                                            size="large"
                                            classes="!rounded-lg"
                                            maxLength={50}
                                            allowAlphabetsAndSpaceOnly
                                        />
                                    </Col>
                                </Row>
                            )}

                            {step === 4 && (
                                <Row gutter={[24, 20]}>
                                    <Col xs={24} md={12}>
                                        <FileUploadInput
                                            name="cancelledCheque"
                                            label="Cancelled Cheque"
                                            isRequired
                                            returnOriginalFile
                                            showFileName
                                            allowFileDelete
                                            allowedFileTypes={['image/jpeg', 'image/png', 'image/bmp', 'application/pdf']}
                                            maxFileSize={5120}
                                            size="middle"
                                            descriptionText="File Formats Supported: JPG, JPEG, PNG. Max. size: 5 MB"
                                        />
                                    </Col>
                                </Row>
                            )}

                            <Flex justify="flex-end" gap={12} className="border-t border-[#E5E7EB] pt-5">
                                <Button
                                    className="!h-[44px] !rounded-lg !border-[#D0D5DD] !text-[#475467]"
                                    onClick={handleBack}
                                    disabled={step === 1}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    loading={isLoading}
                                    className="!h-[44px] !rounded-lg !bg-[#FF4D4F] px-6 text-[14px] font-semibold shadow-none"
                                    onClick={handleNext}
                                >
                                    {step === 4 ? 'Activate Now →' : 'Continue →'}
                                </Button>
                            </Flex>
                        </Flex>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default PayoutActivationForm;
