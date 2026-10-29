import React from 'react';

import { Flex, Grid, Typography } from 'antd';
import Lottie from 'react-lottie';

import animation from '@assets/animation/serviceNotAvailable.json';

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

const ServiceUnavailable = () => {
    const screens = useBreakpoint();
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
            <Typography.Text className="text-4xl -mt-3"> No services found</Typography.Text>
            <Typography.Text className="text-sm ">
                For access, kindly contact the administrator for assistance.
            </Typography.Text>
        </Flex>
    );
};

export default ServiceUnavailable;
