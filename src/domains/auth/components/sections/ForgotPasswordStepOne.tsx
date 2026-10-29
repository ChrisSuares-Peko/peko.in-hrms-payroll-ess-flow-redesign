/* eslint-disable react/no-unescaped-entities */
import React from 'react';

import { Button, Flex, Typography, Form, Grid, Image } from 'antd';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/standard';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import useForgotPasswordApi from '../../hooks/useForgotPasswordApi';
import { forgotPasswordStepOneSchema } from '../../schema';
import { forgotpasswordReset } from '../../slices/forgotpasswordSlice';

type ForgotPasswordStepOneProps = {};
const { Text } = Typography;

const ForgotPasswordStepOne: React.FC<ForgotPasswordStepOneProps> = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { useBreakpoint } = Grid;
    const screens = useBreakpoint();
    const { handleForgotPassword } = useForgotPasswordApi();
    const { email } = useAppSelector(state => state.reducer.forgotpassword);
    const handleBackToLogin = () => {
        dispatch(forgotpasswordReset());
        navigate('/auth/login');
    };
    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={10}
            className=" w-full sm:w-[25rem] px-2 mx-3 sm:px-0"
        >
            <Flex className="justify-center md:justify-start w-full">
                <Image src={logo} alt="logo" preview={false} width={190} className="-ms-2" />
            </Flex>
            <Text className="text-2xl font-medium md:me-auto">Forgot Password</Text>

            <Text className="text-center sm:text-start">
                Enter the email ID associated with your account, and we'll send you a link to reset
                your password.
            </Text>

            <Formik
                initialValues={{ username: email || '' }}
                onSubmit={handleForgotPassword}
                validationSchema={forgotPasswordStepOneSchema}
            >
                {({ handleSubmit, isSubmitting }) => (
                    <Form onFinish={handleSubmit} className="flex flex-col w-full">
                        <TextInput
                            name="username"
                            label=""
                            placeholder="Enter your email ID "
                            type="email"
                            size={screens.xxl ? 'large' : 'middle'}
                            maxLength={55}
                        />
                        <Button htmlType="submit" type="primary" danger loading={isSubmitting}>
                            Send Reset Link
                        </Button>
                    </Form>
                )}
            </Formik>
            <Flex
                onClick={() => handleBackToLogin()}
                align="center"
                justify="center"
                gap={3}
                className="pt-2 text-red-500 underline cursor-pointer"
            >
                Go Back to Login
            </Flex>
        </Flex>
    );
};

export default ForgotPasswordStepOne;
