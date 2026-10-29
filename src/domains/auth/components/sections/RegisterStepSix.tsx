/* eslint-disable react/no-unescaped-entities */

import { Flex, Typography } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/success-animation.json';
import { useAppDispatch } from '@src/hooks/store';

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

const RegisterStepSix = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const authChannel = new BroadcastChannel('authChannel');

    const HandleSubmit = () => {
        navigate('/auth/login');
        authChannel.postMessage('login');
        dispatch(resetRegisterState());
    };

    return (
        <Flex vertical align="center" justify="center" gap={18} className="text-center h-svh">
            <Lottie
                options={defaultOptions}
                height={100}
                width={100}
                style={{ cursor: 'default' }}
            />
            <Title level={3}>Your PAN & GSTIN Number is Verified</Title>
            <Text className="w-96 px-5 sm:px-0">
                Your Peko business account has been successfully set up. It's time to initiate the
                revolution in your business.
            </Text>
            <Text
                className="text-sm font-semibold text-center underline cursor-pointer text-red-500 ms-1 flex justify-center items-center"
                onClick={() => HandleSubmit}
            >
                Sign in <GoArrowUpRight />
            </Text>
        </Flex>
    );
};

export default RegisterStepSix;
