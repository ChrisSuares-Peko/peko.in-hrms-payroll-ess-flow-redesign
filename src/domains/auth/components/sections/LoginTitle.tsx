import React from 'react';

import { Flex, Typography, Image } from 'antd';

import logo from '@assets/mainLogo/Logo.png';

const { Text } = Typography;

const LoginTitle = () => (
    <>
        <Text className="hidden md:text-lg md:inline-block">Sign in to your Peko account</Text>
        <Flex vertical className="flex md:hidden" gap={24}>
            <Image src={logo} alt="logo" preview={false} width={190} className="-mb-8 ml-6" />
            <Text className="text-lg font-medium text-center">Sign in to your Peko account</Text>
        </Flex>
    </>
);

export default LoginTitle;
