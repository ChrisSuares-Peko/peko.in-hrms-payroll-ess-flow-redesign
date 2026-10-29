import { Flex, Typography, Image } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import logo from '@assets/mainLogo/Logo.png';
import notes from '@assets/svg/notes.svg';

const { Title, Text } = Typography;

const EmailIdLinkExpired = () => {
    const navigate = useNavigate();

    return (
        <>
            <Flex vertical className="w-2/5 px-4 pt-2 md:px-0 md:pt-10 md:pl-10">
                <Image src={logo} alt="logo" preview={false} className="" width={130} />
            </Flex>
            <Flex vertical align="center" justify="center" gap={18} className="text-center h-svh">
                <ReactSVG src={notes} className="mt-1 " />
                <Title level={3}>Email Verification Link Expired</Title>
                <Text className="px-5 sm:px-0 w-80">
                    The email verification link has expired. Please request a new verification link
                    to complete the process.
                </Text>
                <Text
                    className="flex items-center justify-center px-5 py-2 text-lg font-semibold text-center underline cursor-pointer text-iconRed"
                    onClick={() => navigate('/auth/login')}
                >
                    Sign in <GoArrowUpRight />
                </Text>
            </Flex>
        </>
    );
};

export default EmailIdLinkExpired;
