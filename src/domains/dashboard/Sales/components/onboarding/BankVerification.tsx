import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { CheckCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import { Flex, Form, Typography } from 'antd';
import { Formik, FormikProps, useFormikContext } from 'formik';

import { BANK_VERIFICATION_INFO_ROWS } from '../../constants/onboarding';
import BankVerificationForm from '../../forms/onboarding/BankVerificationForm';
import { bankVerificationSchema } from '../../schema/onboarding/bankVerificationSchema';
import { BankVerificationFormValues, VerifiedBankData } from '../../types/onboarding';
import { maskAccountNumber } from '../../utils/helperFunctions';
import LeftHeader from '../shared/LeftHeader';

type Props = {
    initialValues: BankVerificationFormValues;
    verifiedBankData: VerifiedBankData | null;
    onSubmit: (values: BankVerificationFormValues) => Promise<void>;
    onChange: (values: BankVerificationFormValues) => void;
};

export interface BankVerificationHandle {
    submitForm: () => void;
}

const BankVerificationValueSync = ({ onChange }: Pick<Props, 'onChange'>) => {
    const { values } = useFormikContext<BankVerificationFormValues>();

    useEffect(() => {
        onChange(values);
    }, [onChange, values]);

    return null;
};

const BankVerification = forwardRef<BankVerificationHandle, Props>(
    ({ initialValues, verifiedBankData, onSubmit, onChange }, ref) => {
        const formikRef = useRef<FormikProps<BankVerificationFormValues>>(null);

        useImperativeHandle(ref, () => ({
            submitForm: () => formikRef.current?.submitForm(),
        }));

        return (
            <Flex vertical gap={24}>
                <LeftHeader
                    title="Verify Bank Account"
                    description="Bank account verification is required to enable settlements and ensure funds reach you securely."
                    titleClass="text-base"
                />

                {verifiedBankData ? (
                    <Flex
                        vertical
                        gap={12}
                        className="px-5 py-4 bg-green-50 rounded-2xl border border-green-200"
                    >
                        <Flex align="center" gap={8}>
                            <CheckCircleFilled className="text-green-500 text-base" />
                            <Typography.Text className="!font-semibold !text-green-700">
                                Bank Account Verified Successfully
                            </Typography.Text>
                        </Flex>

                        {BANK_VERIFICATION_INFO_ROWS.map(({ label, key }) => (
                            <Flex key={key} justify="space-between" align="center">
                                <Typography.Text className="!text-gray-500 !text-sm">
                                    {label}
                                </Typography.Text>
                                <Typography.Text className="!text-sm !font-medium">
                                    {key === 'accountNumber'
                                        ? maskAccountNumber(verifiedBankData[key])
                                        : verifiedBankData[key]}
                                </Typography.Text>
                            </Flex>
                        ))}
                    </Flex>
                ) : (
                    <>
                        <Formik<BankVerificationFormValues>
                            innerRef={formikRef}
                            initialValues={initialValues}
                            enableReinitialize
                            validationSchema={bankVerificationSchema}
                            onSubmit={async (values, { setSubmitting }) => {
                                await onSubmit(values);
                                setSubmitting(false);
                            }}
                        >
                            <Form layout="vertical">
                                <BankVerificationValueSync onChange={onChange} />
                                <BankVerificationForm />
                            </Form>
                        </Formik>

                        <Flex
                            vertical
                            gap={4}
                            className="px-6 py-4 bg-amber-50 rounded-2xl border border-amber-200"
                        >
                            <Flex align="center" gap={8}>
                                <InfoCircleOutlined className="text-amber-500" />
                                <Typography.Text className="!font-semibold">
                                    Why is bank verification required?
                                </Typography.Text>
                            </Flex>
                            <Typography.Text className="!text-gray-600">
                                As per RBI guidelines, bank account verification ensures that all
                                settlements reach the correct and authorised account for your
                                business.
                            </Typography.Text>
                        </Flex>
                    </>
                )}
            </Flex>
        );
    }
);

export default BankVerification;
