import { Button, Col, Divider, Flex, Row, Typography } from 'antd';
import { GoArrowUpRight } from 'react-icons/go';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

// import googleIcon from '@assets/svg/google-icon.png';
// import microsoftIcon from '@assets/svg/microsoft-icon.png';
import logo from '@assets/mainLogo/standard';
import { SSO_LOGIN_ENABLED } from '@src/config-global';

import useSocialLogin from '../../hooks/useSocialLogin';
import { resetRegisterState } from '../../slices/registerSlice';

const { Text } = Typography;

const SocialButtons = () => {
    const dispatch = useDispatch(); // Move dispatch inside the component
    const navigate = useNavigate();
    const { handleOidcLogin } = useSocialLogin();
    const handleSignup = () => {
        dispatch(resetRegisterState());
        navigate('/auth/register');
    };

    return (
        <Flex vertical gap={40} className="w-full">
            {SSO_LOGIN_ENABLED && (
                <Flex vertical gap={18}>
                    <Flex className="my-4" justify="center">
                        <Text>OR</Text>
                    </Flex>
                    <Button
                        danger
                        type="default"
                        className="w-full text-start flex items-center justify-center gap-1 xxl:h-[3rem] shadow-none"
                        onClick={() => handleOidcLogin()}
                    >
                        <img src={logo} alt="" className="h-8 w-auto shrink-0" />
                        <Text>Sign in with SSO</Text>
                    </Button>
                </Flex>
            )}
            {/* <Flex vertical gap={18}>
            <Button className="w-full xxl:h-[3rem] shadow-none">
                <Row align="middle" className="gap-2">
                    <img src={googleIcon} alt="google-icon" />
                    <Text className="font-semibold">Sign in with Google</Text>
                </Row>
            </Button>
            <Button className="w-full xxl:h-[3rem] shadow-none">
                <Row align="middle" className="gap-2">
                    <img src={microsoftIcon} alt="google-icon" />
                    <Text className="font-semibold">
                        Sign in with Microsoft
                    </Text>
                </Row>
            </Button>
        </Flex> */}

            <Col span={24} className="w-full text-[#BBBBBB]  ">
                <Divider className="hidden sm:block" />
            </Col>
            <Col
                span={24}
                className="flex flex-col md:flex-row items-center -mt-8 gap-1 w-full justify-center"
            >
                <Text className="text-nowrap">Ready to begin using Peko for your business?</Text>
                <Row align="middle" className="underline font-bold text-red-500">
                    <Link to="/auth/register" className="p-0" type="link">
                        <Text
                            className="text-red-500 flex justify-center items-center"
                            onClick={handleSignup}
                        >
                            Sign up <GoArrowUpRight />
                        </Text>
                    </Link>
                </Row>
            </Col>
        </Flex>
    );
};

export default SocialButtons;
