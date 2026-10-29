import React from 'react';

import { Button, Flex, Grid } from 'antd';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/animation/404.json';
import { useAppSelector } from '@src/hooks/store';
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

const PageNotFound = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const height = screens.md ? '50%' : 350;
    const width = screens.md ? '50%' : '100%';

    const { roleName } = useAppSelector(state => state.reducer.auth);
    let buttonText = 'Go to Dashboard';
    if (roleName && roleName === 'corporate sub user') {
        buttonText = `Go back`;
    }
    return (
        <Flex vertical align="center" justify="center" gap={15} className=" h-screen ">
            <Lottie options={defaultOptions} height={height} width={width} />
            <Button type="default" danger onClick={() => navigate(paths.dashboard.home)}>
                {buttonText}
            </Button>
        </Flex>
    );
};

export default PageNotFound;
