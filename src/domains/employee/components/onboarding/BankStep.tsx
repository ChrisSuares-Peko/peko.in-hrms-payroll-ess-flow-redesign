import { InfoCircleFilled } from '@ant-design/icons';
import { Button, Flex, Form, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import BankIcon from '../../assets/icons/bank.svg';
import { onboardingBankSchema } from '../../schema';

export interface BankValues {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
}

interface BankStepProps {
    initialValues: BankValues;
    onContinue: (values: BankValues) => void | Promise<void>;
    onBack?: (values: BankValues) => void;
}

const BankStep = ({ initialValues, onContinue, onBack }: BankStepProps) => (
    <Formik
        initialValues={initialValues}
        validationSchema={onboardingBankSchema}
        onSubmit={values => onContinue(values)}
    >
        {({ handleSubmit, isSubmitting, values }) => (
            <Form onFinish={handleSubmit} layout="vertical">
                <Flex
                    vertical
                    gap={4}
                    className="p-6 bg-white border border-solid border-[#f0f0f0] rounded-2xl"
                    style={{ boxShadow: '0px 1.66px 8px 0px rgba(0, 0, 0, 0.06)' }}
                >
                    <Flex gap={12} align="center" className="mb-3">
                        <img src={BankIcon} alt="" className="size-7" />
                        <Flex vertical>
                            <Typography.Text className="font-semibold">
                                Bank Account Details
                            </Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">
                                Your salary will be deposited to this account.
                            </Typography.Text>
                        </Flex>
                    </Flex>

                    <TextInput
                        name="accountName"
                        label="Account Holder Name"
                        type="text"
                        placeholder="Enter account holder name"
                        allowAlphabetsAndSpaceOnly
                        maxLength={100}
                        isRequired
                    />
                    <TextInput
                        name="bankName"
                        label="Bank Name"
                        type="text"
                        placeholder="Enter bank name"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                        isRequired
                    />
                    <TextInput
                        name="accountNumber"
                        label="Account Number"
                        type="text"
                        placeholder="Enter account number"
                        allowNumbersOnly
                        isRequired
                    />
                    <TextInput
                        name="ifscCode"
                        label="IFSC Code"
                        type="text"
                        placeholder="Enter IFSC code"
                        allowAlphabetsAndNumbersOnly
                        isRequired
                    />
                    <TextInput
                        name="upiId"
                        label="UPI ID (optional)"
                        type="text"
                        placeholder="Enter UPI ID"
                    />

                    <Flex align="center" gap={8} className="px-3 py-2 mt-1 rounded-lg bg-[#fffcf2]">
                        <InfoCircleFilled className="text-bgOrange2" />
                        <Typography.Text className="text-xs text-gray-600">
                            Bank details will be verified by HR before your first salary is
                            processed.
                        </Typography.Text>
                    </Flex>
                </Flex>

                <Button
                    type="primary"
                    block
                    htmlType="submit"
                    loading={isSubmitting}
                    className="h-12 mt-6 font-medium rounded-lg"
                >
                    Continue
                </Button>
                {onBack && (
                    <Flex className="mt-3">
                        <Button
                            onClick={() => onBack?.(values)}
                            disabled={isSubmitting}
                            className="rounded-lg"
                        >
                            ← Back
                        </Button>
                    </Flex>
                )}
            </Form>
        )}
    </Formik>
);

export default BankStep;
