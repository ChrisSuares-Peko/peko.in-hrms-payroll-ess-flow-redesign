import React from 'react';

import { Flex, Image, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/standard';
import animation from '@assets/success-animation.json';
import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { TAB_ID } from '@src/utils/tabId';

import { loginSuccess } from '../../slices/loginSlice';
import { resetRegisterState } from '../../slices/registerSlice';

const { Title, Text } = Typography;
const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

const RegisterStepSeven = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { md } = useScreenSize();
    const { loginData, signupType } = useAppSelector(state => state.reducer.registration);
    const authChannel = new BroadcastChannel('authChannel');
    const isNewCompany = signupType === 'NEW_COMPANY';

    const handleLogin = () => {
        dispatch(loginSuccess({ ...loginData, isAuthenticated: true }));
        authChannel.postMessage({ type: 'login', tabId: TAB_ID });
        dispatch(resetRegisterState());
        if (isNewCompany) {
            navigate(paths.businessRegistration.index);
        }
    };

    return (
        <Flex className="absolute w-full h-screen">
            {md && (
                <Image
                    src={logo}
                    alt="Logo"
                    preview={false}
                    className="relative hidden md:block md:left-10 md:top-6"
                    width={120}
                />
            )}
            <Flex vertical align="center" justify="center" gap={4} className="w-full ">
                <Lottie options={defaultOptions} height={100} width={100} />
                <Title level={3}>Thanks for the registration</Title>
                <Text className="px-5 text-center w-96 sm:px-0">
                    Your Peko business account has been successfully created. It&apos;s time to
                    initiate the revolution in your business.
                </Text>
                <Text
                    onClick={() => handleLogin()}
                    style={{ borderRadius: '3px' }}
                    className="px-5 py-2 mt-2 text-lg border border-red-500 cursor-pointer text-iconRed"
                >
                    {isNewCompany ? 'Go to Business Registration' : 'Go to Dashboard'}
                </Text>
            </Flex>
        </Flex>
    );
};

export default RegisterStepSeven;
