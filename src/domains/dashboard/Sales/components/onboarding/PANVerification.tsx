import { useEffect } from 'react';

import { CheckCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Typography } from 'antd';
import { Formik, useFormikContext } from 'formik';

import PANVerificationForm from '../../forms/onboarding/PANVerificationForm';
import { panVerificationSchema } from '../../schema/onboarding/panVerificationSchema';
import { PANVerificationFormValues } from '../../types/onboarding';
import LeftHeader from '../shared/LeftHeader';

type Props = {
    pan: string;
    onChange: (value: string) => void;
    verifiedPan: string | null;
    onVerify: () => void;
    isVerifying: boolean;
};

const PANValueSync = ({ onChange }: Pick<Props, 'onChange'>) => {
    const { values } = useFormikContext<PANVerificationFormValues>();

    useEffect(() => {
        onChange(values.pan);
    }, [onChange, values.pan]);

    return null;
};

const PANVerification = ({ pan, onChange, verifiedPan, onVerify, isVerifying }: Props) => (
    <Flex vertical gap={24}>
        <LeftHeader
            title="Verify PAN Details"
            description="PAN verification is required to comply with KYC regulations and enable payment collections."
            titleClass="text-base"
        />

        {verifiedPan ? (
            <Flex
                align="center"
                gap={12}
                className="px-4 py-4 md:px-6 bg-green-50 rounded-2xl border border-green-200"
            >
                <CheckCircleOutlined className="text-green-500 text-xl flex-shrink-0" />
                <Flex vertical gap={1}>
                    <Typography.Text className="!font-semibold !text-green-700">
                        PAN Verified Successfully
                    </Typography.Text>
                    <Typography.Text className="!text-gray-600 !text-sm">
                        {verifiedPan}
                    </Typography.Text>
                </Flex>
            </Flex>
        ) : (
            <>
                <Flex vertical gap={8} className="sm:flex-row sm:items-start">
                    <Formik<PANVerificationFormValues>
                        initialValues={{ pan }}
                        enableReinitialize
                        validationSchema={panVerificationSchema}
                        onSubmit={() => undefined}
                        validateOnMount
                    >
                        <Form layout="vertical" className="flex-1">
                            <PANValueSync onChange={onChange} />
                            <PANVerificationForm />
                        </Form>
                    </Formik>
                    <Button
                        type="primary"
                        danger
                        loading={isVerifying}
                        disabled={!panVerificationSchema.isValidSync({ pan })}
                        onClick={onVerify}
                        className="w-full sm:w-auto sm:mt-[30px] flex-shrink-0"
                    >
                        Verify PAN
                    </Button>
                </Flex>

                <Flex
                    vertical
                    gap={4}
                    className="px-4 py-4 md:px-6 bg-amber-50 rounded-2xl border border-amber-200"
                >
                    <Typography.Text className="!font-semibold">
                        Why is PAN required?
                    </Typography.Text>
                    <Typography.Text className="!text-gray-600">
                        As per RBI guidelines, PAN verification is mandatory for businesses
                        collecting payments above Rs. 50,000 per transaction.
                    </Typography.Text>
                </Flex>
            </>
        )}
    </Flex>
);

export default PANVerification;
