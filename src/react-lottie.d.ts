declare module 'react-lottie' {
    import { ComponentType } from 'react';

    interface LottieProps {
        options: {
            loop?: boolean;
            autoplay?: boolean;
            animationData: object;
            rendererSettings?: object;
        };
        height?: number | string;
        width?: number | string;
        isStopped?: boolean;
        isPaused?: boolean;
        eventListeners?: Array<{
            eventName: string;
            callback: () => void;
        }>;
        speed?: number;
        direction?: number;
        segments?: [number, number];
        onComplete?: () => void;
        onLoopComplete?: () => void;
        onEnterFrame?: () => void;
        onSegmentStart?: () => void;
        isClickToPauseDisabled?: boolean;
        style?: object;
    }

    const Lottie: ComponentType<LottieProps>;
    export default Lottie;
}
