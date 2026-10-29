import { Flex, Typography, Image } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/Logo.png';
import animation from '@assets/success-animation.json';

const { Title, Text } = Typography;
const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

const EmailIdVerified = () => {
    const navigate = useNavigate();

    return (
        <>
            <Flex vertical className="w-2/5 px-4 pt-2 md:px-0 md:pt-10 md:pl-10">
                <Image src={logo} alt="logo" preview={false} className="" width={130} />
            </Flex>
            <Flex vertical align="center" justify="center" gap={18} className="text-center h-svh">
                <Lottie
                    options={defaultOptions}
                    height={100}
                    width={100}
                    style={{ cursor: 'default' }}
                />
                <Title level={3}>Email Verification Successful</Title>
                <Text className="px-5 sm:px-0 w-80">
                    Your email address has been successfully verified. Thank you for completing this
                    step.
                </Text>
                <Text
                    className="flex items-center justify-center text-sm font-semibold text-center text-red-500 underline cursor-pointer ms-1"
                    onClick={() => navigate('/auth/login')}
                >
                    Sign in <GoArrowUpRight />
                </Text>
            </Flex>
        </>
    );
};

export default EmailIdVerified;
