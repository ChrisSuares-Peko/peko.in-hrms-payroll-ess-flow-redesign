import { Link } from 'react-router-dom';

import illustration from '@assets/svg/forgotpassword-illustration.png';
import { forgotpasswordReset } from '@domains/auth/slices/forgotpasswordSlice';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { LANDING_PAGE_CONTENT } from '@utils/landingPageData';

interface LandingContentProps {
    isLoading: boolean;
    onResend: () => void;
}

const LandingContent = ({ isLoading, onResend }: LandingContentProps) => {
    const dispatch = useAppDispatch();

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 text-center md:max-w-lg md:gap-6 xxl:max-w-2xl">
            <img
                src={illustration}
                alt=""
                className="h-auto w-48 md:w-64 xxl:w-80"
            />
            <h1 className="font-roboto text-xl font-semibold leading-snug text-textHeadings md:text-2xl xxl:text-3xl">
                {LANDING_PAGE_CONTENT.heading}
            </h1>
            <p className="font-roboto text-sm font-normal leading-relaxed text-textBody md:text-base xxl:text-lg">
                {LANDING_PAGE_CONTENT.description}
            </p>
            <p className="font-roboto text-sm md:text-base">
                <span className="font-normal text-black">
                    {LANDING_PAGE_CONTENT.resendPrompt}{' '}
                </span>
                <button
                    type="button"
                    onClick={onResend}
                    disabled={isLoading}
                    className="font-semibold text-textLightRed hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading
                        ? LANDING_PAGE_CONTENT.resendCtaSending
                        : LANDING_PAGE_CONTENT.resendCta}
                </button>
            </p>
            <Link
                to={paths.auth.jwt.login}
                onClick={() => dispatch(forgotpasswordReset())}
                className="inline-flex h-12 w-36 items-center justify-center rounded-lg border border-textLightRed font-roboto text-sm font-medium text-textLightRed transition hover:bg-textLightRed/5 md:w-40 md:text-base"
            >
                {LANDING_PAGE_CONTENT.loginButtonLabel}
            </Link>
        </div>
    );
};

export default LandingContent;
