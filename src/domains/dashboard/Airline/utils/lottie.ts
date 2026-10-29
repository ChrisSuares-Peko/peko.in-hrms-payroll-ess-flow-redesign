import HorizontalFlyingAnimation from '@assets/animation/Flight-Loader.json';
import animation from '@assets/animation/Flight-Ticket-No-Result.json';
import AirlineSearchMobile from '@domains/dashboard/Airline/assets/animations/AirlineSearchMobile.json';

import AirlineSearch from '../assets/animations/AirlineSearch.json';

export const noFlightResults = {
    loop: true,
    autoplay: true,
    animationData: animation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

export const AirlineSearchAnimation = {
    loop: true,
    autoplay: true,
    animationData: AirlineSearch,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

export const AirlineSearchAnimationmobile = {
    loop: true,
    autoplay: true,
    animationData: AirlineSearchMobile,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

export const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: HorizontalFlyingAnimation,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};
