import React, { useEffect } from 'react';

import { Button, Flex, Grid } from 'antd';
import { useErrorBoundary } from 'react-error-boundary';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/animation/503.json';

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

const ServiceNotFound = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const height = screens.md ? 400 : 350;
    const width = screens.md ? 400 : '100%';
    const { resetBoundary } = useErrorBoundary();

    useEffect(() => {
        resetBoundary();
        navigate('/503');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={15}
            className="text-center h-fit mt-20 "
        >
            <Lottie options={defaultOptions} height={height} width={width} />
            <Button type="default" danger onClick={() => navigate(`/`)}>
                Go to Dashboard
            </Button>
        </Flex>
    );
};

export default ServiceNotFound;
