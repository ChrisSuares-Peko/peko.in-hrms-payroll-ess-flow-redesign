import { useState } from 'react';

import { ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Button, Flex, Form, Input, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { verifyNupayBankAccount } from '../../api';
import { IFSC_REGEX, NupayOnboardingFormState } from '../../types/activateCollectionsTypes';

interface Props {
    initialValues?: Partial<NupayOnboardingFormState>;
    onBack: () => void;
    onNext: (values: Partial<NupayOnboardingFormState>) => void;
}

// Step 3 — Bank Details with account verification (replaces the old penny-drop check).
const NupayBankStep = ({ initialValues, onBack, onNext }: Props) => {
    const [form] = Form.useForm();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(!!initialValues?.bankVerified);
    const [holderName, setHolderName] = useState(initialValues?.accountHolderName || '');

    // Any edit invalidates a prior verification.
    const resetVerification = () => {
        if (verified) setVerified(false);
        if (holderName) setHolderName('');
    };

    const handleVerify = async () => {
        try {
            await form.validateFields(['accountHolderName', 'bankAccountNumber', 'ifscCode']);
        } catch {
            return;
        }
        const { accountHolderName, bankAccountNumber, ifscCode } = form.getFieldsValue();
        setVerifying(true);
        const result = await verifyNupayBankAccount({
            userId: id,
            userType: role,
            accountNumber: bankAccountNumber,
            ifsc: ifscCode,
            accountName: accountHolderName,
        });
        setVerifying(false);

        if (result === false) {
            // API error already surfaced by the global response interceptor toast
            return;
        }
        if (!result.verified) {
            dispatch(showToast({ variant: 'error', description: result.message || 'Account verification failed' }));
            return;
        }
        setVerified(true);
        setHolderName(result.accountHolderName || '');
        dispatch(showToast({ variant: 'success', description: 'Bank account verified' }));
    };

    const handleFinish = (values: { bankAccountNumber: string; ifscCode: string; accountHolderName: string }) => {
        if (!verified) {
            dispatch(showToast({ variant: 'warning', description: 'Please verify the bank account before continuing' }));
            return;
        }
        onNext({
            bankAccountNumber: values.bankAccountNumber,
            ifscCode: values.ifscCode?.toUpperCase(),
            accountHolderName: holderName || values.accountHolderName,
            bankVerified: true,
        });
    };

    return (
        <Form
            form={form}
            layout="vertical"
            requiredMark
            initialValues={initialValues}
            onFinish={handleFinish}
            className="mt-2"
        >
            <Flex gap={20} wrap="wrap">
                <Form.Item
                    name="accountHolderName"
                    label="Account Holder Name"
                    className="min-w-[260px] flex-1"
                    rules={[{ required: true, message: 'Account holder name is required' }]}
                >
                    <Input placeholder="Enter Account Holder Name" onChange={resetVerification} className="!h-11 !rounded-lg" />
                </Form.Item>
                <Form.Item
                    name="bankAccountNumber"
                    label="Bank Account Number"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'Account number is required' },
                        { pattern: /^\d{9,18}$/, message: 'Account number must be 9 to 18 digits' },
                    ]}
                >
                    <Input placeholder="Enter Bank Account Number" maxLength={18} onChange={resetVerification} className="!h-11 !rounded-lg" />
                </Form.Item>
                <Form.Item
                    name="ifscCode"
                    label="IFSC Code"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'IFSC is required' },
                        { pattern: IFSC_REGEX, message: 'Enter a valid IFSC' },
                    ]}
                >
                    <Input placeholder="Enter IFSC Code" onChange={resetVerification} className="!h-11 !rounded-lg uppercase" />
                </Form.Item>
            </Flex>

            <Flex align="center" gap={12} className="mb-2">
                <Button loading={verifying} onClick={handleVerify} disabled={verified} className="!h-9">
                    {verified ? 'Verified' : 'Verify Account'}
                </Button>
                {verified && (
                    <Flex align="center" gap={6}>
                        <CheckCircleFilled style={{ color: '#12B76A', fontSize: 14 }} />
                        <Typography.Text className="text-[13px] text-[#12B76A]">
                            {holderName ? `Verified — ${holderName}` : 'Account verified'}
                        </Typography.Text>
                    </Flex>
                )}
            </Flex>

            <Flex justify="end" gap={12} className="mt-2">
                <Button onClick={onBack} className="!h-10 !border-[#FF4D4F] !px-6 !text-[#FF4D4F]">
                    Back
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    className="!h-10 !border-0 !bg-[#FF4D4F] !px-6 font-semibold"
                >
                    Continue <ArrowRightOutlined />
                </Button>
            </Flex>
        </Form>
    );
};

export default NupayBankStep;
