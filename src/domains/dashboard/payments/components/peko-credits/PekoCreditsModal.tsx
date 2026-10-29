import React, { useState } from 'react';

import { Flex, Skeleton, Pagination, PaginationProps, Modal, ConfigProvider } from 'antd';

import CouponCodeCard from '@src/domains/dashboard/PekoCredits/components/CouponCodeCard';
import { usePekoCreditListApi } from '@src/domains/dashboard/PekoCredits/hooks/usePekoCreditListApi';
import { useAppSelector } from '@src/hooks/hooks';
import useScreenSize from '@src/hooks/useScreenSize';

interface PekoCreditsModalProps {
    open: boolean;
    onClose: () => void;
}

const PekoCreditsModal: React.FC<PekoCreditsModalProps> = ({ open, onClose }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);
    const { sm } = useScreenSize();
    const { payload } = useAppSelector(state => state.reducer.payment);
    // A plan checkout (it has a plan and a billing cycle) also lists the subscription coupons made for that plan.
    const hasPlan = !!(payload?.packageId && payload?.subscriptionDuration);
    const { creditsData, isPekoCreditActive, isLoading, count } = usePekoCreditListApi(
        currentPage,
        limit,
        payload?.accessKey || '',
        hasPlan ? Number(payload?.packageId) : undefined,
        hasPlan ? String(payload?.subscriptionDuration) : undefined
    );

    const handlePageChange: PaginationProps['onChange'] = (page, pageSize) => {
        setCurrentPage(page);
        setLimit(pageSize);
    };

    const size = sm ? 'default' : 'small';

    return (
        <ConfigProvider
            theme={{
                components: {
                    Modal: {
                        borderRadiusLG: 16,
                    },
                },
            }}
        >
            <Modal
                open={open}
                onCancel={onClose}
                footer={null}
                width={720}
                centered
                title="View Coupons"
            >
                <Flex justify="center" vertical className="w-full min-h-48">
                    <Flex vertical gap={16} align="center" justify="center" className="mt-4 w-full">
                        {isLoading ? (
                            <Flex vertical className="justify-center w- gap-5">
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
                            <CouponCodeCard
                                creditsData={creditsData}
                                isAnimate={!isPekoCreditActive}
                            />
                        )}
                    </Flex>

                    {count > limit && (
                        <Pagination
                            className="text-center mt-6"
                            size={size}
                            total={count}
                            onChange={handlePageChange}
                            current={currentPage}
                            defaultPageSize={limit}
                        />
                    )}
                </Flex>
            </Modal>
        </ConfigProvider>
    );
};

export default PekoCreditsModal;
