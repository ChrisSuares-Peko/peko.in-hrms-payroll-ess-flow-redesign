import React from 'react';

import { Flex, Image, Button, Result, Row } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import logo from '@assets/mainLogo/Logo.png';

interface props {
    isForgot: string | null;
}
const TokenValidityExpiredView = ({ isForgot }: props) => {
    const forget = isForgot === 'true';
    const navigate = useNavigate();
    return (
        <Flex className="w-full" align="start" justify="start">
            <Flex vertical className="w-full pb-4 pl-6 ">
                <Image
                    src={logo}
                    alt="logo"
                    onClick={() => {
                        navigate('/');
                    }}
                    className="bg-transparent cursor-pointer"
                    preview={false}
                    width={120}
                />
                <Row justify="center" align="middle" className="self-center h-screen md:w-3/6 ">
                    <Result
                        className="p-0 "
                        status="error"
                        title={`The ${forget ? 'reset ' : 'set '} password link is expired or invalid`}
                        extra={
                            <Flex className="-mt-5" gap={15} justify="center">
                                <Link to="/">
                                    <Button type="default" danger className="px-6">
                                        Go To Login
                                    </Button>
                                </Link>
                            </Flex>
                        }
                    />
                </Row>
            </Flex>
        </Flex>
    );
};

export default TokenValidityExpiredView;
