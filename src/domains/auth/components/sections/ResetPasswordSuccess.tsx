import React from 'react';

import { Typography, Flex, Image, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';

import logo from '@assets/Logo.png';
import updated from '@assets/svg/updated.svg';

const { Title, Text } = Typography;
const ResetPasswordSuccess = () => {
    const { state } = useLocation();
    const isForgot = state?.isForgot === 'true';

    return (
        <Flex className="w-full relative h-screen" align="center" justify="center">
            <Image
                src={logo}
                alt="icon"
                className="hidden sm:inline-block sm:absolute sm:left-14 sm:-top-14 "
            />
            <Flex className="items-center justify-center w-full flex-col gap-3">
                <Flex className="w-full" vertical justify="center" align="center" gap={8}>
                    <Image src={updated} preview={false} alt="" />
                    <Title level={3}>Password {isForgot ? 'reset successful' : 'created'}</Title>
                    <Text className="px-5 sm:w-2/3 md:w-1/2 sm:px-0 text-center">
                        {isForgot
                            ? 'You can now log in with your new password'
                            : 'You have successfully created a password'}
                    </Text>
                    <Link to="/auth/login">
                        <Button
                            htmlType="submit"
                            type="primary"
                            danger
                            className="mt-5 font-semibold w-full xxl:h-[3rem] xxl:text-lg px-24"
                        >
                            Log in
                        </Button>
                    </Link>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default ResetPasswordSuccess;
