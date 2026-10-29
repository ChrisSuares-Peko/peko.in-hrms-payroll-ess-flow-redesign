import Lottie from 'react-lottie';

import paymentLoadingAnimation from '@assets/animation/payment-loading-animation.json';

const lottieOptions = {
    loop: true,
    autoplay: true,
    animationData: paymentLoadingAnimation,
};

interface PaymentRedirectLoaderProps {
    message?: string;
}

const PaymentRedirectLoader = ({
    message = 'Please wait, we are redirecting you to a secure payment gateway page',
}: PaymentRedirectLoaderProps) => (
    <div className="flex min-h-[60vh] w-full animate-fade-in flex-col items-center justify-center gap-6 motion-reduce:animate-none">
        <div className="relative flex h-44 w-44 items-center justify-center">
            <Lottie options={lottieOptions} height={160} width={160} isClickToPauseDisabled />
        </div>

        <div className="h-1.5 w-64 max-w-[80vw] overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/3 animate-progress-indeterminate rounded-full bg-lightRed motion-reduce:w-full motion-reduce:animate-none" />
        </div>

        <p className="max-w-xs text-center text-sm text-slate-500">{message}</p>
    </div>
);

export default PaymentRedirectLoader;
