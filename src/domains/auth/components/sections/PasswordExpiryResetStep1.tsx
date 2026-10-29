import React from 'react';

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Row, Flex, Image, Button, Typography } from 'antd';

import logo from '@assets/mainLogo/standard';

import LoginFooter from './LoginFooter';

interface PasswordExpiryResetStep1Props {
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
}
const PasswordExpiryResetStep1 = ({ setCurrentStep }: PasswordExpiryResetStep1Props) => (
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

                <Flex
                    justify="center"
                    className="p-3 rounded-sm border border-solid border-yellow-200 mt-3  bg-yellow-50 w-full md:w-3/6"
                >
                    <Typography.Text className="text-[.8rem]  font-normal">
                        <ExclamationCircleFilled className="text-yellow-500 " /> Your password has
                        expired. For security reasons, you need to reset your password to continue
                        accessing your account.
                    </Typography.Text>
                </Flex>
                <Button
                    type="primary"
                    danger
                    className="mt-3 font-semibold "
                    onClick={() => setCurrentStep(2)}
                >
                    Reset Password
                </Button>
            </Flex>
        </Row>
        <LoginFooter />
    </Row>
);

export default PasswordExpiryResetStep1;
