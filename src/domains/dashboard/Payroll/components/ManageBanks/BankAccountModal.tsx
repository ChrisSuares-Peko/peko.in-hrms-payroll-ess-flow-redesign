import { useState } from 'react';

import { Button, Flex, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { LABEL_COLOR, RED, VALUE_COLOR } from './constants';
import { verifyBankAccountApi } from '../../api/bankAccount';
import { bankAccountInitialValues, getBankAccountSchema } from '../../schema/manageBanks/manageBanksSchema';
import { BankAccountRecord, SalaryRolloutBankAccount, SalaryRolloutBankPayload } from '../../types/bankAccount';

const { Text } = Typography;

const accountTypeOptions = [
    { label: 'Savings', value: 'savings' },
    { label: 'Current', value: 'current' },
];

type BankAccountFormValues = typeof bankAccountInitialValues;
type BankAccountFormField = keyof BankAccountFormValues;

export interface BankAccountModalProps {
    open: boolean;
    mode: 'add' | 'edit';
    initial?: SalaryRolloutBankAccount;
    isLoading: boolean;
    isBranchRequired?: boolean;
    onClose: () => void;
    onSubmit: (values: SalaryRolloutBankPayload) => void;
}

const BankAccountModal = ({
    open,
    mode,
    initial,
    isLoading,
    isBranchRequired = false,
    onClose,
    onSubmit,
}: BankAccountModalProps) => {
    const { id, role } = useAppSelector((state) => state.reducer.auth);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<BankAccountRecord | null>(null);
    const [verifyAttempted, setVerifyAttempted] = useState(false);

    const resetVerify = () => {
        setVerifyResult(null);
        setVerifyAttempted(false);
    };

    const handleClose = () => {
        resetVerify();
        onClose();
    };

    const getRequiredFields = (): BankAccountFormField[] => [
        'accountHolderName',
        'bankName',
        'accountNumber',
        'ifscCode',
        'accountType',
        ...(isBranchRequired ? ['branch' as BankAccountFormField] : []),
    ];

    const handleVerify = async (values: BankAccountFormValues) => {
        setIsVerifying(true);
        try {
            const result = await verifyBankAccountApi({
                userId: id,
                userType: role,
                accountHolderName: values.accountHolderName,
                accountNumber: values.accountNumber,
                ifscCode: values.ifscCode,
                branch: values.branch || undefined,
            });
            setVerifyAttempted(true);
            setVerifyResult(result || null);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = (values: typeof bankAccountInitialValues) => {
        onSubmit({
            accountHolderName: values.accountHolderName,
            bankName: values.bankName,
            accountNumber: values.accountNumber,
            ifscCode: values.ifscCode,
            accountType: values.accountType,
            branch: values.branch || undefined,
        });
    };

    const isVerified = verifyResult?.accountStatus === 'SUCCESS';

    const initialValues = initial ? {
        accountHolderName: initial.accountHolderName ?? '',
        bankName: initial.bankName ?? '',
        accountNumber: initial.accountNumber ?? '',
        ifscCode: initial.ifscCode ?? '',
        accountType: (initial.accountType ?? 'savings') as 'savings' | 'current',
        branch: initial.branch ?? '',
    } : bankAccountInitialValues;

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width="clamp(400px, 55vw, 760px)"
            styles={{ content: { borderRadius: 16, padding: '28px 32px' } }}
            closeIcon={null}
            destroyOnClose
            afterClose={resetVerify}
        >
            <Flex vertical gap={4} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 'clamp(16px, 1.2vw, 20px)', fontWeight: 700, color: VALUE_COLOR }}>
                    {mode === 'add' ? 'Add Bank Account' : 'Edit Bank Account'}
                </Text>
                <Text style={{ fontSize: 'clamp(12px, 0.85vw, 14px)', color: LABEL_COLOR }}>
                    {mode === 'add'
                        ? 'Enter bank account details that will be used for Salary Rollout'
                        : 'Modify the bank account details for your salary rollout.'}
                </Text>
            </Flex>

            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={getBankAccountSchema(isBranchRequired)}
                onSubmit={handleSubmit}
            >
                {({ values, validateForm, setTouched, submitForm }) => {
                    const requiredFields = getRequiredFields();
                    const hasRequiredValues = requiredFields.every(field =>
                        String(values[field] ?? '').trim()
                    );
                    const isVerifyDisabled = isVerifying || !hasRequiredValues;
                    const handleVerifyClick = async () => {
                        const validationErrors = await validateForm();
                        const touchedRequiredFields = requiredFields.reduce(
                            (acc, field) => {
                                acc[field] = true;
                                return acc;
                            },
                            {} as Record<BankAccountFormField, boolean>
                        );

                        setTouched(touchedRequiredFields, true);

                        const hasRequiredErrors = requiredFields.some(field => validationErrors[field]);
                        if (hasRequiredErrors) return;

                        await handleVerify(values);
                    };

                    return (
                        <>
                            <Form layout="vertical">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                    <TextInput
                                        name="accountHolderName"
                                        label="Account Holder Name"
                                        placeholder="Enter account holder name"
                                        type="text"
                                        isRequired
                                        allowAlphabetsAndSpaceOnly
                                        maxLength={100}
                                    />
                                    <TextInput
                                        name="bankName"
                                        label="Bank Name"
                                        placeholder="Enter bank name"
                                        type="text"
                                        isRequired
                                        allowAlphabetsAndSpaceOnly
                                        maxLength={100}
                                    />
                                    <TextInput
                                        name="accountNumber"
                                        label="Account Number"
                                        placeholder="Enter account number"
                                        type="text"
                                        isRequired
                                        allowNumbersOnly
                                        maxLength={18}
                                    />
                                    <TextInput
                                        name="ifscCode"
                                        label="IFSC Code"
                                        placeholder="Enter IFSC code (e.g. HDFC0001234)"
                                        type="text"
                                        isRequired
                                        convertToUppercase
                                        allowAlphabetsAndNumbersOnly
                                        maxLength={11}
                                    />
                                    <SelectInput
                                        name="accountType"
                                        label="Account Type"
                                        placeholder="Select account type"
                                        isRequired
                                        options={accountTypeOptions}
                                    />
                                    <TextInput
                                        name="branch"
                                        label={isBranchRequired ? 'Branch Address' : 'Branch Name'}
                                        placeholder={isBranchRequired ? 'Enter branch address' : 'Enter branch name (optional)'}
                                        type="text"
                                        isRequired={isBranchRequired}
                                        maxLength={250}
                                    />
                                </div>
                            </Form>

                            {verifyAttempted && (
                                <div style={{
                                    marginTop: 4,
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    background: isVerified ? '#ecfdf5' : '#fef2f2',
                                    border: `1px solid ${isVerified ? '#43b75d' : RED}`,
                                }}>
                                    <Text style={{ fontSize: 13, fontWeight: 500, color: isVerified ? '#43b75d' : RED, display: 'block' }}>
                                        {verifyResult
                                            ? (verifyResult.validationMessage || verifyResult.accountStatus || 'Verification complete')
                                            : 'Verification failed. Please check the details and try again.'}
                                    </Text>
                                    {verifyResult?.nameAtBank && (
                                        <Text style={{ fontSize: 12, color: LABEL_COLOR, display: 'block', marginTop: 4 }}>
                                            Name at Bank: <strong>{verifyResult.nameAtBank}</strong>
                                            {verifyResult.nameMatchScore != null ? ` · Match score: ${verifyResult.nameMatchScore}%` : ''}
                                        </Text>
                                    )}
                                </div>
                            )}

                            <Flex justify="flex-end" gap={12} style={{ marginTop: 24 }}>
                                <Button
                                    onClick={handleVerifyClick}
                                    loading={isVerifying}
                                    disabled={isVerifyDisabled}
                                    style={{ borderRadius: 8, height: 38, padding: '0 20px', borderColor: RED, color: RED }}
                                >
                                    Verify Bank account
                                </Button>
                                <Button
                                    onClick={submitForm}
                                    loading={isLoading}
                                    style={{ borderRadius: 8, height: 38, padding: '0 20px', background: RED, borderColor: RED, color: '#fff' }}
                                >
                                    {mode === 'add' ? 'Add Account' : 'Update Bank Account'}
                                </Button>
                            </Flex>
                        </>
                    );
                }}
            </Formik>
        </Modal>
    );
};

export default BankAccountModal;
