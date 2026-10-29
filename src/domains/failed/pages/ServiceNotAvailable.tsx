/* eslint-disable react/no-unescaped-entities */
import { useEffect } from 'react';

import { Button, Flex, Grid, Typography } from 'antd';
import { useErrorBoundary } from 'react-error-boundary';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import animation from '@assets/animation/503.json';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

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

const ServiceNotAvailable = () => {
    const screens = useBreakpoint();
    const navigate = useNavigate();
    const height = screens.md ? 220 : 155;
    const width = screens.md ? 220 : '50%';
    const { resetBoundary } = useErrorBoundary();

    useEffect(() => {
        resetBoundary();
        navigate('/service-not-available');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { roleName } = useAppSelector(state => state.reducer.auth);
    const { services } = useAppSelector(state => state.reducer.services);
    let buttonText = 'Go to Dashboard';
    if (roleName && roleName === 'corporate sub user') {
        const firstRoute = services?.data?.find(obj => obj.hasAccess === true);
        buttonText = `Go to ${firstRoute!.label.toLowerCase()}`;
    }
    return (
        <Flex
            vertical
            align="center"
            justify="center"
            gap={15}
            className="text-center   px-5 md:px-0 font-roboto"
        >
            <Lottie options={defaultOptions} height={height} width={width} />
            <Text className="text-sm md:text-2xl text-textLightRed">
                <strong>Oops!! Something Went Wrong</strong>
            </Text>
            <Text className="text-sm text-textGreyLight">
                It looks like our server is having some trouble right now. Don't worry, it's not
                your fault. Here are a few things you can try:
            </Text>
            <Flex
                align="flex-start"
                vertical
                justify="left"
                gap={5}
                className="text-center   px-5 md:px-0"
            >
                <Text className="text-sm text-textGreyLight">
                    <strong>1. Refresh the Page: </strong>Sometimes a simple refresh can fix the
                    issue.
                </Text>
                <Text className="text-sm text-textGreyLight">
                    <strong>2. Check Back Later: </strong>Our team is already working on it, so
                    please check back in a few minutes.
                </Text>
                <Text className="text-sm text-textGreyLight">
                    <strong>3. Contact Support: </strong>If the problem persists, feel free to reach
                    out to our support team at reach@peko.one.
                </Text>
            </Flex>

            <Text className="text-sm text-gray-500">
                We apologize for any inconvenience and appreciate your patience. Thank you.
            </Text>
            <Button
                type="default"
                className="mt-2"
                danger
                onClick={() => navigate(paths.dashboard.home)}
            >
                {buttonText}
            </Button>
        </Flex>
    );
};

export default ServiceNotAvailable;
