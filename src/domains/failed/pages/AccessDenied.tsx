import React from 'react';

import { Button, Flex, Grid, Typography } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/animation/serviceNotAvailable.json';
import { paths } from '@src/routes/paths';

const { useBreakpoint } = Grid;
const defaultOptions = {
    loop: true,
    autoplay: true,
    hover: false,
    controls: false,
    animationData: animation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
    isClickToPauseDisabled: true,
};

const AccessDenied = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const height = screens.md ? 300 : 350;
    const width = screens.md ? 300 : '100%';
    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={15}
            className="text-center   px-5 md:px-0"
        >
            <Lottie options={defaultOptions} height={height} width={width} />
            <Typography.Text className="text-4xl -mt-3">Access Denied</Typography.Text>
            <Typography.Text className="text-sm ">
                Sorry, you do not have permission to access this page. For assistance, kindly reach
                out to our support team.
            </Typography.Text>
            <Button
                type="default"
                className="mt-2"
                danger
                onClick={() => navigate(paths.dashboard.home)}
            >
                Go to Dashboard
            </Button>
        </Flex>
    );
};

export default AccessDenied;
