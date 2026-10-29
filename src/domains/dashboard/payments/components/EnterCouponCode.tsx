import React, { useState } from 'react';

import { Flex, Typography, Button, Form, Card, Image } from 'antd';
import { Formik, FormikProps } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import walletIcon from '@domains/dashboard/plans/assets/icons/wallet.svg';
import { couponSchema } from '@domains/dashboard/plans/schema/index';

import PekoCreditsModal from './peko-credits/PekoCreditsModal';

export interface EnterCouponCodeProps {
    applyCoupon: (couponCode: string, setSubmitting: (isSubmitting: boolean) => void) => void;
    isApplied: boolean;
    couponFormikRef: React.MutableRefObject<FormikProps<{ couponCode: string }> | null>;
    setCouponCode: React.Dispatch<React.SetStateAction<string>>;
    removeCoupon: () => void;
    isDisabled: boolean;
}

const EnterCouponCode = ({
    applyCoupon,
    isApplied,
    setCouponCode,
    removeCoupon,
    couponFormikRef,
    isDisabled,
}: EnterCouponCodeProps) =>{ 
    const [showPekoModal, setShowPekoModal] = useState(false);
    return(
    <>
        <Card
            size="small"
            className="flex flex-col rounded-xl border border-solid p-4"
            bordered={false}
            styles={{ body: { padding: '0px 12px' } }}
        >
            <Flex justify="space-between" align="flex-start" vertical gap={5}>
                <Flex justify="space-between" className="w-full" align="center">
                        <Typography.Text className="text-sm sm:text-base font-medium">
                            Apply Coupon Code
                        </Typography.Text>
                        <Flex
                            className="text-xs underline cursor-pointer"
                            onClick={() => setShowPekoModal(true)}
                        >
                            View Offers
                        </Flex>
                    </Flex>
                <Typography.Text className="text-xs sm:text-sm font-normal text-gray-500">
                    Have a discount/coupon code to redeem
                </Typography.Text>
                <Formik
                    innerRef={couponFormikRef}
                    initialValues={{ couponCode: '' }}
                    onSubmit={(values, { setSubmitting }) => {
                        applyCoupon(values.couponCode, setSubmitting);
                    }}
                    validationSchema={couponSchema}
                    enableReinitialize={false}
                >
                    {({ handleSubmit, handleReset, setFieldValue, isSubmitting }) => (
                        <Form
                            onFinish={handleSubmit}
                            onReset={handleReset}
                            className="flex w-full gap-4 mt-1 align-middle"
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
                                    handleChange={value => {
                                        setFieldValue(
                                            'couponCode',
                                            value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase()
                                        );
                                        setCouponCode(
                                            value.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase()
                                        );
                                    }}
                                />
                            </div>

                            {isApplied ? (
                                <Button
                                    // htmlType="reset"
                                    type="primary"
                                    className="w-1/3 h-10"
                                    danger
                                    onClick={removeCoupon}
                                    disabled={isDisabled}
                                >
                                    Remove
                                </Button>
                            ) : (
                                <Button
                                    htmlType="submit"
                                    type="primary"
                                    className="w-1/3 h-10"
                                    danger
                                    loading={isSubmitting}
                                    disabled={isDisabled}
                                >
                                    Apply
                                </Button>
                            )}
                        </Form>
                    )}
                </Formik>
            </Flex>
        </Card>
          {showPekoModal && (
                <PekoCreditsModal open={showPekoModal} onClose={() => setShowPekoModal(false)} />
            )}
        {isApplied && (
            <Flex
                className="w-full h-full justify-center px-5 py-4 text-xs duration-100 ease-in-out border border-gray-200 border-solid bg-bgGreenPayment rounded-xl"
                align="center"
                gap={24}
            >
                <Image src={walletIcon} alt="wallet" preview={false} height={20} className="" />
                <Typography.Text className="text-sm font-normal text-textWhite">
                    Congratulations! Your coupon code applied to payment
                </Typography.Text>
            </Flex>
        )}
    </>
)};

export default EnterCouponCode;
