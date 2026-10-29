import { useState } from 'react';

import {
    CheckOutlined,
    CopyOutlined,
    InfoCircleOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import moment from 'moment';

import type { CouponCode } from '@domains/dashboard/PekoCredits/types/type';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { formatNumberWithLocalString } from '@utils/priceFormat';

interface OfferCardProps {
    offer: CouponCode;
    onApply?: (code: string) => void;
    isApplied?: boolean;
    applyDisabled?: boolean;
    onCopy?: () => void;
}

const APPLY_ANIMATION_MS = 220;

const getCardStateClasses = (isApplying: boolean, isApplied: boolean) => {
    if (isApplying) return 'scale-[0.98] border-lightRed bg-[#fff6f6] opacity-80';
    if (isApplied) return 'scale-100 border-emerald-300 bg-emerald-50/60';
    return 'scale-100 hover:shadow-[0_1.5px_8.25px_rgba(0,0,0,0.06)]';
};

const OfferCard = ({
    offer,
    onApply,
    isApplied = false,
    applyDisabled = false,
    onCopy,
}: OfferCardProps) => {
    const dispatch = useAppDispatch();
    const [copied, setCopied] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    const hasExtraInfo = Number(offer.minimumPurchase) > 0 || Number(offer.maximumDiscount) > 0;

    const handleCopy = () => {
        if (offer.isClaimed) return;
        navigator.clipboard.writeText(offer.couponCode);
        dispatch(showToast({ description: 'Coupon code copied to clipboard', variant: 'success' }));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        onCopy?.();
    };

    const handleApply = () => {
        if (offer.isClaimed || isApplying || isApplied || applyDisabled || !onApply) return;
        setIsApplying(true);
        setTimeout(() => onApply(offer.couponCode), APPLY_ANIMATION_MS);
    };

    return (
        <div
            className={`flex w-full flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition-all duration-200 ease-out motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${getCardStateClasses(isApplying, isApplied)}`}
        >
            <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                        {offer.serviceName}
                    </p>
                    {offer.isClaimed && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                            Claimed
                        </span>
                    )}
                    {isApplied && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckOutlined /> Applied
                        </span>
                    )}
                </div>
                {!offer.isClaimed && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-lightRed">
                        <span>Valid till {moment(offer.validity).format('MMM D, YYYY')}</span>
                        {hasExtraInfo && (
                            <Tooltip
                                color="white"
                                overlayInnerStyle={{ color: '#171717', width: '260px' }}
                                title={
                                    <div className="flex flex-col gap-1 text-xs">
                                        {Number(offer.minimumPurchase) > 0 && (
                                            <span>
                                                Minimum purchase: ₹{' '}
                                                {formatNumberWithLocalString(offer.minimumPurchase)}
                                            </span>
                                        )}
                                        {Number(offer.maximumDiscount) > 0 && (
                                            <span>
                                                Maximum discount: ₹{' '}
                                                {formatNumberWithLocalString(offer.maximumDiscount)}
                                            </span>
                                        )}
                                    </div>
                                }
                            >
                                <InfoCircleOutlined className="cursor-help text-slate-400" />
                            </Tooltip>
                        )}
                        {offer.couponType === 'SUBSCRIPTION' && offer.billingType && (
                            <span className="text-slate-400">
                                · Valid for{' '}
                                {offer.billingType === 'ANNUALLY' ? 'yearly' : 'monthly'}{' '}
                                subscription
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
                <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                    {offer.discountType === 'FLAT'
                        ? `₹ ${formatNumberWithLocalString(offer.discount)}`
                        : `${offer.discount}% off`}
                </p>
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={offer.isClaimed}
                    className={`flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed ${
                        offer.isClaimed
                            ? 'cursor-not-allowed border-slate-200 text-slate-400'
                            : 'border-lightRed text-lightRed hover:bg-[#fff6f6]'
                    }`}
                >
                    <span>{copied ? 'Copied' : offer.couponCode}</span>
                    {copied ? <CheckOutlined /> : <CopyOutlined />}
                </button>
                {onApply && !offer.isClaimed && (
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={isApplying || isApplied || applyDisabled}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
                            isApplied
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-lightRed text-white hover:opacity-90 disabled:opacity-70'
                        }`}
                    >
                        {isApplying && <LoadingOutlined />}
                        {!isApplying && isApplied && (
                            <>
                                <CheckOutlined /> Applied
                            </>
                        )}
                        {!isApplying && !isApplied && 'Apply'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default OfferCard;
