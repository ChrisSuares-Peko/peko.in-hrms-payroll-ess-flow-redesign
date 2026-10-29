import React, { useState } from 'react';

import { Button, Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import OtpModal from '@components/molecular/modals/OtpModal';
import { useAppSelector } from '@src/hooks/store';

import { sendRefundOtp } from '../api/refundTransaction';
import { refundTransactionSchema } from '../schema/refundTransactionSchema';

type ModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    handleRefund: (data: any) => Promise<any>;
};
const RefundTransactionModal = ({ open, handleCancel, data, handleRefund }: ModalProps) => {
    const usedDiscountAmount = Number(data?.order?.couponData?.usedCouponData?.discountAmount || 0);
    const amountInINR = Number(data?.order?.amountInINR || 0);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [formValues, setFormValues] = useState<{ refundAmount: string }>();
    const [otpEmail, setOtpEmail] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpSending, setIsOtpSending] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetOtp, setResetOtp] = useState(false);
    return (
        <>
            <CustomModalWithForm
                isLoading={isSubmitting}
                modalTitle="Refund Transaction"
                open={open}
                handleCancel={handleCancel}
                handleFormSubmit={async values => {
                    setFormValues(values);
                    setIsSubmitting(true);
                    const resp = await sendRefundOtp({
                        userId: id,
                        userType: role,
                    });
                    setIsSubmitting(false);
                    if (resp && resp.status) {
                        setOtpEmail(resp?.data?.email || '');
                        setIsOpen(true);
                    }
                }}
                initialValues={{
                    refundAmount: '',
                }}
                validationSchema={() =>
                    refundTransactionSchema((amountInINR - usedDiscountAmount || 0).toFixed(2))
                }
            >
                {({ setFieldValue, values }) => (
                    <Flex vertical className="w-full">
                        <Form layout="vertical">
                            <TextInput
                                name="refundAmount"
                                label="Refund Amount"
                                type="text"
                                placeholder="Please enter refund amount"
                                isRequired
                                classes="rounded-sm"
                                allowTwoDecimalsOnly
                                suffix={
                                    <Button
                                        type="link"
                                        size="small"
                                        danger
                                        onClick={() => {
                                            setFieldValue(
                                                'refundAmount',
                                                amountInINR - usedDiscountAmount || ''
                                            );
                                        }}
                                    >
                                        Max (₹{' '}
                                        {(amountInINR - usedDiscountAmount || 0).toFixed(2)})
                                    </Button>
                                }
                            />
                        </Form>
                    </Flex>
                )}
            </CustomModalWithForm>
            <OtpModal
                isOpen={isOpen}
                isLoading={isLoading!}
                handleCancel={() => setIsOpen(false)}
                isOtpSending={isOtpSending}
                onResend={async () => {
                    setIsOtpSending(true);
                    const res = await sendRefundOtp({
                        userId: id,
                        userType: role,
                    });
                    if (res && res.status) setOtpEmail(res?.data?.email || '');
                    setIsOtpSending(false);
                }}
                handleSubmit={async otp => {
                    setIsLoading(true);
                    handleRefund({ ...data, ...formValues, scope: 'email', otp }).then(res => {
                        if (!res) {
                            setIsLoading(false);
                            return;
                        }

                        setIsOpen(false);
                        setResetOtp(!resetOtp);
                        setIsLoading(false);
                        handleCancel();
                    });
                }}
                title="Confirmation"
                resetOtp={resetOtp}
                description={
                    otpEmail ? `OTP has been sent to ${otpEmail}` : undefined
                }
            />
        </>
    );
};

export default RefundTransactionModal;
