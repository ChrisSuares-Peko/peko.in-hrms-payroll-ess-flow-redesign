import React from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Row, Flex, Image, Typography } from 'antd';

import logo from '@assets/mainLogo/standard';

import LoginFooter from './LoginFooter';
import ResetPasswordForm from '../forms/ResetPasswordForm';

const { Title } = Typography;
interface PasswordExpiryResetStep2Props {
    handleSubmit: (token: string) => void | Promise<any>;
    isLoading: boolean;
    validatePassword: (password: string) => string[];
}
const PasswordExpiryResetStep2 = ({
    handleSubmit,
    isLoading,
    validatePassword,
}: PasswordExpiryResetStep2Props) => (
    <Row className="min-h-svh w-full items-center  ">
        <Row justify="center" align="middle" className="w-full pb-0 xl:self-end ">
            <Flex justify="center" align="center" vertical gap={20}>
                <Image
                    src={logo}
                    alt="logo"
                    preview={false}
                    className=" hidden md:flex -mb-7"
                    width={190}
                />
                <Flex justify="center" align="center" vertical gap={20}>
                    <Flex
                        justify="center"
                        className="p-3 rounded-sm border border-solid border-yellow-200 mt-3  bg-yellow-50  w-[25rem]"
                    >
                        <Typography.Text className="text-[.8rem]  font-normal">
                            <ExclamationCircleFilled className="text-yellow-500 " /> Your password
                            has expired. For security reasons, you need to reset your password to
                            continue accessing your account.
                        </Typography.Text>
                    </Flex>
                    <Title level={4}>Reset Password</Title>
                    <ResetPasswordForm
                        handleFormSubmit={handleSubmit}
                        isLoading={isLoading}
                        validatePassword={validatePassword}
                    />
                </Flex>
            </Flex>
        </Row>
        <LoginFooter />
    </Row>
);

export default PasswordExpiryResetStep2;
