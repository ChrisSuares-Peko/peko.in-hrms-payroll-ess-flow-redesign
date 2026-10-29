import React from 'react';

import { Button, Flex, Form } from 'antd';
import { Formik } from 'formik';

import { eInvoiceSignInInitialValues } from '../../constants/eInvoicingSign';
import EInvoicingSignInForm from '../../forms/EInvoicingSignInForm';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { eInvoiceSignInSchema } from '../../schema/eInvoicingSchema';
import { EInvoiceSignInValues } from '../../types/eInvoicingSign';
import LeftHeader from '../shared/LeftHeader';

interface SignInCardProps {
    onSubmit?: (values: EInvoiceSignInValues) => void | Promise<void>;
    isLoading?: boolean;
}

const SignInCard: React.FC<SignInCardProps> = ({ onSubmit, isLoading }) => {
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({ schema: eInvoiceSignInSchema });

    return (
        <Flex
            vertical
            gap={20}
            className="w-full max-w-[520px] bg-white rounded-2xl p-5 md:p-7 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]"
        >
            <LeftHeader
                title="Sign in"
                description="Enter your GSP credentials to access the portal"
            />

            <Formik
                initialValues={eInvoiceSignInInitialValues}
                validationSchema={eInvoiceSignInSchema}
                onSubmit={async (values, helpers) => {
                    await onSubmit?.(values);
                    helpers.setSubmitting(false);
                }}
            >
                {({ handleSubmit, setFieldTouched, values }) => (
                    <Form
                        layout="vertical"
                        onFinish={() =>
                            handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values)
                        }
                        className="w-full"
                    >
                        <EInvoicingSignInForm />
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            danger
                            loading={isLoading}
                            className="h-11 mt-1 text-base"
                        >
                            Sign In to E-Invoice Portal
                        </Button>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default SignInCard;
