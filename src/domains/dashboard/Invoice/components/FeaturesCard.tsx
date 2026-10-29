import React from 'react';

import { Flex, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import useScreenSize from '@src/hooks/useScreenSize';
import { showToast } from '@src/slices/apiSlice';

import { resetDetails } from '../slices/InvoicesSlices';

interface IconCardProps {
    icon: string;
    title: string;
    path?: any;
    kybStatus?: 'PENDING' | 'IN PROGRESS' | 'UNDER REVIEW' | 'APPROVED' | 'REJECTED';
    paymentLinkCommission?: {
        isPercentage: boolean;
        charge: string;
    };
}

const { Text } = Typography;

const FeaturesCard = ({ icon, title, path, kybStatus, paymentLinkCommission }: IconCardProps) => {
    const { md, xl, xs } = useScreenSize();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleClick = async (e: React.MouseEvent) => {
        if (title === 'Payment Links') {
            let message;
            switch (kybStatus) {
                case 'PENDING':
                    message = 'Please complete your KYB to access the Payment Link service.';
                    break;
                case 'IN PROGRESS':
                    message = 'Please complete your KYB to access the Payment Link service.';
                    break;
                case 'UNDER REVIEW':
                    message = 'Your KYB process under review. Please check again later';
                    break;

                case 'APPROVED':
                    // If approved, navigate to the payment links as normal
                    navigate(path, { state: paymentLinkCommission });
                    return; // Exit the function
                case 'REJECTED':
                    message =
                        'Your KYB verification was rejected. Please check the details and try again.';
                    break;
                default:
                    message = 'An unknown status has been encountered. Please contact support.';
            }
            // Show the toast message for the specific status
            dispatch(
                showToast({
                    description: message,
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(resetDetails());
        navigate(path);
    };
    return (
        <Flex
            onClick={handleClick}
            vertical
            // align="center"
            className="w-full mt-2 transition duration-300 transform cursor-pointer md:h-56 xl:h-56 bg-bgIconCard rounded-2xl sm:rounded-3xl hover:scale-105"
        >
            <Flex vertical justify="center" align="center" className="xs:mt-2 md:mt-12 xl:mt-0">
                <Flex
                    // className={`w-[9.2rem] h-32 sm:w-[13rem] sm:h-40 md:w-[11rem] md:h-36 lg:w-[10rem] lg:h-36 xl:w-[20.5rem] xl:h-60  bg-bgIconCard rounded-2xl sm:rounded-3xl `}
                    className="h-32 sm:h-40 md:h-36 lg:w-[10rem] lg:h-36 xl:h-60 w-full"
                    align="center"
                    justify="center"
                    vertical
                >
                    <ReactSVG
                        className="more-services"
                        beforeInjection={svg => {
                            if (xs) {
                                svg.setAttribute('style', 'width: 50px; height: 50px;');
                            } else if (xl) {
                                svg.setAttribute('style', 'width: 90px; height: 90px;');
                            } else if (md) {
                                svg.setAttribute('style', 'width: 70px; height: 70px;');
                            }
                        }}
                        src={icon}
                    />
                    <Text className="text-[.65rem] text-center sm:text-[.975rem] min-h-9 sm:min-h-14 line-clamp-2 pt-1 sm:pt-3">
                        {title}
                    </Text>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default React.memo(FeaturesCard);
