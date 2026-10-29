import type { FC } from 'react';

import { Flex, Typography, Image } from 'antd';
import { useNavigate } from 'react-router-dom';

import back from '@assets/svg/grayBack.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { resetPaymentData } from '../slices/payment';

interface CancelAndBackProps {
    className?: string;
}

const CancelAndBack: FC<CancelAndBackProps> = ({ className }) => {
    const dispatch = useAppDispatch();
    const { navigatePath } = useAppSelector(state => state.reducer.payment);
    const navigate = useNavigate();

    // const handleGoBack = () => {

    //     if (location.state) {
    //         const { from } = location.state;

    //         if (from && from.pathname && from.pathname.includes(paths.payments.paymentFailure)) {
    //             navigate(paths.dashboard.home);
    //         }
    //     } else {
    //         window.history.back();

    //         setTimeout(() => {
    //             dispatch(resetPaymentData());
    //         }, 10);
    //     }
    // };

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

    return (
        <Flex
            className={`${className} cursor-pointer`}
            align="center"
            gap={6}
            onClick={handleGoBack}
        >
            <Image
                src={back}
                alt="goback"
                preview={false}
                style={{ width: '1.2rem', height: '1.2rem' }}
                className="z-50"
            />
            <Typography.Text className="text-[#4D4D4D]">Cancel and Go Back</Typography.Text>
        </Flex>
    );
};

export default CancelAndBack;
