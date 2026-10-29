import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { Button } from 'antd';
import { Formik, FormikProps } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import OffersDrawer from './OffersDrawer';
import chevronIcon from '../assets/svg/chevron-down.svg';
import { paymentCouponSchema } from '../schema/couponSchema';

const CouponAppliedPopup = lazy(() => import('./CouponAppliedPopup'));

export interface CouponCodeCardProps {
    applyCoupon: (couponCode: string, setSubmitting: (isSubmitting: boolean) => void) => void;
    isApplied: boolean;
    appliedCouponCode: string;
    couponFormikRef: React.MutableRefObject<FormikProps<{ couponCode: string }> | null>;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    removeCoupon: () => void;
    isDisabled: boolean;
}

const CouponCodeCard = ({
    applyCoupon,
    isApplied,
    appliedCouponCode,
    setCouponCode,
    removeCoupon,
    couponFormikRef,
    isDisabled,
}: CouponCodeCardProps) => {
    const [showOffersDrawer, setShowOffersDrawer] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const wasAppliedRef = useRef(isApplied);

    useEffect(() => {
        if (isApplied && !wasAppliedRef.current) {
            setShowSuccessPopup(true);
        }
        wasAppliedRef.current = isApplied;
    }, [isApplied]);

    const handleApplyOffer = (code: string) => {
        if (isApplied) return;
        setShowOffersDrawer(false);
        couponFormikRef.current?.setFieldValue('couponCode', code);
        setCouponCode(code);
        applyCoupon(code, isSubmitting => couponFormikRef.current?.setSubmitting(isSubmitting));
    };

    return (
        <div className="w-full rounded-2xl bg-white p-6 shadow-[0_1.5px_8.25px_rgba(0,0,0,0.06)]">
            <h2 className="mb-1 text-lg font-bold text-slate-900">Apply Coupon Code</h2>
            <p className="mb-3 text-xs text-slate-500">Have a discount/coupon code to redeem</p>
            <Formik
                innerRef={couponFormikRef}
                initialValues={{ couponCode: '' }}
                onSubmit={(values, { setSubmitting }) => {
                    applyCoupon(values.couponCode, setSubmitting);
                }}
                validationSchema={paymentCouponSchema}
                enableReinitialize={false}
            >
                {({ handleSubmit, isSubmitting, values }) => (
                    <form onSubmit={handleSubmit} className="flex w-full items-start gap-3">
                        <div className="flex-1">
                            <TextInput
                                name="couponCode"
                                placeholder="Enter code"
                                type="text"
                                size="large"
                                isDisabled={isDisabled || isApplied}
                                maxLength={25}
                                formItemClass="mb-0"
                                classes="!h-11 !rounded-lg !border-slate-200 !text-sm"
                                convertToUppercase
                                allowedInputKeys={value => value.replace(/[^a-zA-Z0-9 ]/g, '')}
                                handleChange={setCouponCode}
                            />
                        </div>
                        {isApplied ? (
                            <Button
                                htmlType="button"
                                type="primary"
                                danger
                                className="!h-11 shrink-0 !px-7"
                                onClick={e => {
                                    e.preventDefault();
                                    removeCoupon();
                                }}
                                disabled={isDisabled}
                            >
                                Remove
                            </Button>
                        ) : (
                            <Button
                                htmlType="submit"
                                type="primary"
                                danger
                                className="!h-11 shrink-0 !px-7"
                                loading={isSubmitting}
                                disabled={isDisabled || !values.couponCode.trim()}
                            >
                                Apply
                            </Button>
                        )}
                    </form>
                )}
            </Formik>
            {isApplied && (
                <p className="mt-3 text-sm font-medium text-[#08a055]">
                    Congratulations, coupon code successfully redeemed
                </p>
            )}
            <button
                type="button"
                onClick={() => setShowOffersDrawer(true)}
                className="mt-4 flex w-full items-center justify-between rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed"
            >
                <span className="text-sm font-medium text-lightRed">View Available Offers</span>
                <img src={chevronIcon} alt="" className="h-4 w-4 -rotate-90" />
            </button>
            {showOffersDrawer && (
                <OffersDrawer
                    open
                    onClose={() => setShowOffersDrawer(false)}
                    onApplyOffer={handleApplyOffer}
                    isApplied={isApplied}
                    appliedCouponCode={appliedCouponCode}
                />
            )}
            {showSuccessPopup && (
                <Suspense fallback={null}>
                    <CouponAppliedPopup
                        open
                        couponCode={appliedCouponCode}
                        onClose={() => setShowSuccessPopup(false)}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default CouponCodeCard;
