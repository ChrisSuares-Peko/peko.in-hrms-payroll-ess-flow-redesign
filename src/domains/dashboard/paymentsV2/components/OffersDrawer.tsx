import { useState } from 'react';

import { Pagination, PaginationProps } from 'antd';

import DrawerModal from '@components/atomic/DrawerModal';
import { usePekoCreditListApi } from '@domains/dashboard/PekoCredits/hooks/usePekoCreditListApi';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import OfferCard from './OfferCard';
import noCouponIcon from '../assets/svg/no-coupon-available.svg';

interface OffersDrawerProps {
    open: boolean;
    onClose: () => void;
    onApplyOffer: (code: string) => void;
    isApplied: boolean;
    appliedCouponCode: string;
}

const OfferCardSkeleton = () => (
    <div
        className="flex w-full flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        aria-hidden="true"
    >
        <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
            <div className="h-3 w-36 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-200 motion-reduce:animate-none" />
    </div>
);

const EmptyOffers = () => (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 py-7 text-center">
        <img src={noCouponIcon} alt="" className="h-40 w-40" />
        <p className="max-w-[249px] text-sm text-black">No coupons are currently available.</p>
    </div>
);

const OffersDrawer = ({
    open,
    onClose,
    onApplyOffer,
    isApplied,
    appliedCouponCode,
}: OffersDrawerProps) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);
    const { sm } = useScreenSize();
    const { payload } = useAppSelector(state => state.reducer.payment);
    // A plan checkout (it has a plan and a billing cycle) also lists the subscription coupons made for that plan.
    const hasPlan = !!(payload?.packageId && payload?.subscriptionDuration);
    const { creditsData, isLoading, count } = usePekoCreditListApi(
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

    let content = <EmptyOffers />;
    if (isLoading) {
        content = (
            <>
                {Array.from({ length: 3 }).map((_, index) => (
                    <OfferCardSkeleton key={index} />
                ))}
            </>
        );
    } else if (creditsData.length > 0) {
        content = (
            <>
                {creditsData.map((offer, index) => (
                    <div
                        key={index}
                        className="animate-fade-in motion-reduce:animate-none"
                        style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                    >
                        <OfferCard
                            offer={offer}
                            onApply={onApplyOffer}
                            onCopy={onClose}
                            isApplied={
                                isApplied &&
                                offer.couponCode.toUpperCase() === appliedCouponCode.toUpperCase()
                            }
                            applyDisabled={isApplied}
                        />
                    </div>
                ))}
            </>
        );
    }

    return (
        <DrawerModal
            open={open}
            handleCancel={onClose}
            modalTitle="View Coupons"
            closeIcon
            width={520}
        >
            <div className="flex w-full flex-col gap-3">{content}</div>

            {count > limit && (
                <Pagination
                    className="mt-6 text-center"
                    size={sm ? 'default' : 'small'}
                    total={count}
                    onChange={handlePageChange}
                    current={currentPage}
                    defaultPageSize={limit}
                />
            )}
        </DrawerModal>
    );
};

export default OffersDrawer;
