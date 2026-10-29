import React, { useEffect, useState } from 'react';

import { Flex, Typography, Skeleton, Pagination, PaginationProps } from 'antd';
import Lottie from 'react-lottie';

import animation from '@assets/animation/trophy-animation.json';
import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CouponCodeCard from '../components/CouponCodeCard';
import TermsAndConditionModal from '../components/Modals/TermsAndCondtionModal';
import { usePekoCreditListApi } from '../hooks/usePekoCreditListApi';

const PekoCredits = () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const { sm } = useScreenSize();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const { creditsData, isPekoCreditActive, pekoCreds, isLoading, count } = usePekoCreditListApi(
        currentPage,
        limit,
        undefined
    );
    const [showAnimation, setShowAnimation] = useState(true);
    const defaultOptions = {
        loop: false,
        autoplay: true,
        animationData: animation,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    const showModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    const handlePageChange: PaginationProps['onChange'] = (page, length) => {
        setCurrentPage(page);
        setLimit(length);
    };

    const size = sm ? 'default' : 'small';

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (!isLoading) {
            timer = setTimeout(() => {
                setShowAnimation(false);
            }, 3000);
        }
        return () => {
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [isLoading]);
    return (
        <Flex justify="center" vertical className="w-full max-w-4xl mx-auto px-0 sm:px-5">
            {!isLoading && creditsData.length !== 0 && Number(pekoCreds) !== 0 && (
                <>
                    {!isPekoCreditActive && showAnimation && (
                        <Lottie options={defaultOptions} height={100} width={100} />
                    )}

                    <Flex justify="center">
                        <Typography.Text
                            className="text-xl md:text-3xl font-medium text-center"
                            style={{ lineHeight: '1.5' }}
                        >
                            Congratulations, you&apos;ve earned up to
                            <span className="text-bgOrange">
                                {' '}
                                ₹ {formatNumberWithLocalString(Number(pekoCreds))}
                            </span>{' '}
                            in Peko Credits
                        </Typography.Text>
                    </Flex>

                    <Flex className="text-center mt-4" justify="center">
                        <Typography.Link
                            onClick={showModal}
                            style={{ color: '#FF4D4F', textDecoration: 'underline' }}
                        >
                            Terms and conditions apply
                        </Typography.Link>
                    </Flex>
                </>
            )}

            <Flex vertical gap={16} align="center" justify="center" className="mt-10 bg-red w-full">
                {isLoading ? (
                    <Flex vertical className="justify-center w-4/5 gap-5">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton.Button
                                key={index}
                                active
                                block
                                style={{
                                    height: '100px',
                                    margin: '0 auto',
                                    borderRadius: '16px',
                                }}
                            />
                        ))}
                    </Flex>
                ) : (
                    <CouponCodeCard creditsData={creditsData} isAnimate={!isPekoCreditActive} />
                )}
            </Flex>
            {Number(count) > limit && (
                <Pagination
                    className="sm:text-center text-center mt-10"
                    size={size}
                    total={count}
                    onChange={handlePageChange}
                    current={currentPage}
                    defaultPageSize={limit}
                    // showSizeChanger
                />
            )}

            <TermsAndConditionModal isOpen={isModalVisible} handleClose={closeModal} />
        </Flex>
    );
};

export default PekoCredits;
