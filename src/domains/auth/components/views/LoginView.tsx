import React from 'react';

import { Row, Flex, Image } from 'antd';

import logo from '@assets/mainLogo/Logo.png';

import LoginForm from '../forms/LoginForm';
import LoginFooter from '../sections/LoginFooter';
import LoginTitle from '../sections/LoginTitle';
import SocialButtons from '../sections/SocialButtons';

const LoginView = () => (
    <Row className="items-center w-full min-h-svh px-5">
        <Row justify="center" align="middle" className="w-full pb-0 xl:self-end ">
            <Flex justify="center" align="center" vertical gap={20}>
                <Image
                    src={logo}
                    alt="logo"
                    preview={false}
                    className="hidden md:flex -mb-7"
                    width={190}
                />
                <LoginTitle />
                <Flex justify="center" align="center" vertical gap={20}>
                    <LoginForm />
                    {/* <Text style={{ color: 'GrayText' }}>OR</Text> */}
                    <SocialButtons />
                </Flex>
            </Flex>
        </Row>
        <LoginFooter />
    </Row>
);

export default LoginView;
