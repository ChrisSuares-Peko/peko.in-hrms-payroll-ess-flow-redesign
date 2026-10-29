import React from 'react';

import { Typography, Flex, Image, Col, Row } from 'antd';
import { Link } from 'react-router-dom';

import Logo from '@assets/mainLogo/standard';
import registerSteps from '@assets/svg/registerSteps.png';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import ResetPasswordForm from '../forms/ResetPasswordForm';

const { Text } = Typography;

interface ResetPasswordProps {
    handleSubmit: (token: string) => void | Promise<any>;
    isLoading: boolean;
    validatePassword: (password: string) => string[];
    isForgot: boolean;
}

const ResetPassword = ({
    handleSubmit,
    isLoading,
    validatePassword,
    isForgot,
}: ResetPasswordProps) => {
    const { md } = useScreenSize();

    return (
        <Row className="relative">
            <Col
                xs={{ span: 24, order: 2 }}
                sm={{ span: 24, order: 2 }}
                md={{ span: 24, order: 2 }}
                lg={{ span: 12, order: 1 }}
                xl={{ span: 12, order: 1 }}
                className="flex items-center justify-center"
            >
                {' '}
                <Flex justify="center" align="center" vertical gap={4} className="w-full xl:w-1/2">
                    <Flex vertical gap={15} justify="center" className="w-[25rem]">
                        {md ? (
                            <Flex vertical justify="start" align="start" gap={5}>
                                <Image
                                    src={Logo}
                                    alt="logo"
                                    preview={false}
                                    width={180}
                                    className="-ms-2"
                                />
                                <Text className="text-xl font-medium">
                                    {isForgot ? 'Reset ' : 'Set '}Password
                                </Text>
                            </Flex>
                        ) : (
                            <Flex vertical justify="center" align="center" gap={5}>
                                <Image src={Logo} alt="logo" preview={false} width={180} />
                                <Text className="text-xl font-medium">
                                    {isForgot ? 'Reset ' : 'Set '}Password
                                </Text>
                            </Flex>
                        )}

                        <ResetPasswordForm
                            handleFormSubmit={handleSubmit}
                            isLoading={isLoading}
                            validatePassword={validatePassword}
                        />

                        <Flex justify="center" className="pt-3">
                            <Link to={paths.auth.jwt.login}>
                                <Text className="text-center text-red-500 underline">
                                    Go Back to Login
                                </Text>
                            </Link>
                        </Flex>
                    </Flex>
                </Flex>
            </Col>

            <Col
                xs={{ span: 24, order: 1 }}
                sm={{ span: 24, order: 1 }}
                md={{ span: 24, order: 1 }}
                lg={{ span: 12, order: 2 }}
                xl={{ span: 12, order: 2 }}
            >
                <Flex
                    className="h-[50vh] md:h-svh flex"
                    style={{
                        backgroundImage: `url(${registerSteps})`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <Text className="z-10 self-end p-4 pb-8 text-3xl font-thin text-white">
                        All-in-one platform for SMBs to manage all their payments, expenses, travel,
                        insurance, and automate operations
                    </Text>
                </Flex>
            </Col>
        </Row>
    );
};

export default ResetPassword;
