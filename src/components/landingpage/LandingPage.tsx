import { useState } from 'react';

import { forgotPassword } from '@domains/auth/api/index';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { LANDING_PAGE_CONTENT } from '@utils/landingPageData';

import LandingContent from './LandingContent';
import LandingHeader from './LandingHeader';

const LandingPage = () => {
    const dispatch = useAppDispatch();
    const { email } = useAppSelector(state => state.reducer.forgotpassword);
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email || isResending) return;
        setIsResending(true);
        const result = await forgotPassword({ username: email });
        if (result) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: LANDING_PAGE_CONTENT.resendSuccessMessage,
                }),
            );
        }
        setIsResending(false);
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-white">
            <LandingHeader />
            <main className="flex flex-1 items-center justify-center px-4 py-20">
                <LandingContent isLoading={isResending} onResend={handleResend} />
            </main>
        </div>
    );
};

export default LandingPage;
