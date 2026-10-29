import { Flex, Typography, Image } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/standard';
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

const EmailIdAlreadyVerified = () => {
    const navigate = useNavigate();
    const handleLogin = () => {
        navigate('/auth/login');
    };

    return (
        <>
            <Flex vertical className="w-2/5 px-4 pt-2 md:px-0 md:pt-10 md:pl-10">
                <Image src={logo} alt="logo" preview={false} className="" width={130} />
            </Flex>
            <Flex vertical align="center" gap={18} className="pt-56 text-center h-svh">
                <Lottie
                    options={defaultOptions}
                    height={100}
                    width={100}
                    style={{ cursor: 'default' }}
                />
                <Title level={3}>Email Already Verified </Title>
                <Text className="px-5 sm:px-0 w-80">
                    Your email address has already been verified. Thank you for ensuring the
                    accuracy of your information.
                </Text>
                <Flex>
                    <Text
                        onClick={() => handleLogin()}
                        className="flex items-center justify-center text-sm font-semibold text-center text-red-500 underline cursor-pointer ms-1"
                    >
                        Sign in <GoArrowUpRight />
                    </Text>
                </Flex>
            </Flex>
        </>
    );
};

export default EmailIdAlreadyVerified;
