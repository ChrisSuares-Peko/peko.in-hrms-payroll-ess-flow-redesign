import React from 'react';

import { Button, Flex, Grid } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/animation/404.json';

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

const PageNotFound = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const height = screens.md ? '50%' : 350;
    const width = screens.md ? '50%' : '100%';
    return (
        <Flex vertical align="center" justify="center" gap={15} className=" h-screen ">
            <Lottie options={defaultOptions} height={height} width={width} />
            <Button type="default" danger onClick={() => navigate(`/`)}>
                Go to Dashboard
            </Button>
        </Flex>
    );
};

export default PageNotFound;
