import { Button, Flex, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { EmployeeBankDetails } from '../../api/onboarding';
import { useProfileUpdateRequest } from '../../hooks/useProfileUpdateRequest';

const { Text } = Typography;

interface BankUpdateFormValues {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
}

const validationSchema = Yup.object({
    bankName: Yup.string()
        .min(3, 'Bank name must be at least 3 characters')
        .required('Please enter your bank name'),
    accountNumber: Yup.string()
        .matches(/^\d+$/, 'Account number must contain only digits')
        .min(9, 'Account number must be at least 9 digits')
        .max(18, 'Account number cannot be more than 18 digits')
        .required('Please enter your account number'),
    ifscCode: Yup.string()
        .transform(value => (value ? value.replace(/\s+/g, '').toUpperCase() : value))
        .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code')
        .required('Please enter your IFSC code'),
});

interface RequestBankUpdateModalProps {
    open: boolean;
    onClose: () => void;
    bankDetails?: EmployeeBankDetails | null;
    onSuccess?: () => void;
}

const RequestBankUpdateModal = ({
    open,
    onClose,
    bankDetails,
    onSuccess,
}: RequestBankUpdateModalProps) => {
    const dispatch = useAppDispatch();
    const { submitBankUpdate } = useProfileUpdateRequest();

    const initialValues: BankUpdateFormValues = {
        bankName: bankDetails?.bankName ?? '',
        accountNumber: bankDetails?.accountNumber ?? '',
        ifscCode: bankDetails?.ifscCode ?? '',
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={null}
            centered
            width={870}
            destroyOnClose
            styles={{ content: { borderRadius: 24, padding: 32, overflow: 'hidden' } }}
        >
            <Formik
                enableReinitialize
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                    const isSubmitted = await submitBankUpdate(values);
                    setSubmitting(false);
                    if (isSubmitted) {
                        dispatch(
                            showToast({
                                description: 'Bank update request submitted successfully.',
                                variant: 'success',
                            })
                        );
                        resetForm();
                        onClose();
                        onSuccess?.();
                    }
                }}
            >
                {({ handleSubmit, isSubmitting, dirty }) => (
                    <Form
                        onFinish={handleSubmit}
                        layout="vertical"
                        className="[&_.ant-form-item]:!mb-2"
                    >
                        <div className="mb-2">
                            <Text className="text-[26px] font-semibold text-black">
                                Request Bank Update
                            </Text>
                        </div>
                        <div className="mb-10">
                            <Text className="text-sm" style={{ color: '#6a7282' }}>
                                Submit your new bank details. HR will verify and update them within
                                3 business days.
                            </Text>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                            <TextInput
                                name="bankName"
                                label="New Bank Name"
                                type="text"
                                isRequired
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />
                            <TextInput
                                name="ifscCode"
                                label="New IFSC Code"
                                type="text"
                                isRequired
                                allowAlphabetsAndNumbersOnly
                                convertToUppercase
                            />
                            <TextInput
                                name="accountNumber"
                                label="Account Number"
                                type="text"
                                isRequired
                                allowNumbersOnly
                            />
                        </div>

                        <Flex gap={12} className="mt-6">
                            <Button
                                className="flex-1 h-16 rounded-xl font-medium"
                                style={{
                                    borderColor: '#CBD5E1',
                                    paddingBlock: 18,
                                    paddingInline: 24,
                                }}
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                danger
                                htmlType="submit"
                                loading={isSubmitting}
                                disabled={!dirty}
                                className="flex-1 h-16 rounded-xl font-medium"
                                style={{ paddingBlock: 18, paddingInline: 24 }}
                            >
                                Submit Request
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default RequestBankUpdateModal;
