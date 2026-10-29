import React from 'react';

import { Button, Form, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { voucherCodeSchema } from '../../../schema';

export interface SubscriptionCodeProps {
    isValidVoucher: boolean;
    setIsValidVoucher: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading: boolean;
    checkVoucherIsValid: (activationCode: string) => Promise<void>;
}

const SubscriptionVoucherCode = ({
    checkVoucherIsValid,
    isValidVoucher,
    setIsValidVoucher,
    isLoading,
}: SubscriptionCodeProps) => (
    <div className="w-full">
        <Formik
            initialValues={{ activationCode: '' }}
            onSubmit={values => checkVoucherIsValid(values.activationCode)}
            validationSchema={voucherCodeSchema}
            onReset={(values, { setErrors }) => {
                setIsValidVoucher(false);
                setTimeout(() => setErrors({}), 100);
            }}
        >
            {({ handleSubmit, resetForm }) => (
                <Form onFinish={handleSubmit} className="flex w-full gap-4 ">
                    <div className="w-2/3">
                        <TextInput
                            name="activationCode"
                            placeholder="Enter voucher code"
                            type="text"
                            size="large"
                            formItemClass="mb-2"
                            isDisabled={isValidVoucher}
                            maxLength={16}
                        />
                    </div>

                    {isValidVoucher ? (
                        <Button
                            htmlType="reset"
                            type="primary"
                            className="w-1/3 h-10"
                            danger
                            onClick={() => resetForm()}
                        >
                            Remove
                        </Button>
                    ) : (
                        <Button
                            htmlType="submit"
                            type="primary"
                            className="w-1/3 h-10"
                            danger
                            loading={isLoading}
                        >
                            Apply
                        </Button>
                    )}
                </Form>
            )}
        </Formik>
        {isValidVoucher && (
            <Typography.Text className="text-sm font-normal  text-green-500 ">
                Voucher code applied successfully!
            </Typography.Text>
        )}
    </div>
);

export default SubscriptionVoucherCode;
