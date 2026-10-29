import React from 'react';

import { Button, Flex, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const LoginCustomError = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const message =
        new URLSearchParams(location.search).get('message') ||
        'Unable to complete sign in. Please try again or contact support.';

    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={15}
            className="text-center px-5 md:px-0 min-h-svh"
        >
            <Typography.Text className="text-4xl">Sign in failed</Typography.Text>
            <Typography.Text className="text-sm max-w-xl">{message}</Typography.Text>
            <Button
                type="default"
                className="mt-2"
                danger
                onClick={() => navigate(paths.auth.jwt.login, { replace: true })}
            >
                Back to Login
            </Button>
        </Flex>
    );
};

export default LoginCustomError;
