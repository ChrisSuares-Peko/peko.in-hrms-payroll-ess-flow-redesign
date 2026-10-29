import React, { useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import { Formik } from 'formik';

import OtpModal from '@components/molecular/modals/OtpModal';

import AddDomesticAccountForm from '../../forms/AddDomesticAccountForm';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { addDomesticAccountSchema } from '../../schema/addDomesticAccountSchema';
import { AddDomesticAccountFormValues, DomesticAccount } from '../../types/ManageBankAccounts';

interface AddDomesticAccountProps {
    onCancel: () => void;
    onSubmit: (values: AddDomesticAccountFormValues, otp?: string) => Promise<boolean> | void;
    isLoading: boolean;
    defaultValues?: DomesticAccount;
    sendOtp?: (accountNumber: string, selectedId?: string) => Promise<boolean>;
}

const AddDomesticAccount: React.FC<AddDomesticAccountProps> = ({
    onCancel,
    onSubmit,
    isLoading,
    defaultValues,
    sendOtp,
}) => {
    const isEdit = !!defaultValues;
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: addDomesticAccountSchema,
    });
    const [isOtpOpen, setIsOtpOpen] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [pendingValues, setPendingValues] = useState<AddDomesticAccountFormValues | null>(null);

    const handleFormSubmit = async (
        values: AddDomesticAccountFormValues,
        handleSubmit: () => void,
        setFieldTouched: (field: string, touched: boolean) => void
    ) => {
        if (!sendOtp) {
            handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values);
            return;
        }

        const isValid = await addDomesticAccountSchema.isValid(values);
        if (!isValid) {
            handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values);
            return;
        }

        setIsSendingOtp(true);
        const selectedId = defaultValues ? String(defaultValues.id) : undefined;
        const sent = await sendOtp(values.accountNumber, selectedId);
        setIsSendingOtp(false);

        if (sent) {
            setPendingValues(values);
            setIsOtpOpen(true);
        }
    };

    const handleOtpVerify = async (otp: string) => {
        if (!pendingValues) return;
        const success = await onSubmit(pendingValues, otp);
        if (success) {
            setIsOtpOpen(false);
            setPendingValues(null);
        }
    };

    const handleOtpCancel = () => {
        setIsOtpOpen(false);
        setPendingValues(null);
    };

    const handleResendOtp = async () => {
        if (!pendingValues || !sendOtp) return;
        const selectedId = defaultValues ? String(defaultValues.id) : undefined;
        await sendOtp(pendingValues.accountNumber, selectedId);
    };

    return (
        <Flex vertical gap={24}>
            <Flex vertical gap={4}>
                <Typography.Text className="text-lg md:text-xl font-semibold text-[#101828]">
                    {isEdit ? 'Edit Domestic Account' : 'Add Domestic Account'}
                </Typography.Text>
                <Typography.Text className="text-sm text-[#6A7282]">
                    Enter your domestic bank account details for INR transactions
                </Typography.Text>
            </Flex>

            <Formik
                initialValues={{
                    accountHolderName: defaultValues?.accountHolderName || '',
                    bankName: defaultValues?.bankName || '',
                    accountNumber: defaultValues?.accountNumber || '',
                    ifscCode: defaultValues?.ifscCode || '',
                    accountType: defaultValues?.accountType || 'Savings',
                    bankBranch: defaultValues?.bankBranch || '',
                }}
                validationSchema={addDomesticAccountSchema}
                onSubmit={values => onSubmit(values)}
                enableReinitialize
            >
                {({ handleSubmit, setFieldTouched, values }) => (
                    <>
                        <AddDomesticAccountForm />
                        <Flex vertical gap={12} className="sm:flex-row sm:justify-end">
                            <Button
                                onClick={onCancel}
                                className="h-10 w-full sm:w-auto px-6 text-sm font-medium rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                danger
                                loading={isLoading || isSendingOtp}
                                className="h-10 w-full sm:w-auto px-6 text-sm font-medium rounded-lg"
                                onClick={() => handleFormSubmit(values, handleSubmit, setFieldTouched)}
                            >
                                {isEdit ? 'Save Changes' : 'Add Account'}
                            </Button>
                        </Flex>
                    </>
                )}
            </Formik>

            <OtpModal
                isOpen={isOtpOpen}
                title="Verify Bank Account"
                handleCancel={handleOtpCancel}
                handleSubmit={handleOtpVerify}
                isLoading={isLoading}
                onResend={handleResendOtp}
                isOtpSending={isSendingOtp}
            />
        </Flex>
    );
};

export default AddDomesticAccount;
