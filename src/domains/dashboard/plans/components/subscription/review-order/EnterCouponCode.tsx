import React from 'react';

import { Flex, Typography, Button, Form } from 'antd';
import { Formik } from 'formik';
import { ReactSVG } from 'react-svg';

import TextInput from '@components/atomic/inputs/TextInput';
import walletIcon from '@domains/dashboard/plans/assets/icons/wallet.svg';

import { couponSchema } from '../../../schema';

export interface EnterCouponCodeProps {
    applyCoupon: (couponCode: string, totalPrice: number) => void;
    removeCoupon: () => void;
    totalPrice: number;
    isApplied: boolean;
    couponLoading: boolean;
}

const EnterCouponCode = ({
    applyCoupon,
    removeCoupon,
    totalPrice,
    isApplied,
    couponLoading,
}: EnterCouponCodeProps) => (
    <>
        <Flex
            className="w-full h-full px-5 pt-5 pb-2 text-xs border border-gray-200 border-solid sm:px-6 rounded-xl"
            justify="space-between"
            align="flex-start"
            vertical
            gap={5}
        >
            <Typography.Text className="text-sm font-medium sm:text-lg">
                Apply Coupon Code
            </Typography.Text>
            <Typography.Text className="text-xs font-normal text-gray-500 sm:text-base">
                Have a discount/coupon code to redeem
            </Typography.Text>
            <Formik
                initialValues={{ couponCode: '' }}
                onSubmit={values => {
                    applyCoupon(values.couponCode, totalPrice);
                }}
                onReset={(values, { setSubmitting, setErrors }) => {
                    setSubmitting(false);
                    removeCoupon();
                    setTimeout(() => setErrors({}), 100);
                }}
                validationSchema={couponSchema}
            >
                {({ handleSubmit, handleReset, setFieldValue }) => (
                    <Form
                        onFinish={handleSubmit}
                        onReset={handleReset}
                        className="flex w-full gap-4 mt-5 align-middle"
                        layout="vertical"
                    >
                        <div className="w-2/3">
                            <TextInput
                                name="couponCode"
                                placeholder="Enter code"
                                type="text"
                                size="large"
                                isDisabled={isApplied}
                                maxLength={25}
                                handleChange={value =>
                                    setFieldValue(
                                        'couponCode',
                                        value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase()
                                    )
                                }
                            />
                        </div>

                        {isApplied ? (
                            <Button htmlType="reset" type="primary" className="w-1/3 h-10" danger>
                                Remove
                            </Button>
                        ) : (
                            <Button
                                htmlType="submit"
                                type="primary"
                                className="w-1/3 h-10"
                                danger
                                loading={couponLoading}
                            >
                                Apply
                            </Button>
                        )}
                    </Form>
                )}
            </Formik>
        </Flex>
        {isApplied && (
            <Flex
                className="w-full h-full px-5 py-4 text-xs duration-100 ease-in-out border border-gray-200 border-solid bg-bgGreenPayment rounded-xl"
                align="center"
                gap={24}
            >
                <ReactSVG src={walletIcon} />
                <Typography.Text className="text-sm font-normal text-textWhite">
                    Congratulations! Your coupon code applied to payment
                </Typography.Text>
            </Flex>
        )}
    </>
);

export default EnterCouponCode;
