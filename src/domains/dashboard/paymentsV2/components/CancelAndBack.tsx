import type { FC } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { resetPaymentData } from '../../payments/slices/payment';
import backIcon from '../assets/svg/back-cancel.svg';

interface CancelAndBackProps {
    className?: string;
    variant?: 'button' | 'link';
}

const CancelAndBack: FC<CancelAndBackProps> = ({ className = '', variant = 'button' }) => {
    const dispatch = useAppDispatch();
    const { navigatePath } = useAppSelector(state => state.reducer.payment);
    const navigate = useNavigate();

    const handleGoBack = () => {
        if (navigatePath && navigatePath !== 'dashboard') {
            navigate(navigatePath);
        } else {
            window.history.back();

            setTimeout(() => {
                dispatch(resetPaymentData());
            }, 10);
        }
    };

    if (variant === 'link') {
        return (
            <button
                type="button"
                onClick={handleGoBack}
                className={`w-full rounded text-center text-sm font-medium text-lightRed transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2 ${className}`}
            >
                Cancel and go back
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleGoBack}
            className={`inline-flex w-fit shrink-0 self-start items-center gap-2 rounded-full text-sm text-[#161616] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2 ${className}`}
        >
            <img src={backIcon} alt="" className="h-6 w-6 sm:h-7 sm:w-7" />
            <span>Cancel and go back</span>
        </button>
    );
};

export default CancelAndBack;
