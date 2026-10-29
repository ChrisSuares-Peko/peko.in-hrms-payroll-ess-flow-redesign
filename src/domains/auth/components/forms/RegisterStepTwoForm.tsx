import React from 'react';

import { Button, Form, Typography, Flex } from 'antd';
import { Formik } from 'formik';
import { IoCheckmark, IoClose } from 'react-icons/io5';
import { useDispatch } from 'react-redux';

import PasswordInput from '@components/atomic/inputs/PasswordInput';

import useOtpApi from '../../hooks/useOtpApi';
import usePasswordValidation from '../../hooks/usePasswordValidation';
import { registerStepTwoSchema } from '../../schema';
import { setFormData } from '../../slices/registerSlice';

const { Text } = Typography;

const RegisterStepTwoForm = () => {
    const dispatch = useDispatch();
    const { handleOtp, isLoading } = useOtpApi();
    const { validatePassword } = usePasswordValidation();

    return (
        <Formik
            initialValues={{
                password: '',
                confirmpassword: '',
            }}
            validationSchema={registerStepTwoSchema}
            onSubmit={values => {
                dispatch(setFormData(values));
                handleOtp(false);
            }}
        >
            {({ handleSubmit, isSubmitting, values }) => {
                const errors = validatePassword(values.password);
                const showValid =
                    errors.length === 0 &&
                    (!values.confirmpassword || values.confirmpassword === values.password);

                return (
                    <Form onFinish={handleSubmit} className="w-full">
                        <PasswordInput
                            name="password"
                            label=""
                            placeholder="Enter Password"
                            type="password"
                            size="large"
                        />
                        <PasswordInput
                            name="confirmpassword"
                            label=""
                            placeholder=" Confirm Password"
                            type="password"
                            size="large"
                            disablePaste
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
                                        <Flex className="ml-[-5px]">
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
                            disabled={errors.length > 0}
                            htmlType="submit"
                            type="primary"
                            danger
                            loading={isSubmitting || isLoading}
                            className="w-full font-semibold mt-7"
                        >
                            Next
                        </Button>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default RegisterStepTwoForm;
