import React, { useEffect, useState } from 'react';

import { Button, Form, Typography, Flex } from 'antd';
import { Formik } from 'formik';
import { IoCheckmark, IoClose } from 'react-icons/io5';

import PasswordInput from '@components/atomic/inputs/PasswordInput';

import { forgotPasswordStepfourSchema } from '../../schema';

const { Text } = Typography;
interface ResetPasswordFormProps {
    handleFormSubmit: (token: string) => void | Promise<any>;
    isLoading: boolean;
    validatePassword: (password: string) => string[];
}

const ResetPasswordForm = ({
    handleFormSubmit,
    isLoading,
    validatePassword,
}: ResetPasswordFormProps) => {
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        const validationErrors = validatePassword(password);
        setErrors(validationErrors);
    }, [password, validatePassword]);

    const handlePasswordChange = (e: any) => {
        setPassword(e.target.value);
    };

    return (
        <Formik
            initialValues={{
                password: '',
                confirmpassword: '',
            }}
            validationSchema={forgotPasswordStepfourSchema}
            onSubmit={(values, { setSubmitting }) => {
                handleFormSubmit(values.password);

                setSubmitting(false);
            }}
        >
            {({ handleSubmit, isSubmitting, values }) => {
            const showValid =
                errors.length === 0 &&
                (!values.confirmpassword || values.confirmpassword === values.password);
            return (
                <Form onFinish={handleSubmit} className="w-full px-10 md:px-0">
                    <PasswordInput
                        name="password"
                        label=""
                        placeholder="New Password"
                        type="password"
                        size="large"
                        onChange={handlePasswordChange}
                    />
                    <PasswordInput
                        name="confirmpassword"
                        label=""
                        placeholder=" Confirm Password"
                        type="password"
                        size="large"
                    />
                    <Flex vertical gap={8}>
                        {showValid ? (
                            <Flex align="center" gap={1}>
                                <IoCheckmark color="#05BE63" />
                                <Text style={{ color: '#05BE63' }}>Password is valid.</Text>
                            </Flex>
                        ) : (
                            errors.map((error, index = 1) => (
                                <Flex key={index} align="baseline" gap={1}>
                                    <Flex>
                                        <IoClose className="pt-1" size={15} color="#E01A1A" />
                                    </Flex>
                                    <Text style={{ color: '#E01A1A' }}>
                                        <>{error}</>
                                    </Text>
                                </Flex>
                            ))
                        )}
                    </Flex>

                    <Button
                        // disabled={errors.length > 0}
                        htmlType="submit"
                        type="primary"
                        danger
                        className="w-full mt-4 text-sm"
                        loading={isSubmitting || isLoading}
                    >
                        Submit
                    </Button>
                </Form>
            );
        }}
        </Formik>
    );
};

export default ResetPasswordForm;
