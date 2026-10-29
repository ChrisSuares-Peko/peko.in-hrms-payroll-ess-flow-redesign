import { Flex, Typography, Image } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import logo from '@assets/mainLogo/Logo.png';
import notes from '@assets/svg/notes.svg';

const { Title, Text } = Typography;

const EmailIdVerficationFailed = () => {
    const navigate = useNavigate();

    return (
        <>
            <Flex vertical className="w-2/5 px-4 pt-2 md:px-0 md:pt-10 md:pl-10">
                <Image src={logo} alt="logo" preview={false} className="" width={130} />
            </Flex>
            <Flex vertical align="center" justify="center" gap={18} className="text-center h-svh">
                <ReactSVG src={notes} className="mt-1 " />
                <Title level={3}>Email Verification Failed</Title>
                <Text className="px-5 sm:px-0 w-80">
                    We apologize for the inconvenience. Please try verifying your email address
                    again.
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

export default EmailIdVerficationFailed;
